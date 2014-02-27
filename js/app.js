"use strict";

var lanternApp = angular.module('lanternApp', [
	'ngAnimate',
    'ngRoute',
	'ngTouch',
    'google-maps',
    'lanternControllers'
]);


lanternApp.run(function($rootScope, geolocation, geoencoder) {
    geolocation().then(function(position) {
        $rootScope.position = position;

        geoencoder('latLng').then(function(address) {
            $rootScope.address = address[0];
            $rootScope.county = address[1];
            $rootScope.state = address[2];
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
        when('/twitter', {
            templateUrl: 'partials/twitter.html',
            controller: 'TwitterCtrl'
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
                });
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

lanternApp.directive('draggable', function($document) {
    return function(scope, element, attr) {
        element.on('touchstart', function(e) {
            e.preventDefault();

            if(element[0].parentNode.className == "open") {
                element[0].parentNode.className = "close";
            } else {
                element[0].parentNode.className = "open";
            }
        });
    }
});

lanternApp.directive('tweets', function($document) {
    return function(scope, elem, attr) {
        if(!window.twttr) {
            window.twttr = (function (d,s,id) {
                var t, js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return; js=d.createElement(s); js.id=id;
                js.src="https://platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs);
                return window.twttr || (t = { _e: [], ready: function(f){ t._e.push(f) } });
            }(document, "script", "twitter-wjs"));
        } else {
            twttr.widgets.load();
        }
    }
});