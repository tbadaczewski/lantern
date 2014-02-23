"use strict";

var lanternApp = angular.module('lanternApp', [
	'ngAnimate',
    'ngRoute',
	'ngTouch',
    'google-maps',
    'angular-carousel',
    'lanternControllers'
]);


lanternApp.run(function($rootScope, geolocation, geoencoder){
    geolocation().then(function(position) {
        $rootScope.position = position;

        geoencoder().then(function(address) {
            $rootScope.address = address;
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
        when('/settings', {
            templateUrl: 'partials/settings.html',
            controller: 'LanternSettingsCtrl'
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
            templateUrl: 'partials/station-list.html',
            controller: 'OutageListCtrl'
        }).
        when('/outage-map', {
            templateUrl: 'partials/station-map.html',
            controller: 'OutageMapCtrl'
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
        return function () {
            var deferred = $q.defer();
            var geocoder = new google.maps.Geocoder();
            var position = $rootScope.position;
            var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            
            geocoder.geocode({'latLng': latlng}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        deferred.resolve(results[1].formatted_address);
                    }
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