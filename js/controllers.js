"use strict";

var lanternControllers = angular.module('lanternControllers', []);

lanternControllers.controller('SearchCtrl', ['$scope', '$rootScope', '$http', '$timeout', 'geolocation', 'geoencoder', 'loadstations', 'loadoutages',
    function ($scope, $rootScope, $http, $timeout, geolocation, geoencoder, loadstations, loadoutages) {
    	$scope.searchfocus = false;

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
			if($scope.searchfocus == false) {
				$timeout(function(){
					$scope.address = "";
					$scope.searchfocus = true;
				}, 500);
			}
		}

		$scope.showFocus = function() {
			if($scope.searchfocus == false) {
				$timeout(function(){
					$scope.searchfocus = true;
				}, 500);
			}
		}

		$scope.hideFocus = function() {
			if($scope.searchfocus == true) {
				$timeout(function(){
					$scope.searchfocus = false;
				}, 500);
			}		
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

lanternControllers.controller('MainCtrl', ['$scope', '$rootScope', '$http', '$window', '$location', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, $window, $location, geolocation, geoencoder) {
    	$scope.openDialog = function($target, $value) {
   			switch($target) {
   				case "disclaimer":
			    	$scope.disclaimerdialog = true;
   					
   					break;
   				case "note":
			    	$scope.notedialog = true;

   					break;
   			}
    	}

   		$scope.closeDialog = function($target, $value) {
   			switch($target) {
   				case "disclaimer":
   					$scope.disclaimerdialog = false;

   					if($value) {
   						$scope.camera();
   					}
   					
   					break;
   				case "note":
   					$scope.notedialog = false;

   					if($value) {
   						$location.path("/outage-list");	
   					}

   					break;
   			}	
		}
    	
    	$scope.camera = function() {
    		$scope.show = false;

			navigator.camera.getPicture(
				onSuccess,
				null, {
					quality: 30,
					allowEdit : true,
					sourceType : Camera.PictureSourceType.CAMERA,
					destinationType : Camera.DestinationType.DATA_URL
				}
			);

			function onSuccess(data) {
	    		var cb = new Codebird;

	            cb.setConsumerKey("m7nsVF0NSPBpipUybhJAXw", "4XwyY0IZ9uqvyARzTCDFQIW2I8CSkOMeh5yW6g");
	            cb.setToken("2161399610-perf69tORepQI8eYEA4JlYZR863TeClEVfq6Z9A","JiQ2zvxYCOnW3hRe76wEd2t25N4syvYu55NLllRHsAP7a");

				var params = {
				    "status": "#powerlinedown",
				    "media[]": data,
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
			}
		}

		$rootScope.backstate = "";
		$rootScope.navstate = "hidden";
		$rootScope.animate = "fixed";
		$scope.id = "main";
    }
]);

lanternControllers.controller('StationListCtrl', ['$q','$scope', '$rootScope', '$http', '$window', 'loadstations', 'validatetag', 'tagstatus',
    function ($q, $scope, $rootScope, $http, $window, loadstations, validatetag, tagstatus) {
    	$scope.loading = true;

		if($rootScope.stations == null) {
	        loadstations().then(function(stations) {
	        	$rootScope.stations = $scope.stations = stations;
	        	$scope.loading = false;
	        });
		} else {
			$scope.stations = $rootScope.stations;
			$scope.loading = false;
		}

        $rootScope.$on('stationsUpdated', function() {
        	$scope.stations = $rootScope.stations;
        	$scope.loading = false;
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
				
				tagstatus(id, status).then(function(data) {
			        loadstations().then(function(data) {
			        	$rootScope.stations = $scope.stations = data;
			        	$rootScope.$emit('stationsUpdated', new Date());
			        	$scope.showdetails = null;
			        });						
				});
			}
		};

		$scope.tagOpenWindow = function(id, status) {
			if(validatetag(id) == true) {
				$scope.status = status;

				switch(status) {
					case "green":
						$scope.state = "open";
						$scope.title = "Gas Pumps are Open";
						$scope.message = "closed";
						break;
					case "yellow":
						$scope.state = "uncertain";
						$scope.title = "Gas Pump Status Uncertain";
						$scope.message = "open or currently closed";
						break;
					case "red":
						$scope.state = "closed";
						$scope.title = "Gas Pumps are Closed";
						$scope.message = "open";
						break;
				}

				$scope.stationid = id;
				$scope.show = true;
			}
		};

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no,enableViewportScale=yes');
		}

		$scope.onReload = function() {
			var deferred = $q.defer();

			setTimeout(function() {
		        loadstations().then(function(stations) {
		        	$rootScope.stations = $scope.stations = stations;
		        	deferred.resolve(true);
		        });		        		
			}, 1000);
			
			return deferred.promise;
		};
		
		$rootScope.typestate = true;
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.navbtnlabel = "Map";
		$rootScope.navtext = "OPEN GAS PUMPS";
		$rootScope.navclass = "gas";
		$rootScope.navtarget = "station-map";
		$rootScope.animate = "fixed";
		$scope.id = "station-list";	
		$scope.saddr = encodeURI($rootScope.address);
    }
]);

lanternControllers.controller('StationMapCtrl', ['$scope', '$rootScope', '$http', '$timeout', '$window', 'geolocation', 'geoencoder', 'loadstations', 'validatetag', 'tagstatus',
    function ($scope, $rootScope, $http, $timeout, $window, geolocation, geoencoder, loadstations, validatetag, tagstatus) {	
		var station_markers = null;
		$scope.loading = true;

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
			$scope.showdetails = null;
		}

    	$scope.$on('markersLoaded', function() {
    		$timeout(function(){
	    		$scope.loading = false;
    		}, 500); 		
    	});

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
				
				tagstatus(id, status).then(function(data) {
			        loadstations().then(function(data) {
			        	$rootScope.stations = data;
			        	$rootScope.$emit('stationsUpdated', new Date());
			        	$scope.showdetails = null; 
			        });						
				});
			}
		};

		$scope.tagOpenWindow = function(id, status) {
			if(validatetag(id) == true) {
				$scope.status = status;

				switch(status) {
					case "green":
						$scope.state = "open";
						$scope.title = "Gas Pumps are Open";
						$scope.message = "closed";
						break;
					case "yellow":
						$scope.state = "uncertain";
						$scope.title = "Gas Pump Status Uncertain";
						$scope.message = "open or currently closed";
						break;
					case "red":
						$scope.state = "closed";
						$scope.title = "Gas Pumps are Closed";
						$scope.message = "open";
						break;
				}

				$scope.stationid = id
				$scope.show = true;
			}
		};

		if($rootScope.stations == null) {
	        loadstations().then(function(data) {
	        	$rootScope.stations = data;
	        	$scope.loadMarkers();
	        });
		} else {
        	$scope.loadMarkers();
		}
		
		$rootScope.typestate = true;		
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.navbtnlabel = "List";
		$rootScope.navtext = "OPEN GAS PUMPS";
		$rootScope.navclass = "gas";
		$rootScope.navtarget = "station-list";
		$rootScope.animate = "fixed";
		$scope.id = "station-map";
    }
]);

lanternControllers.controller('OutageListCtrl', ['$scope', '$rootScope', '$http', '$window', 'loadoutages', '$location', '$timeout',
    function ($scope, $rootScope, $http, $window, loadoutages, $location, $timeout) {
    	$scope.loading = true;

		$scope.getMap = function($event, $url) {
			$event.preventDefault();
			$rootScope.outagemap = $url;
			$location.path("/outage-map");
		}		

		if($rootScope.outages == null) {
	        loadoutages().then(function(outages) {
	        	$rootScope.outages = $scope.outages = outages;
	        	$scope.loading = false;
	        });	    	
		} else {
			$scope.outages = $rootScope.outages;
			$scope.loading = false;
		}

        $rootScope.$on('outagesUpdated', function() {
        	$scope.outages = $rootScope.outages;
        	$scope.loading = false;
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

lanternControllers.controller('OutageMapCtrl', ['$scope', '$rootScope', '$window',
    function ($scope, $rootScope, $window) {
    	$scope.loading = true; 
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.animate = "slide";
		$scope.id = "outage-map";
		$scope.src = $rootScope.outagemap;

		$scope.$on('loaded', function(event, values) {
			$scope.$apply(function() {
				$scope.loading = false; 
			});
		});
    }
]);

lanternControllers.controller('TipsCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
    	$scope.loading = true; 
        $scope.disabledback = "disabled", $scope.disabledforward = "disabled";

        $scope.$on('onload', function(event, values) {
	        if(values[0] > 0) {
	        	$scope.disabledback = "";
	        } else {
	            $scope.disabledback = "disabled";
	        }

	        if(values[0] < values[1] - 1) {
	            $scope.disabledforward = "";
	        } else {
	            $scope.disabledforward = "disabled";
	        }

	        $scope.loading = false;       
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
    	$scope.loading = true; 
    	$scope.tweets = $rootScope.tweets;
		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "twitter";
		$scope.loading = false; 

		$scope.autoHyperlinkUrls = function(text) {
			if(text) {
		    	text = text.replace(/(HTTP:\/\/|HTTPS:\/\/)([a-zA-Z0-9.\/&?_=!*,\(\)+-]+)/ig, "<a href=\"$1$2\" target=\"_system\">$1$2</a>");
		    	text = text.replace(/#(\S*)/g,'<a href="https://twitter.com/search?q=$1" target=\"_system\">#$1</a>');
		    	text = text.replace(/@(\S*)/g,'<a href="https://twitter.com/$1" target=\"_system\">@$1</a>');
		    }

		    return text;
		}

		$scope.parseTwitterDate = function(tdate) {
		    var system_date = new Date(Date.parse(tdate));
		    var user_date = new Date();

		    var diff = Math.floor((user_date - system_date) / 1000);
		    
		    if (diff <= 1) {return "now";}
		    if (diff < 60) {return diff + " s";}
		    if (diff <= 3540) {return Math.round(diff / 60) + "m";}
		    if (diff <= 86400) {return Math.round(diff / 3600) + "h";}
		    if (diff < 9999999) {return Math.round(diff / 86400) + "d";}
		    
		    return system_date;
		}

		$scope.openWindow = function($event, $url) {
			$event.preventDefault();
			window.open($url, "_system");
		}
    }
]);

lanternControllers.controller('AlternativeCtrl', ['$scope', '$rootScope', '$window',
    function ($scope, $rootScope, $window) {
    	$scope.loading = true; 
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.animate = "slide";
		$scope.id = "alternative";
		$scope.src = "http://www.afdc.energy.gov/afdc/locator/m/stations/";

		$scope.$on('loaded', function(event, values) {
			$scope.$apply(function() {
				$scope.loading = false; 
			});
		});
    }
]);