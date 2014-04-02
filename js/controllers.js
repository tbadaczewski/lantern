"use strict";

var lanternControllers = angular.module('lanternControllers', []);

lanternControllers.controller('SearchCtrl', ['$scope', '$rootScope', '$http', 'geolocation', 'geoencoder', 'loadstations', 'loadoutages',
    function ($scope, $rootScope, $http, geolocation, geoencoder, loadstations, loadoutages) {
    	$scope.search = function() {
    		$scope.searchfocus = false;
    		$rootScope.address = $scope.address;

			geoencoder('address').then(function(address) {
				$rootScope.address = $scope.address = address[0];
				$rootScope.county = address[1];
				$rootScope.state = address[2];

                loadstations().then(function(data) {
                    $rootScope.stations = data;
                    $rootScope.$emit('stationsUpdated', new Date());
                }); 

                loadoutages().then(function(data) {
                    $rootScope.outages = data;
                    $rootScope.$emit('outagesUpdated', new Date());
                });
			});
		}

		$scope.clear = function() {
			$scope.address = "";
			$scope.searchfocus = true;
		}

		$scope.showClear = function() {
			$scope.searchfocus = true;
		}

		$scope.hideClear = function() {
			$scope.searchfocus = false;
		}

    	$scope.locate = function() {
	        geolocation().then(function(position) {
	            $rootScope.position = position;

	            geoencoder('latLng').then(function(address) {
	                $rootScope.address = $scope.address = address[0];
	                $rootScope.county = address[1];
	                $rootScope.state = address[2];

	                loadstations().then(function(data) {
	                    $rootScope.stations = data;
	                    $rootScope.$emit('stationsUpdated', new Date());
	                }); 

	                loadoutages().then(function(data) {
	                    $rootScope.outages = data;
	                    $rootScope.$emit('outagesUpdated', new Date());
	                });
	            });
	        });
		}

		$scope.toggleMenu = function() {
            if($rootScope.menu == "open") {
               $rootScope.menu = "close";
            } else {
               $rootScope.menu = "open";
            }

            return false;
		}

        $rootScope.$on('addressUpdated', function() {
        	$scope.stations = $rootScope.stations;
        	$scope.search();
    	});
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
			window.open(encodeURI("partials/twitter.html"), '_blank', 'location=no,enableViewportScale=yes','closebuttoncaption=back');
		}
		
		$scope.openTips = function($event) {
			$event.preventDefault();
			window.open("http://energy.gov/oe/community-guidelines-energy-emergencies", '_blank', 'location=no,enableViewportScale=yes','closebuttoncaption=back');
		}

		$rootScope.backstate = "";
		$rootScope.navstate = "hidden";
		$rootScope.animate = "fixed";
		$scope.id = "main";
		$scope.show = false;
		$scope.progressShown = false;
    }
]);

lanternControllers.controller('StationListCtrl', ['$scope', '$rootScope', '$http', '$window', 'loadstations',
    function ($scope, $rootScope, $http, $window, loadstations) {
    	$scope.progressShown = true;

		if($rootScope.stations == null) {
	        loadstations().then(function(data) {
	        	$rootScope.stations = $scope.stations = data;
	        	$scope.progressShown = false;
	        });
		} else {
			$scope.stations = $rootScope.stations;
			$scope.progressShown = false;
		}

        $rootScope.$on('stationsUpdated', function() {
        	$scope.stations = $rootScope.stations;
    	});

   		$scope.tagCancel = function() {
			$scope.toggleModal();
		};

		$scope.tagStation = function(id, status) {
			$scope.toggleModal();
			$window.navigator.notification.alert('Station Status Reported', null, 'Station Status', 'Close');
			
			if ($scope.status == "open") {
				$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/closed').success(function (data) {
			        loadstations().then(function(data) {
			        	$rootScope.stations = $scope.stations = data;
			        });						
				});				
			} else {
				$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/open').success(function (data) {
			        loadstations().then(function(data) {
			        	$rootScope.stations = $scope.stations = data;			        	
			        });
				});			
			}

			$scope.showdetails = ""; 
		};

		$scope.tagOpenWindow = function(id, status) {
			if(status != "red") {
				$scope.status = "open";
			} else {
				$scope.status = "closed";
			}

			$scope.stationid = id;
			$scope.toggleModal();
		};

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no,enableViewportScale=yes');
		}
		
		$rootScope.typestate = true;
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.navbtnlabel = "Map";
		$rootScope.navtext = "OPEN GAS STATIONS";
		$rootScope.navclass = "gas";
		$rootScope.navtarget = "station-map";
		$rootScope.animate = "fixed";
		$scope.id = "station-list";	
		$scope.saddr = encodeURI($rootScope.address);
    }
]);

lanternControllers.controller('StationMapCtrl', ['$scope', '$rootScope', '$http', '$window', 'geolocation', 'geoencoder', 'loadstations',
    function ($scope, $rootScope, $http, $window, geolocation, geoencoder, loadstations) {	
    	$scope.progressShown = true;
		var station_markers = null;

		$scope.loadMarkers = function() {
			var stations = $rootScope.stations;
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
		}

        $rootScope.$on('stationsUpdated', function() {
        	$scope.loadMarkers();
    	});

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no,enableViewportScale=yes');
		}

   		$scope.tagCancel = function() {  			
			$scope.toggleModal();
		}

		$scope.tagStation = function(id, status) {
			$scope.toggleModal();			
			$window.navigator.notification.alert('Station Status Reported', null, 'Station Status', 'Close');
			
			if ($scope.status == "open") {
				$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/closed').success(function (data) {
			        loadstations().then(function(data) {
			        	$rootScope.stations = data;
			        	$scope.showdetails = "";
			        	$scope.loadMarkers();
			        });	
				});				
			} else {
				$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + $scope.stationid + '/open').success(function (data) {
			        loadstations().then(function(data) {
			        	$rootScope.stations = data;
			        	$scope.showdetails = "";
			        	$scope.loadMarkers();
			        });
				});			
			} 
		};

		$scope.tagOpenWindow = function(id, status) {
			if(status != "red") {
				$scope.status = "open";
			} else {
				$scope.status = "closed";
			}

			$scope.stationid = id
			$scope.toggleModal();
		};

		if($rootScope.stations == null) {
	        loadstations().then(function(data) {
	        	$rootScope.stations = data;
	        	$scope.loadMarkers();
	        	$scope.progressShown = false;
	        });
		} else {
        	$scope.loadMarkers();
        	$scope.progressShown = false;
		}	
		
		$rootScope.typestate = true;		
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.navbtnlabel = "List";
		$rootScope.navtext = "OPEN GAS STATIONS";
		$rootScope.navclass = "gas";
		$rootScope.navtarget = "station-list";
		$rootScope.animate = "fixed";
		$scope.id = "station-map";
    }
]);

lanternControllers.controller('OutageListCtrl', ['$scope', '$rootScope', '$http', 'loadoutages',
    function ($scope, $rootScope, $http, loadoutages) {
		$scope.getMap = function($event, url) {
			$event.preventDefault();
			window.open(encodeURI(url), '_blank', 'location=no,enableViewportScale=yes','closebuttoncaption=back');
		}

		$scope.init = function() {
	        loadoutages().then(function(data) {
	        	$rootScope.outages = $scope.outages = data;
	        	$scope.progressShown = false;
	        });
		}

    	$scope.progressShown = true;

		if($rootScope.outages == null) {
	        $scope.init();
		} else {
			$scope.outages = $rootScope.outages;
			$scope.progressShown = false;
		}

        $rootScope.$on('outagesUpdated', function() {
        	$scope.init();
    	});

		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.typestate = false;
		$rootScope.navtext = "POWER OUTAGES";
		$rootScope.navclass = "lightning";
		$rootScope.navtarget = "outage-map";
		$rootScope.animate = "fixed";
		$scope.id = "outage-list";
    }
]);

lanternControllers.controller('DownedPowerLinesCtrl', ['$scope', '$rootScope', '$window',
    function ($scope, $rootScope, $window) {
    	$scope.progressShown = true;
    	//document.getElementById("photo").attr("src", $rootScope.photo);
    	$window.plugins.socialsharing.shareViaTwitter("Downed Powerline", "Hello World", $rootScope.photo, null);
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.typestate = false;
		$rootScope.navtext = "DOWNED POWERLINES";
		$rootScope.navclass = "camera";
		$rootScope.navtarget = "downed-powerlines";
		$rootScope.animate = "fixed";
		$scope.id = "downed-powerlines";
		$scope.progressShown = false;
    }
]);

lanternControllers.controller('TipsCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "tips-guides";
    }
]);