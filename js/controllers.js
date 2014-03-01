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
    	$scope.progressShown = true;
    	
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
		
		$scope.openTips = function($event) {
			$event.preventDefault();
			window.open("http://energy.gov/oe/community-guidelines-energy-emergencies", '_blank', 'location=no','closebuttoncaption=back');
		}

		$rootScope.backstate = "";
		$rootScope.navstate = false;
		$scope.id = "main";
		$scope.animate = "scale"
		$scope.show = false;
		$scope.progressShown = false;
    }
]);

lanternControllers.controller('StationListCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {
    	$scope.progressShown = true;

   		$scope.tagCancel = function() {  			
			$scope.toggleModal();
		};

		$scope.tagStation = function(id, status) {
			$scope.toggleModal();
			navigator.notification.alert(null, null, 'Station Status Reported', 'Close');

			$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/' + $scope.status).success(function (data) {
				$scope.loadStations();				
			});
		};

		$scope.tagOpenWindow = function(id, status) {
			if(status != "green") {
				$scope.status = "open";
			} else {
				$scope.status = "closed";
			}

			$scope.stationid = id;
			$scope.toggleModal();
		};		

		$scope.loadStations = function() {
			$scope.progressShown = true;

			$http.get('http://doelanternapi.parseapp.com/gasstations/search/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude).success(function (data) {
				$scope.stations = eval(data);
	        	$scope.saddr = encodeURI($rootScope.address);
	        	$scope.progressShown = false;
			});
		};		

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
		$scope.loadStations();
    }
]);

lanternControllers.controller('StationMapCtrl', ['$scope', '$rootScope', '$http', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, geolocation, geoencoder) {	
    	$scope.progressShown = true;
		var station_markers = null;

		$scope.loadStations = function() {
			$http.get('http://doelanternapi.parseapp.com/gasstations/search/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude).success(function (data) {
				var stations = eval(data);
				var size = new google.maps.Size(25,40);

				station_markers = new Array();

				for(var i=0; i < stations.length; i++) {
					station_markers.push({
						"id" : stations[i].id,
						"station" : stations[i].station,
						"operatingStatus" : stations[i].operatingStatus,
						"address" : stations[i].address,
						"city" : stations[i].city,
						"region" : stations[i].region,
						"zip" : stations[i].zip,
						"latitude" : stations[i].lat,
						"longitude" : stations[i].lng,					
						"icon" : {
							url: 'img/pin-' + stations[i].operatingStatus.toLowerCase() + '.png',
							scaledSize: size
						}
					});
				}
				
				$scope.markers = station_markers;
				$scope.init();
				$scope.progressShown = false;		
			});
		}


		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no');
		}

   		$scope.tagCancel = function() {  			
			$scope.toggleModal();
		}

		$scope.tagStation = function(id, status) {
			$scope.toggleModal();
			navigator.notification.alert(null, null, 'Station Status Reported', 'Close');

			$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/' + $scope.status).success(function (data) {
				$scope.loadStations();
				$scope.showdetails = "";	
			});
		};

		$scope.tagOpenWindow = function(id, status) {
			if(status != "green") {
				$scope.status = "open";
			} else {
				$scope.status = "closed";
			}

			$scope.stationid = id
			$scope.toggleModal();
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
		$scope.loadStations();
    }
]);

lanternControllers.controller('OutageListCtrl', ['$scope', '$rootScope', '$http',
    function ($scope, $rootScope, $http) {
    	$scope.progressShown = true;

		$http.get('http://doelanternapi.parseapp.com/utilitycompany/data/territory/' + $rootScope.state + '/' + $rootScope.county).success(function (data) {
			$scope.outages = data;
			$scope.progressShown = false;
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
    	$scope.progressShown = true;
    	document.getElementById("photo").attr("src", $rootScope.photo);

		$rootScope.backstate = "visible";
		$rootScope.typestate = false;
		$rootScope.navstate = true;
		$rootScope.navtext = "DOWNED POWERLINES";
		$rootScope.navclass = "camera";
		$rootScope.navtarget = "downed-powerlines";
		$scope.id = "downed-powerlines";
		$scope.animate = "scale"
		$scope.progressShown = false;
    }
]);