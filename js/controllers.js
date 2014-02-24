"use strict";

var lanternControllers = angular.module('lanternControllers', []);

lanternControllers.controller('SearchCtrl', ['$scope', '$rootScope', '$http', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, geolocation, geoencoder) {
    	$scope.findme = function() {
			geolocation().then(function(position) {
				$rootScope.position = position;

				geoencoder().then(function(address) {
					$rootScope.address = address;
				});
			});
		}
    }
]);

lanternControllers.controller('MainCtrl', ['$scope', '$rootScope', '$http', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, geolocation, geoencoder) {
		$rootScope.backstate = "";
		$rootScope.navstate = false;
		$scope.id = "main";
		$scope.animate = "scale"
    }
]);

lanternControllers.controller('StationListCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {	
    	$scope.dialog = false;

		$scope.toggleModal = function(id, $event) {
			$event.preventDefault();

			if($scope.dialog == true) {
				$scope.dialog = false;
				$scope.stationid = '';
			} else {
				$scope.dialog = true;
				$scope.stationid = id;
			}
		};

		$scope.tagClosed = function($event) {
			$event.preventDefault();

			$http('http://doelanternapi.parseapp.com/gasstations/status/tag/' + $scope.stationid + '/closed').success(function (data) {
				alert(data);
			});
		};

		$http.get('http://devapi.mygasfeed.com/stations/radius/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude + '/10/reg/distance/rfej9napna.json').success(function (data) {
			$scope.stations = eval(data).stations;
        	$scope.saddr = encodeURI($rootScope.address);
		});

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no');
		}

		$rootScope.backstate = "visible";
		$rootScope.navstate = true;
		$rootScope.navbtnlabel = "Map";
		$rootScope.navtext = "OPEN GAS STATIONS";
		$rootScope.navclass = "gas";
		$rootScope.navtarget = "station-map";
		$scope.id = "station-list";
		$scope.animate = "scale"
    }
]);

lanternControllers.controller('StationMapCtrl', ['$scope', '$rootScope', '$http', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, geolocation, geoencoder) {	
		var station_markers = new Array();
		var prev = null;

		$http.get('http://devapi.mygasfeed.com/stations/radius/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude + '/10/reg/distance/rfej9napna.json').success(function (data) {
			var stations = eval(data).stations;
			var size = new google.maps.Size(25,40);

			for(var i=0; i < stations.length; i++) {
				station_markers.push({
					"station" : stations[i].station,
					"address" : stations[i].address,
					"city" : stations[i].city,
					"region" : stations[i].region,
					"zip" : stations[i].zip,
					"latitude" : stations[i].lat,
					"longitude" : stations[i].lng,					
					"icon" : {
						url: 'img/pin.png',
						scaledSize: size
					}/*,
					"options": {
						animation : ''
					}*/
				});
			}
		});

		$scope.map = {
			control:{},
			center: {
				latitude: $rootScope.position.coords.latitude,
				longitude: $rootScope.position.coords.longitude
			},
			zoom: 8,
		    events: {
		        tilesloaded: function (map) {
		            $scope.$apply(function () {
                	    _.each($scope.markers, function (marker) {
					        marker.onClicked = function () {
					        	$scope.$apply(function () {
					        		$scope.station = marker.station;
					            	$scope.latitude = marker.latitude;
					            	$scope.longitude = marker.longitude;
					            	$scope.address = marker.address;
					            	$scope.city = marker.city;
					            	$scope.region = marker.region;
					            	$scope.zip = marker.zip;

					            	if(prev) {
					            		prev.icon = { url : marker.icon.url, scaledSize: new google.maps.Size(25,40) };
					            		prev.options = { animation: '' };
					            	}

					            	marker.icon = { url : marker.icon.url, scaledSize: new google.maps.Size(50,80) };
					            	//marker.options = { animation: google.maps.Animation.BOUNCE };
					            	//$scope.map.control.getGMap().panTo(new google.maps.LatLng(marker.latitude, marker.longitude));
					            	$scope.showdetails = "show";
					            	prev = marker;
					            });
					        };
					    });	                
		            });
		        },
		        idle: function (map) {
		            $scope.$apply(function () {
		                console.log("idle");	
		            });
		        }
		    }
		};

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no');
		}

		$scope.modalShown = false;

		$scope.toggleModal = function() {
			$scope.modalShown = !$scope.modalShown;
		};
		
		$scope.markers = station_markers;
		
		$rootScope.backstate = "visible";
		$rootScope.navstate = true;
		$rootScope.navbtnlabel = "List";
		$rootScope.navtext = "OPEN GAS STATIONS";
		$rootScope.navclass = "gas";
		$rootScope.navtarget = "station-list";
		$scope.id = "station-map";
		$scope.animate = "scale";
    }
]);

lanternControllers.controller('OutageListCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http, $location) {	
		$http.get('http://devapi.mygasfeed.com/stations/radius/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude + '/10/reg/distance/rfej9napna.json').success(function (data) {
			$scope.outages = eval(data).stations;
		});

		$rootScope.backstate = "visible";
		$rootScope.navstate = true;
		$rootScope.navbtnlabel = "Map";
		$rootScope.navtext = "POWER OUTAGES";
		$rootScope.navclass = "lightning";
		$rootScope.navtarget = "outage-map";
		$scope.id = "outage-list";
		$scope.animate = "scale"
    }
]);

lanternControllers.controller('OutageMapCtrl', ['$scope', '$rootScope', '$http', 'geolocation',
    function ($scope, $rootScope, $http, geolocation) {	
		var outage_markers = new Array();

		$http.get('http://devapi.mygasfeed.com/stations/radius/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude + '/10/reg/distance/rfej9napna.json').success(function (data) {
			var outages = eval(data).stations;
			var size = new google.maps.Size(25,40);

			for(var i=0; i < outages.length; i++) {
				outage_markers.push({
					"latitude" : stations[i].lat,
					"longitude" : stations[i].lng,
					"icon" : {
						url: 'img/pin.png',
						scaledSize: size
					}
				});
			}
		});

		$scope.map = {
			center: {
				latitude: $rootScope.position.coords.latitude,
				longitude: $rootScope.position.coords.longitude
			},
			zoom: 8
		};

		$scope.markers = outage_markers;

		$rootScope.backstate = "visible";
		$rootScope.navstate = true;
		$rootScope.navbtnlabel = "List";
		$rootScope.navtext = "POWER OUTAGES";
		$rootScope.navclass = "lightning";
		$rootScope.navtarget = "outage-list";
		$scope.id = "outage-map";
		$scope.animate = "scale"
    }
]);