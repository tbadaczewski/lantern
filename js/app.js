(function () {
   'use strict';
}());

var lanternApp = angular.module('lanternApp', [
	'ngAnimate',
    'ngRoute',
	'ngTouch',
    'ngSanitize',
    'lanternControllers',
    'mgcrea.pullToRefresh'
]);

lanternApp.run(function($rootScope, $http, geolocation, geoencoder, loadstations, loadoutages) {
    $rootScope.menu = "close";

    document.addEventListener('deviceready', function() {
        localStorage.SessionID = guid();

        intializeMe();
    }, false);


    function intializeMe() {
        getAppVersion(function(version) {
            $rootScope.version = "v" + version;
        });

        geolocation().then(function(position) {
            $rootScope.position = position;

            geoencoder('latLng').then(function(address) {
                $rootScope.address = address[0];
                $rootScope.county = address[1];
                $rootScope.state = address[2];

                loadstations().then(function(stations) {
                    $rootScope.stations = stations;
                    $rootScope.$emit('stationsUpdated', new Date());
                });

                loadoutages().then(function(outages) {
                    $rootScope.outages = outages;
                    $rootScope.$emit('outagesUpdated', new Date());
                });
            });
        });
    }

    function guid() {
        var sGuid="";

        for (var i=0; i<32; i++) {
            sGuid += Math.floor(Math.random()*0xF).toString(0xF);
        }

        return sGuid;
    }
});

lanternApp.config(function($sceProvider) {
    $sceProvider.enabled(false);
});

lanternApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
        when('/', {
            templateUrl: 'partials/main.html',
            controller: 'MainCtrl'
        }).
        when('/station-list', {
            templateUrl: 'partials/station-list.html',
            controller: 'StationListCtrl'
        }).
        when('/station-map', {
            templateUrl: 'partials/station-map.html',
            controller: 'StationMapCtrl'
        }).
        when('/outage-list', {
            templateUrl: 'partials/outage-list.html',
            controller: 'OutageListCtrl'
        }).
        when('/outage-map', {
            templateUrl: 'partials/outage-map.html',
            controller: 'OutageMapCtrl'
        }).
        when('/tips', {
            templateUrl: 'partials/tips.html',
            controller: 'TipsCtrl'
        }).
        when('/alternative', {
            templateUrl: 'partials/alternative.html',
            controller: 'AlternativeCtrl'
        }).
        when('/about', {
            templateUrl: 'partials/about.html',
            controller: 'AboutCtrl'
        }).
        when('/terms', {
            templateUrl: 'partials/terms.html',
            controller: 'TermsCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
    }
]);

lanternApp.factory('validatetag', ['$window',
    function ($window) {
        return function ($id) {
            var now = new Date(), last = new Date();
            var count = 0, diffMs = 0, diffMins = 0;
            var tags = eval(localStorage.getItem("tags"));
            var limit = 15;
            
            if(tags !== null) {
                for(var i = 0; i < tags.length; i++) {
                    if(tags[i].station.id == $id) {
                        last = new Date(tags[i].station.lastupdated);
                        now = new Date();
                        count = tags[i].station.count;
                        diffMs = last - now;
                        diffMins = Math.abs(Math.round(diffMs / 60000)); // minutes

                        if(diffMins <= limit && count >= 1) {
                            $window.navigator.notification.alert('You must wait at least 15 minutes to tag THIS station again.', null, 'Exceeded Tag Limit', 'Close');
                            
                            return false;
                        } else if(diffMins > limit && count >= 1) {
                            tags[i].station.count = 0;
                            localStorage.setItem("tags", JSON.stringify(tags));
                        }
                    }
                }
            }

            return true;
        };
    }
]);

lanternApp.factory('geolocation', ['$q', '$window',
    function ($q, $window) {
        return function () {
            var deferred = $q.defer();
            var options = { maximumAge: 30000, timeout: 30000, enableHighAccuracy: false };

            function onSuccess(position) {
                deferred.resolve(position);
            }

            function onError(error) {
                $window.navigator.notification.alert('There was a problem locating your position, please manually enter your city, state or zipcode.', null, 'Failed to Locate Position', 'Close');
                deferred.resolve(null);
            }

            navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

            return deferred.promise;
        };
    }
]);

lanternApp.factory('geoencoder', ['$q', '$rootScope', 'loadcounty',
    function ($q, $rootScope, loadcounty) {
        return function ($type) {
            var deferred = $q.defer();
            var geocoder = new google.maps.Geocoder();
            var position = $rootScope.position;
            var params = null;

            if($type == 'latLng') {
                params = {'latLng': new google.maps.LatLng(position.coords.latitude, position.coords.longitude)};
            } else {
                params = {'address': $rootScope.address};
            }

            geocoder.geocode(params, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var location = new Array("","","");

                    //Formatted Address
                    location[0] = results[0].formatted_address;

                    //County
                    for(var i=0; i < results[0].address_components.length; i++) {
                        if (results[0].address_components[i].types[0] == "administrative_area_level_2") {
                            location[1] = results[0].address_components[i].long_name.toLowerCase().replace("county","").trim();
                        }
                    }

                    //State
                    for(var j=0; j < results[0].address_components.length; j++) {
                        if (results[0].address_components[j].types[0] == "administrative_area_level_1") {
                            location[2] = results[0].address_components[j].short_name;
                        }
                    }

                    if($type == 'address') {
                        $rootScope.position = {"coords" : {"latitude" : results[0].geometry.location.lat(), "longitude" : results[0].geometry.location.lng()}};
                    }
                    
                    if(location[1] === '') {
                        loadcounty().then(function(data) {
                            location[1] = data;
                            deferred.resolve(location);
                        });
                    } else {
                        deferred.resolve(location);
                    }
                } else {
                    deferred.resolve(null);
                }
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadphone', ['$q', '$http',
    function ($q, $http) {
        return function (id) {
            var deferred = $q.defer();

            $http({method: 'GET', url: 'https://doelanternapi.parseapp.com/gasstation/phonenumber/' + id, headers: {'SessionID': localStorage.SessionID}}).success(function (data) {
                deferred.resolve(eval(data));
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadcounty', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function (id) {
            var deferred = $q.defer();

            $http({method: 'GET', url: 'https://data.fcc.gov/api/block/2010/find?format=json&latitude=' + $rootScope.position.coords.latitude + '&longitude=' + $rootScope.position.coords.longitude + '&showall=true'}).success(function (data) {
                deferred.resolve(eval(data).County.name);
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadstations', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function (scope) {
            var deferred = $q.defer();

            $http({method: 'GET', url: 'https://doelanternapi.parseapp.com/gasstations/search/' + encodeURIComponent($rootScope.address), headers: {'SessionID': localStorage.SessionID}}).success(function (data) {
                if(typeof data[0] !== 'undefined') {
                    deferred.resolve(eval(data));
                } else {
                    deferred.resolve(null);
                }
            }).error(function(data) {
                deferred.resolve(null);
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadoutages', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function (scope) {
            var deferred = $q.defer();

            $http({method: 'GET', url: 'https://doelanternapi.parseapp.com/utilitycompany/data/territory/' + $rootScope.state + '/' + $rootScope.county, headers: {'SessionID': localStorage.SessionID}}).success(function (data) {
                if(typeof data[0] !== 'undefined') {
                    deferred.resolve(eval(data));
                } else {
                    deferred.resolve(null);
                }
            }).error(function(data) {
                deferred.resolve(null);
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('tagstatus', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function (id, status) {
            var deferred = $q.defer();
            var text_status = 'open';

            if(status === 0) {
                text_status = 'closed';
            }

            $http({method: 'GET', url: 'https://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + id + '/' + text_status, headers: {'SessionID': localStorage.SessionID}}).success(function (data) {
                deferred.resolve(eval(data));
            });

            return deferred.promise;
        };
    }
]);

lanternApp.directive('searchbar', function($timeout, $rootScope) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        template: "<input ng-transclude />",
        link: function (scope, element, attrs) {
            scope.$watch('searchfocus', function(newValue, oldValue) {
                if (newValue !== oldValue) {
                    $timeout(function() {
                        if(newValue === true) {
                            scope.focus();
                        } else {
                            scope.blur();
                        }
                    }, 500);
                }
            });

            element.bind("keyup", function($event) {
                if($event.keyCode == 13) {
                    $rootScope.$emit('addressUpdated', new Date());
                }
            });

            scope.focus = function() {
                if(element[0].getAttribute("data-focus") == "false") {
                    element[0].focus();
                    element[0].setAttribute("data-focus", "true");

                    if (typeof SoftKeyboard !== 'undefined') {
                        SoftKeyboard.show();
                    }
                }
            };

            scope.blur = function() {
                if(element[0].getAttribute("data-focus") == "true") {
                    element[0].blur();
                    element[0].setAttribute("data-focus", "false");

                    if (typeof SoftKeyboard !== 'undefined') {
                        SoftKeyboard.hide();
                    }
                }
            };
        }
    };
});

lanternApp.directive('googlemap', function($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div></div>',
        link: function(scope, element, attrs) {
            var intialized = false;
            var prev = null;
            var map = null;
            var mapmarkers = [];
            var mapOptions = {
                zoom: 12,
                center: new google.maps.LatLng($rootScope.position.coords.latitude, $rootScope.position.coords.longitude),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                panControl: false,
                zoomControl: false,
                streetViewControl: false
            };
            
            map = new google.maps.Map(document.getElementById(attrs.id), mapOptions);

            google.maps.event.addListener(map, 'tilesloaded', function(e) {
                google.maps.event.addListener(map, 'click', function(e) {
                    scope.$apply(function() {
                        scope.showdetails = null;
                    });

                    if(scope.prev !== null) {
                        var normal = {
                            url: scope.prev.icon.url,
                            scaledSize: new google.maps.Size(25,40)
                        };

                        scope.prev.setIcon(normal);
                    }
                });

                if(!intialized) {
                    scope.init();
                }
            });

            scope.init = function () {
                for (var i = 0; i < mapmarkers.length; i++) {
                    mapmarkers[i].setMap(null);
                }

                mapmarkers = [];

                scope.addMarkers(scope.markers);
            };

            scope.addMarkers = function (markers) {
                var bounds = new google.maps.LatLngBounds();

                angular.forEach(markers, function (marker) {
                    var size = new google.maps.Size(25,40);
                    var myLatlng = new google.maps.LatLng(marker.latitude, marker.longitude);
                    var point = new google.maps.Marker({
                        position: myLatlng,
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                        map: map,
                        id : marker.id,
                        operatingStatus : marker.operatingStatus,
                        station : marker.station,
                        address : marker.address,
                        city : marker.city,
                        region : marker.region,
                        zip : marker.zip,
                        "icon" : {
                            url: 'img/pin-' + marker.operatingStatus.toLowerCase() + '.png',
                            scaledSize: size
                        }
                    });

                    mapmarkers.push(point);
                    bounds.extend(myLatlng);

                    google.maps.event.addListener(point, 'click', function() {
                        scope.$apply(function () {
                            if (typeof scope.prev !== "undefined") {
                                var normal = {
                                    url: scope.prev.icon.url,
                                    scaledSize: new google.maps.Size(25,40)
                                };

                                scope.prev.setIcon(normal);
                            }

                            var large = {
                                url: point.icon.url,
                                scaledSize: new google.maps.Size(50,80)
                            };

                            point.setIcon(large);

                            scope.stationid = point.id;
                            scope.operatingStatus = point.operatingStatus;
                            scope.station = point.station;
                            scope.latitude = point.latitude;
                            scope.longitude = point.longitude;
                            scope.address = point.address;
                            scope.city = point.city;
                            scope.region = point.region;
                            scope.zip = point.zip;
                            
                            if(!scope.showdetails) {
                                scope.showdetails = "show";
                            }

                            scope.prev = point;
                        });
                    });
                });

                map.fitBounds(bounds);
                intialized = true;
                scope.$emit('markersLoaded', true);
            };

            scope.$watch('markers', function(newValue, oldValue) {
                if (newValue !== oldValue) {
                    scope.init();
                }
            });
        }
    };
});

lanternApp.directive('modaldialog', function() {
    return {
        restrict: 'AE',
        replace: true,
        transclude: true,
        scope: true,
        template: "<div class='ng-modal'><div class='ng-modal-dialog' ng-transclude></div></div>",
        link: function (scope, element, attrs) {
            var showclass = element[0].getAttribute("ng-show");
            
            scope.$watch(showclass, function(newValue, oldValue) {
                if (newValue !== oldValue) {
                    scope.toggleModal(newValue);
                }
            });

            window.onresize = function() {
                scope.fitHeight();
            };

            scope.toggleModal = function(value) {
                scope.fitHeight();
                document.body.insertBefore(element[0], document.body.firstChild);
            };

            scope.fitHeight = function() {
                if(document.body.clientHeight <= element[0].children[0].offsetHeight) {
                    element[0].children[0].children[0].style.height = (document.body.clientHeight - 75) + "px";
                }
            };
        }
    };
});

lanternApp.directive('outageframe', function($http, $sce) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: true,
        template: "<iframe ng-transclude></iframe>",
        link: function (scope, element, attrs) {
            element.bind("load", function(e) {
                angular.element(element).css('height', (element[0].clientHeight - 100) + "px");
                angular.element(element).css('z-index', "0");
                scope.$emit('loaded', true);
            });
        }
    };
});

lanternApp.directive('contentframe', function($http, $sce) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            src: '@'
        },
        template: "<div ng-transclude></div>",
        link: function (scope, element, attrs) {
            scope.history = [scope.src];
            scope.index = 0;

            scope.changePath = function(path) {
                $http.get('tips/' + path).success(function(response) {
                    element.html($sce.trustAsHtml(response));
                    element[0].scrollTop = 0;

                    scope.$emit('onload', [scope.index, scope.history.length]);

                    angular.element(element[0].getElementsByTagName("a")).on("click", function(e) {
                        e.preventDefault();

                        var href = this.getAttribute("href");

                        if(this.getAttribute("target") == "_self") {
                            scope.history.push(href);
                            scope.index++;
                            scope.changePath(href);
                        } else {
                            window.open(href, "_system");
                        }
                    });
                });
            };

            scope.$on('goback', function() {
                if(scope.index > 0) {
                    scope.index--;
                    scope.changePath(scope.history[scope.index]);
                }
            });

            scope.$on('goforward', function() {
                if(scope.index < scope.history.length - 1) {
                    scope.index++;
                    scope.changePath(scope.history[scope.index]);
                }
            });

            scope.changePath(scope.history[scope.index]);
        }
    };
});