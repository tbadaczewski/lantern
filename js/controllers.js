"use strict";

var lanternControllers = angular.module('lanternControllers', []);

lanternControllers.controller('SearchCtrl', ['$scope', '$rootScope', '$http', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, geolocation, geoencoder) {
    	$scope.findme = function() {
    		$rootScope.address = $scope.address ;

			geoencoder('address').then(function(address) {
				$rootScope.address = $scope.address = address[0];
				$rootScope.county = address[1];
				$rootScope.state = address[2];
			});
		}
    }
]);

lanternControllers.controller('MainCtrl', ['$scope', '$rootScope', '$http', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, geolocation, geoencoder) {
    	$scope.camera = function($event) {
    		$event.preventDefault();

			navigator.camera.getPicture(onSuccess, onFail, { quality: 50 }); 
			
			function onSuccess(imageData) {
			    //var image = document.getElementById('myImage');
			    //image.src = "data:image/jpeg;base64," + imageData;
			    window.alert("Success");
			}

			function onFail(message) {
			    window.alert('Failed because: ' + message);
			}
		}

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

			$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/closed').success(function (data) {
				console.log(data);
			});
		};

		$http.get('http://devapi.mygasfeed.com/stations/radius/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude + '/2/reg/distance/rfej9napna.json').success(function (data) {
			$scope.stations = eval(data).stations;
        	$scope.saddr = encodeURI($rootScope.address);
		});

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no');
		}

		$rootScope.backstate = "visible";
		$rootScope.typestate = true;
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

<<<<<<< HEAD
		$scope.map = {
			control:{},
			center: {
				latitude: $rootScope.position.coords.latitude,
				longitude: $rootScope.position.coords.longitude
			},
			zoom: 10,
		    events: {
		    	click: function (map) {
		            $scope.$apply(function () {
		            	$scope.showdetails = "hide";
		            	prev.icon = { url : prev.icon.url, scaledSize: new google.maps.Size(25,40) };
		            });
		    	}
		    }
		};

		$scope.markers = station_markers;

=======
>>>>>>> b71ba0c8ba9b575a6d83b27dba42037f764630a2
		$http.get('http://devapi.mygasfeed.com/stations/radius/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude + '/2/reg/distance/rfej9napna.json').success(function (data) {
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
					}
				});
			}

<<<<<<< HEAD
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
		            		prev.icon = { url : prev.icon.url, scaledSize: new google.maps.Size(25,40) };
		            	}

		            	marker.icon = { url : marker.icon.url, scaledSize: new google.maps.Size(50,80) };
		            	$scope.showdetails = "show";
		            	prev = marker;
=======
		$scope.map = {
			control:{},
			center: {
				latitude: $rootScope.position.coords.latitude,
				longitude: $rootScope.position.coords.longitude
			},
			zoom: 10,
		    events: {
		        tilesloaded: function (map) {
		            $scope.$apply(function () {
                	    _.each($scope.markers, function (marker) {
					        marker.onClicked = function () {
					        	//$scope.$apply(function () {
					        		$scope.station = marker.station;
					            	$scope.latitude = marker.latitude;
					            	$scope.longitude = marker.longitude;
					            	$scope.address = marker.address;
					            	$scope.city = marker.city;
					            	$scope.region = marker.region;
					            	$scope.zip = marker.zip;

					            	if(prev) {
					            		prev.icon = { url : marker.icon.url, scaledSize: new google.maps.Size(25,40) };
					            	}

					            	marker.icon = { url : marker.icon.url, scaledSize: new google.maps.Size(50,80) };
					            	//$scope.map.control.getGMap().panTo(new google.maps.LatLng(marker.latitude, marker.longitude));
					            	$scope.showdetails = "show";
					            	prev = marker;
					            	$scope.$apply();
					            //});
					        };
					    });	                
>>>>>>> b71ba0c8ba9b575a6d83b27dba42037f764630a2
		            });
		        };
		    });
		});

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no');
		}

		$scope.modalShown = false;

		$scope.toggleModal = function() {
			$scope.modalShown = !$scope.modalShown;
		};

		$rootScope.typestate = true;		
		$rootScope.backstate = "visible";
		$rootScope.typestate = true;
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
		$http.get('http://doelanternapi.parseapp.com/utilitycompany/data/territory/' + $rootScope.state + '/' + $rootScope.county).success(function (data) {
			$scope.outages = data;
		});

		$scope.getMap = function($event, url) {
			$event.preventDefault();
			window.open(encodeURI(url), '_blank', 'location=no','closebuttoncaption=back');
		}

		$rootScope.backstate = "visible";
		$rootScope.typestate = false;
		$rootScope.navstate = true;
		$rootScope.navtext = "POWER OUTAGES";
		$rootScope.navclass = "lightning";
		$rootScope.navtarget = "outage-map";
		$scope.id = "outage-list";
		$scope.animate = "scale"
    }
]);