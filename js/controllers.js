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

lanternControllers.controller('MainCtrl', ['$scope', '$rootScope', '$http', '$window', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, $window, geolocation, geoencoder) {
   		$scope.openDialog = function() {
			$scope.show = true;
		}

   		$scope.closeDialog = function() {
			$scope.show = false;
		}
    	
    	$scope.camera = function($event) {
    		$event.preventDefault();

    		$scope.show = false;

			navigator.camera.getPicture(
				onSuccess,
				onFail, {
					quality: 30,
					allowEdit : true,
					sourceType : Camera.PictureSourceType.CAMERA,
					destinationType :  Camera.DestinationType.DATA_URL
				}
			);

			//Camera.DestinationType.FILE_URI

			function onSuccess(data) {
				$scope.$apply(function(data){
					console.log(data);
					$window.plugins.socialsharing.share($rootScope.address + " #powerlinedown", null, data, null, function(e) { alert("Success: " + e); }, function(e) { alert("Error: " + e); });
				});
	    		/*
	    		var cb = new Codebird;
	            cb.setConsumerKey("m7nsVF0NSPBpipUybhJAXw", "4XwyY0IZ9uqvyARzTCDFQIW2I8CSkOMeh5yW6g");
	            cb.setToken("2161399610-perf69tORepQI8eYEA4JlYZR863TeClEVfq6Z9A","JiQ2zvxYCOnW3hRe76wEd2t25N4syvYu55NLllRHsAP7a");

				var params = {
				    "status": "#powerlinedown",
				    "media[]": imageData,
				    lat: $rootScope.position.coords.latitude,
				    long: $rootScope.position.coords.longitude,
				    display_coordinates: true
				};

				cb.__call(
					"statuses_updateWithMedia",
					params,
					function (reply) { }
				);

				$window.navigator.notification.alert('Your photo and location has been submitted.', null, 'Success', 'Close');
				*/
			}

			function onFail(message) {
				if(message != "no image selected") {
					$window.navigator.notification.alert('Your photo has failed to upload please try again.', null, 'Error', 'Close');
				}
			}
		}

		$rootScope.backstate = "";
		$rootScope.navstate = "hidden";
		$rootScope.animate = "fixed";
		$scope.id = "main";
    }
]);

lanternControllers.controller('StationListCtrl', ['$scope', '$rootScope', '$http', '$window', 'loadstations', 'validatetag',
    function ($scope, $rootScope, $http, $window, loadstations, validatetag) {
		if($rootScope.stations == null) {
	        loadstations().then(function(data) {
	        	$rootScope.stations = $scope.stations = data;
	        	$scope.hideloading = true;
	        });
		} else {
			$scope.stations = $rootScope.stations;
			$scope.hideloading = true;
		}

        $rootScope.$on('stationsUpdated', function() {
        	$scope.stations = $rootScope.stations;
    	});

   		$scope.tagCancel = function() {
   			$scope.show = false;
		};

		$scope.tagStation = function(id, status) {
			if(validatetag(id) == true) {
				var tags = eval(localStorage.getItem("tags"));
				var updated = false;

	    		if(tags != null) {
					for(var i = 0; i < tags.length; i++) {
						if(tags[i].station.id == id) {
					    	tags[i].station.lastupdated = new Date();
					    	tags[i].station.count++;
					    	updated = true;
					    	break;
						}
					}

					if(!updated) {
						tags.push({"station" : { "id" : id, "lastupdated" : new Date(), "count" : 1 }});
					}
	    		} else {
	    			tags = [{"station" : { "id" : id, "lastupdated" : new Date(), "count" : 1 }}];
	    		}

	    		localStorage.setItem("tags", JSON.stringify(tags));

				$scope.show = false;
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
			}

			$scope.showdetails = null; 
		};

		$scope.tagOpenWindow = function(id, status) {
			if(validatetag(id) == true) {
				if(status != "red") {
					$scope.status = "open";
				} else {
					$scope.status = "closed";
				}

				$scope.stationid = id;
				$scope.show = true;
			}
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

lanternControllers.controller('StationMapCtrl', ['$scope', '$rootScope', '$http', '$window', 'geolocation', 'geoencoder', 'loadstations', 'validatetag',
    function ($scope, $rootScope, $http, $window, geolocation, geoencoder, loadstations, validatetag) {	
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
        	$scope.hideloading = true;
		}

        $rootScope.$on('stationsUpdated', function() {
        	$scope.loadMarkers();
    	});

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no,enableViewportScale=yes');
		}

   		$scope.tagCancel = function() {  			
			$scope.show = false;
		}

		$scope.tagStation = function(id, status) {
			if(validatetag(id) == true) {
				var tags = eval(localStorage.getItem("tags"));
				var updated = false;

	    		if(tags != null) {
					for(var i = 0; i < tags.length; i++) {
						if(tags[i].station.id == id) {
					    	tags[i].station.lastupdated = new Date();
					    	tags[i].station.count++;
					    	updated = true;
					    	break;
						}
					}

					if(!updated) {
						tags.push({"station" : { "id" : id, "lastupdated" : new Date(), "count" : 1 }});
					}
	    		} else {
	    			tags = [{"station" : { "id" : id, "lastupdated" : new Date(), "count" : 1 }}];
	    		}

	    		localStorage.setItem("tags", JSON.stringify(tags));

				$scope.show = false;		
				$window.navigator.notification.alert('Station Status Reported', null, 'Station Status', 'Close');
				
				if ($scope.status == "open") {
					$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + id + '/closed').success(function (data) {
				        loadstations().then(function(data) {
				        	$rootScope.stations = data;
				        	$scope.showdetails = null;
				        	$scope.loadMarkers();
				        });	
					});				
				} else {
					$http.get('http://doelanternapi.parseapp.com/gasstations/fuelstatus/tag/' + id + '/open').success(function (data) {
				        loadstations().then(function(data) {
				        	$rootScope.stations = data;
				        	$scope.showdetails = null;
				        	$scope.loadMarkers();
				        });
					});			
				}
			}
		};

		$scope.tagOpenWindow = function(id, status) {
			if(validatetag(id) == true) {
				if(status != "red") {
					$scope.status = "open";
				} else {
					$scope.status = "closed";
				}

				$scope.stationid = id
				$scope.show = true;
			}
		};

		if($rootScope.stations == null) {
	        loadstations().then(function(data) {
	        	$rootScope.stations = data;
	        	$scope.loadMarkers();
	        	$scope.hideloading = true;
	        });
		} else {
        	$scope.loadMarkers();
        	$scope.hideloading = true;
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

lanternControllers.controller('OutageListCtrl', ['$scope', '$rootScope', '$http', 'loadoutages', '$location',
    function ($scope, $rootScope, $http, loadoutages, $location) {
		$scope.getMap = function($event, url) {
			$event.preventDefault();
			$rootScope.outagemap = url;
			$location.path("/outage-map");
		}

		$scope.init = function() {
	        loadoutages().then(function(data) {
	        	$rootScope.outages = $scope.outages = data;
	        	$scope.hideloading = true;
	        });
		}

		if($rootScope.outages == null) {
	        $scope.init();
		} else {
			$scope.outages = $rootScope.outages;
			$scope.hideloading = true;
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

lanternControllers.controller('OutageMapCtrl', ['$scope', '$rootScope', '$sce',
    function ($scope, $rootScope, $sce) {
    	$scope.hideloading = false;  	
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.animate = "slide";
		$scope.id = "outage-map";
		$scope.src = $rootScope.outagemap;
		$scope.hideloading = true;

		$scope.trustUrl = function(url) {
		    return $sce.trustAsResourceUrl(url);
		}
    }
]);

lanternControllers.controller('TipsCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
        $scope.index = 0, $scope.history = 0;
        $scope.disabledback = "disabled", $scope.disabledforward = "disabled";

        $scope.$on('onload', function(event, values) {
        	$scope.$apply(function(){
	        	$scope.index = values[0];
	        	$scope.history = values[1];

		        if($scope.index > 1) {
		        	$scope.disabledback = "";
		        } else {
		            $scope.disabledback = "disabled";
		        }

		        if($scope.index < ($scope.history - 1)) {
		            $scope.disabledforward = "";
		        } else {
		            $scope.disabledforward = "disabled";
		        }	        
	        });
        });

        $scope.back = function() {
        	$scope.$broadcast('goback');            
        }

        $scope.forward = function() {
        	$scope.$broadcast('goforward');
        }

		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "tips-guides";
    }
]);

lanternControllers.controller('TwitterCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "twitter";
    }
]);