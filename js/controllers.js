"use strict";

var lanternControllers = angular.module('lanternControllers', []);

lanternControllers.controller('TwitterCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
    	$rootScope.backstate = "visible";
		$rootScope.typestate = false;
		$rootScope.navstate = true;
		$rootScope.navtext = "Twitter";
		$rootScope.navclass = "twitter";
		$rootScope.navtarget = "";
		$scope.id = "twitter-list";
		$scope.animate = "scale"
    }
]);

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

			navigator.camera.getPicture(onSuccess, onFail, { quality: 60 }); 
			
			function onSuccess(imageData) {
				$rootScope.photo = "data:image/jpeg;base64," + imageData;
			}

			function onFail(message) {
			}
		}

		$scope.openTwitter = function($event) {
			$event.preventDefault();
			window.open(encodeURI("partials/twitter.html"), '_blank', 'location=no','closebuttoncaption=back');
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

			$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/closed').success(function (data) { });
		};

		$http.get('http://doelanternapi.parseapp.com/gasstations/search/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude).success(function (data) {
			$scope.stations = eval(data);
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
		            	$scope.showdetails = "";
		            	prev.icon = { url : prev.icon.url, scaledSize: new google.maps.Size(25,40) };
		            });
		    	}
		    }
		};

		$scope.markers = station_markers;

		$http.get('http://doelanternapi.parseapp.com/gasstations/search/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude).success(function (data) {
			var stations = eval(data);
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
    function ($scope, $rootScope, $http) {
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

lanternControllers.controller('DownedPowerLinesCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
    	document.getElementById("photo").attr("src", $rootScope.photo);

		$rootScope.backstate = "visible";
		$rootScope.typestate = false;
		$rootScope.navstate = true;
		$rootScope.navtext = "DOWNED POWERLINES";
		$rootScope.navclass = "camera";
		$rootScope.navtarget = "downed-powerlines";
		$scope.id = "downed-powerlines";
		$scope.animate = "scale"
    }
]);