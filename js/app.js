"use strict";

var lanternApp = angular.module('lanternApp', [
	'ngAnimate',
    'ngRoute',
	'ngTouch',
    'ngSanitize',
    'lanternControllers'
]);

lanternApp.run(function($rootScope, $http, geolocation, geoencoder, loadstations, loadoutages, twitter) {
    $rootScope.menu = "close";
    $rootScope.position = {"coords" : {"latitude" : "38.8951", "longitude" : "-77.0367"}};

    document.addEventListener('deviceready', function() {
        if(!localStorage.SessionID) {
            localStorage.SessionID = guid();
        }        
    }, false);

    document.addEventListener('resume', function() {
        intializeMe();
    }, false);

    function intializeMe() {     
        geolocation().then(function(position) {            
            $rootScope.position = position;

            geoencoder('latLng').then(function(data) {
                if(data) {
                    $rootScope.address = data[0];
                    $rootScope.county = data[1];
                    $rootScope.state = data[2];

                    loadstations().then(function(data) {
                        $rootScope.stations = data;
                    }); 

                    loadoutages().then(function(data) {
                        $rootScope.outages = data;
                    });
                }
            });
        });

        twitter().then(function(timeline) {
            $rootScope.tweets = timeline;
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
        when('/twitter', {
            templateUrl: 'partials/twitter.html',
            controller: 'TwitterCtrl'
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

            if(tags != null) {
                for(var i = 0; i < tags.length; i++) {
                    if(tags[i].station.id == $id) {
                        last = new Date(tags[i].station.lastupdated);
                        now = new Date();
                        count = tags[i].station.count;
                        diffMs = last - now;
                        diffMins = Math.abs(Math.round(diffMs / 60000)); // minutes

                        if(diffMins <= limit && count >= 2) {
                            $window.navigator.notification.alert('You must wait at least 15 minutes to tag THIS station again.', null, 'Exceeded Tag Limit', 'Close');
                            
                            return false;
                        } else if(diffMins > limit && count >= 2) {
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

lanternApp.factory('twitter', ['$q', '$rootScope','$window', '$http', '$sce',
    function ($q, $rootScope, $window, $http, $sce) {
        return function () {
            var deferred = $q.defer();

            $http.get('http://doelanternapi.parseapp.com/twitter/doe/timeline').success(function (data) {
                deferred.resolve(eval(data));
            }).error(function(data) {
                deferred.resolve(null);
            })
            
            return deferred.promise;
        };
    }
]);

lanternApp.factory('geolocation', ['$q', '$rootScope', '$window',
    function ($q, $rootScope, $window) {
        return function () {
            var deferred = $q.defer();
            var options = { maximumAge: 30000, timeout: 30000, enableHighAccuracy: false }
            
            function onSuccess(position) {
                alert(position);
                deferred.resolve(position);
            }

            function onError(error) {
                $window.navigator.notification.alert('There was a problem locating your position, please manually enter your city, state or zipcode.', null, 'Failed to Locate Position', 'Close');
                deferred.resolve(null);
            }

            $window.navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

            return deferred.promise;
        };
    }
]);

lanternApp.factory('geoencoder', ['$q', '$rootScope',
    function ($q, $rootScope) {
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

                    //Beautified Address
                    location[0] = results[0].formatted_address;

                    //County
                    for(var i=0; i < results[0].address_components.length; i++) {
                        if (results[0].address_components[i].types[0] == "administrative_area_level_2") {
                            location[1] = results[0].address_components[i].long_name.toLowerCase().replace("county","").trim();
                        }
                    }

                    //State
                    for(var i=0; i < results[0].address_components.length; i++) {
                        if (results[0].address_components[i].types[0] == "administrative_area_level_1") {
                            location[2] = results[0].address_components[i].short_name;
                        }
                    }

                    if($type == 'address') {
                        $rootScope.position = {"coords" : {"latitude" : results[0].geometry.location.lat(), "longitude" : results[0].geometry.location.lng()}};
                    }

                    deferred.resolve(location);
                } else {
                    deferred.resolve(null);
                }
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadstations', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function () {
            var deferred = $q.defer();

            $http({method: 'GET', url: 'https://doelanternapi.parseapp.com/gasstations/search/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude, headers: {'SessionID': localStorage.SessionID}}).success(function (data) {
                deferred.resolve(eval(data));
            }).error(function(data) {
                deferred.resolve(null);
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadoutages', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function () {
            var deferred = $q.defer();
            
            $http({method: 'GET', url: 'https://doelanternapi.parseapp.com/utilitycompany/data/territory/' + $rootScope.state + '/' + $rootScope.county, headers: {'SessionID': localStorage.SessionID}}).success(function (data) {
                deferred.resolve(eval(data));
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

            $http({method: 'GET', url: 'https://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + id + '/' + status, headers: {'SessionID': localStorage.SessionID}}).success(function (data) {
                deferred.resolve(eval(data));     
            }); 

            return deferred.promise;
        };
    }
]);

lanternApp.directive('focusme', function($timeout, $rootScope) {
    return {
        link: function(scope, element, attrs) {
            scope.$watch('searchfocus', function(value) {
                $timeout(function() {
                    if(value == true) {
                        scope.focus();                 
                    } else {
                        scope.blur();
                    }
                }, 500);
            });

            element.bind("focus", function(e) {
                scope.$emit('searchfocus', true);
            });

            element.bind("blur", function(e) {
                scope.$emit('searchfocus', false);
            });

            element.bind("keyup", function(e) {
                if(e.keyCode == 13) {
                    $rootScope.$emit('addressUpdated', new Date());
                    scope.$emit('searchfocus', false);
                }     
            });

            scope.focus = function() {
                element[0].focus();

                if (typeof SoftKeyboard !== 'undefined') {
                    SoftKeyboard.show();
                }
            }

            scope.blur = function() {
                element[0].blur();

                if (typeof SoftKeyboard !== 'undefined') {
                    SoftKeyboard.hide();
                }
            }
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

            spinnerplugin.show({ overlay: false, fullscreen: true });
            
            map = new google.maps.Map(document.getElementById(attrs.id), mapOptions);

            google.maps.event.addListener(map, 'tilesloaded', function(e) {
                google.maps.event.addListener(map, 'click', function(e) {
                    scope.$apply(function() {
                        scope.showdetails = null;
                    });

                    if(scope.prev != null) {
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

                spinnerplugin.hide();
            });

            scope.init = function () {
                for (var i = 0; i < mapmarkers.length; i++) {
                    mapmarkers[i].setMap(null);
                }

                mapmarkers = [];

                scope.addMarkers(scope.markers);
            }

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
                            if(scope.prev != null) {
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
            }

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

                if(value === true) {
                    document.body.insertBefore(element[0], document.body.firstChild);
                } else {
                    element[0].remove();
                }
            }

            scope.fitHeight = function() {
                if(document.body.clientHeight <= element[0].children[0].offsetHeight) {
                    element[0].children[0].children[0].style.height = (document.body.clientHeight - 75) + "px";
                }
            }
        }
    };
});

lanternApp.directive('contentframe', function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        template: "<iframe ng-transclude></iframe>",
        link: function (scope, element, attrs) {
            spinnerplugin.show({ overlay: false, fullscreen: true });

            scope.index = 0;
            scope.frame = element[0];
            scope.history = [scope.frame.contentWindow.location.pathname];

            scope.$on('goback', function() {
                if(scope.index > 1) {
                    scope.index--;
                    scope.frame.src = scope.history[scope.index];
                }
            });

            scope.$on('goforward', function() {
                if(scope.index < scope.history.length - 1) {
                    scope.index++;
                    scope.frame.src = scope.history[scope.index];
                }
            });

            scope.frame.onload = function() {
                if(this.getAttribute("data-css")) {
                    var css = eval(this.getAttribute("data-css"));

                    this.contentWindow.document.body.id = this.id;

                    for(var i = 0; i < css.length; i++) {
                        var stylesheet = document.createElement("link");
                        stylesheet.rel = "stylesheet"; 
                        stylesheet.type = "text/css";
                        stylesheet.href = css[i]; 
                        this.contentWindow.document.body.appendChild(stylesheet);
                    }
                }

                this.height = (this.contentWindow.document.body.offsetHeight + 30) + "px";
                this.parentNode.scrollTop = 0;

                if(this.contentWindow.location.pathname != scope.history[scope.index]) {
                    scope.history.push(this.contentWindow.location.pathname);
                    scope.index++;                    
                }                    

                scope.$emit('onload', [scope.index, scope.history.length]);

                spinnerplugin.hide();
            }
        }
    };
});