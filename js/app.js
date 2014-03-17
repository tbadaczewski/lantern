"use strict";

var lanternApp = angular.module('lanternApp', [
	'ngAnimate',
    'ngRoute',
	'ngTouch',
    'lanternControllers'
]);

lanternApp.run(function($rootScope, geolocation, geoencoder) {
    $rootScope.menu = "close";
    $rootScope.position = {"coords" : {"latitude" : "38.8951", "longitude" : "-77.0367"}};
    
    document.addEventListener('deviceready', function() {
        alert("Device Ready");
        geolocation().then(function(position) {
            $rootScope.position = position;

            alert("Position Loaded");

            geoencoder('latLng').then(function(address) {
                alert("Address Data Retrieved");

                $rootScope.address = address[0];
                $rootScope.county = address[1];
                $rootScope.state = address[2];
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
        otherwise({
            redirectTo: '/'
        });
    }
]);

lanternApp.factory('geolocation', ['$q', '$rootScope', '$window',
    function ($q, $rootScope, $window) {
        return function () {
            var deferred = $q.defer();

            if ($window.navigator) {
                $window.navigator.geolocation.getCurrentPosition(function (position) {                    
                    $rootScope.$apply(function () {
                        deferred.resolve(position);
                    });
                }, function(error) {
                    $rootScope.$apply(function () {
                        deferred.resolve($rootScope.position);
                    });
                },{maximumAge: 5000, timeout: 5000, enableHighAccuracy: true});
            } else {
                deferred.resolve($rootScope.position);
            }

            return deferred.promise;
        };
    }
]);

lanternApp.factory('geoencoder', ['$q', '$rootScope', '$window',
    function ($q, $rootScope, $window) {
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

                    deferred.resolve(location);
                }
            });

            return deferred.promise;
        };
    }
]);

lanternApp.directive('googlemap', function($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div></div>',
        link: function(scope, element, attrs) {
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

            scope.init = function() {
                google.maps.event.addListener(map, 'click', function(e) {
                    scope.$apply(function() {
                        scope.showdetails = "hide";
                    });

                    if(scope.prev != null) {
                        var normal = { 
                            url: scope.prev.icon.url,
                            scaledSize: new google.maps.Size(25,40)
                        };

                        scope.prev.setIcon(normal);
                    }
                });

                for (var i = 0; i < mapmarkers.length; i++) {
                    mapmarkers[i].setMap(null);
                }

                mapmarkers = [];

                scope.addMarkers(scope.markers);
            } 

            scope.addMarkers = function (markers) {
                var bounds = new google.maps.LatLngBounds();

                _.each(markers, function (marker) {                    
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
                            scope.id = point.id,
                            scope.operatingStatus = point.operatingStatus,
                            scope.station = point.station;
                            scope.latitude = point.latitude;
                            scope.longitude = point.longitude;
                            scope.address = point.address;
                            scope.city = point.city;
                            scope.region = point.region;
                            scope.zip = point.zip;

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
                            scope.showdetails = "show";
                            scope.prev = point;
                        });
                    });
                });

                map.fitBounds(bounds);
            }
        }
    };
});

lanternApp.directive('modaldialog', function($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-overlay' ng-click='hideModal()'></div><div class='ng-modal-dialog'><div class='ng-modal-dialog-content' ng-transclude></div></div></div>",
        link: function (scope, element, attrs) {
            var parent = element[0].parentNode;
            scope.show = false;

            if (attrs.status) {
                scope.status = attrs.status;
            }

            scope.hideModal = function () {
                scope.show = false;
            }

            scope.toggleModal = function() {
                if(scope.show === false) {
                    parent = element[0].parentNode;
                    document.body.appendChild(element[0]);
                    scope.show = true;
                } else {
                    scope.show = false;
                    parent.appendChild(element[0]);
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