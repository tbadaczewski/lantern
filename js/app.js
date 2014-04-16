"use strict";

var lanternApp = angular.module('lanternApp', [
	'ngAnimate',
    'ngRoute',
	'ngTouch',
    'ngSanitize',
    'lanternControllers'
]);

lanternApp.run(function($rootScope, $http, geolocation, geoencoder, loadstations, loadoutages) {
    $rootScope.menu = "close";
    $rootScope.position = {"coords" : {"latitude" : "38.8951", "longitude" : "-77.0367"}};
    
    document.addEventListener('deviceready', function() {
        geolocation().then(function(position) {
            $rootScope.position = position;

            geoencoder('latLng').then(function(address) {
                $rootScope.address = address[0];
                $rootScope.county = address[1];
                $rootScope.state = address[2];

                loadstations().then(function(data) {
                    $rootScope.stations = data;
                }); 

                loadoutages().then(function(data) {
                    $rootScope.outages = data;
                });
            });
        });
    });
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
        when('/downed-powerlines', {
            templateUrl: 'partials/owned-powerlines.html',
            controller: 'DownedPowerLinesCtrl'
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

lanternApp.factory('geolocation', ['$q', '$rootScope', '$window',
    function ($q, $rootScope, $window) {
        return function () {
            var deferred = $q.defer();
            var options = { maximumAge: 30000, timeout: 30000, enableHighAccuracy: false }
            
            function onSuccess(position) {
                deferred.resolve(position);
            }

            function onError(error) {
                deferred.resolve($rootScope.position);
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

            $http.get('http://doelanternapi.parseapp.com/gasstations/search/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude).success(function (data) {
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

            $http.get('http://doelanternapi.parseapp.com/utilitycompany/data/territory/' + $rootScope.state + '/' + $rootScope.county).success(function (data) {
                deferred.resolve(eval(data));
            }).error(function(data) {
                deferred.resolve(null);
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
                    if (value == true) {
                        if(document.activeElement != element[0]) {
                            element[0].focus();

                            if (typeof SoftKeyboard !== 'undefined') {
                                SoftKeyboard.show();
                            }                      
                        }
                    }
                }, 500);
            });

            element.bind("keyup", function(e) {
                if(e.keyCode == 13) {
                    $rootScope.$emit('addressUpdated', new Date());
                    element[0].blur();

                    if (typeof SoftKeyboard !== 'undefined') {
                        SoftKeyboard.hide();
                    }
                }     
            });
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

lanternApp.directive('modaldialog', function($rootScope) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-dialog'><div class='ng-modal-dialog-content' ng-transclude></div></div></div>",
        link: function (scope, element, attrs) {
            scope.show = false;

            if (attrs.status) {
                scope.status = attrs.status;
            }

            scope.toggleModal = function() {
                if(scope.show === false) {
                    document.body.insertBefore(element[0], document.body.firstChild);
                    scope.show = true;
                } else {
                    scope.show = false;
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
        scope: {
            id: '@',
            title: '@',
            icon: '@',
            src: '@'
        },
        template: "<div><div id='frame-nav'><a id='return' href='#/'><span class='icon-close'></span></a><span id='title'><span class='{{icon}}'></span>{{title}}</span><span id='arrows'><a id='back' href='' ng-click='back()'><span class='icon-arrow2-left'></span></a><a id='forward' href='' ng-click='forward()'><span class='icon-arrow2-right'></span></a></span></div><div id='frame-content'><iframe id='contentframe' src='{{src}}' name='contentframe' ng-transclude></iframe></div></div>",
        link: function (scope, element, attrs) {
            scope.index = 0;
            scope.frame = element[0].childNodes[1].childNodes[0];
            scope.history = [scope.frame.contentWindow.location.pathname];

            scope.frame.onload = function() {
                var fonts = document.createElement("link");
                var css = document.createElement("link");

                fonts.href = "../css/fonts.css"; 
                fonts.rel = "stylesheet"; 
                fonts.type = "text/css"; 
                this.contentWindow.document.body.appendChild(fonts);

                css.href = "../css/tips.css"; 
                css.rel = "stylesheet"; 
                css.type = "text/css";                 
                this.contentWindow.document.body.appendChild(css);

                this.height = (this.contentWindow.document.body.offsetHeight + 30) + "px";
                this.parentNode.scrollTop = 0;

                if(this.contentWindow.location.pathname != scope.history[scope.index]) {
                    scope.history.push(this.contentWindow.location.pathname);
                    scope.index++;
                }
            }

            scope.back = function() {
                if(scope.index > 1) {
                    scope.index--;
                    scope.frame.src = scope.history[scope.index];
                }
            }

            scope.forward = function() {
                if(scope.index < scope.history.length - 1) {
                    scope.index++;
                    scope.frame.src = scope.history[scope.index];
                }
            }
        }
    };
});

lanternApp.directive('progress', function() {
    return {
        restrict: 'E',
        scope: {
            show: '='
        },
        replace: true,
        transclude: true,
        template: '<div class="progress" ng-show="show"><div ng-transclude>Loading</div></div>',
        link: function (scope, element, attrs) {
            scope.hideModal = function() {
                scope.show = false;
            };
        },
    };
});