(function () {
   'use strict';
}());

var lanternControllers = angular.module('lanternControllers', []);

lanternControllers.controller('SearchCtrl', ['$scope', '$rootScope', '$http', '$timeout', 'geolocation', 'geoencoder', 'loadstations', 'loadoutages', 'connection',
    function ($scope, $rootScope, $http, $timeout, geolocation, geoencoder, loadstations, loadoutages, connection) {
		$scope.searchfocus = false;

		$scope.search = function() {
			if(connection.type() === 'No network connection') {
				return;
			}

			$rootScope.loading = true;
			$scope.searchfocus = false;
			$rootScope.address = $scope.address;

			geoencoder('address').then(function(address) {
				if(angular.isObject(address)) {
					$rootScope.address = $scope.address = address[0];
					$rootScope.county = address[1];
					$rootScope.state = address[2];

					loadstations().then(function(data) {
						$rootScope.stations = data;
						if(gaPlugin){gaPlugin.trackEvent(null, null, "Load Stations", $rootScope.address, "Stations", data.length);}
						$rootScope.$emit('stationsUpdated', new Date());

						loadoutages().then(function(data) {
							$rootScope.outages = data;
							if(gaPlugin){gaPlugin.trackEvent(null, null, "Load Outages", $rootScope.address, "Outages", data.length);}
							$rootScope.$emit('outagesUpdated', new Date());
							$rootScope.loading = false;
						});
					});
				} else {
					$rootScope.loading = false;
					//$rootScope.stations = null;
					//$rootScope.outages = null;
					//$rootScope.$emit('stationsUpdated', new Date());
					//$rootScope.$emit('outagesUpdated', new Date());
				}
			});

			if(gaPlugin){gaPlugin.trackEvent(null, null, "Search Stations/Outages", $rootScope.address, localStorage.SessionID, 0);}
		};

		$scope.clear = function() {
			if($scope.searchfocus === false) {
				$timeout(function(){
					$scope.address = "";

					if($scope.searchfocus === false) {
						$scope.searchfocus = true;
					}
				}, 500);
			}
		};

		$scope.showFocus = function() {
			if($scope.searchfocus === false) {
				$timeout(function(){
					$scope.searchfocus = true;
				}, 500);
			}
		};

		$scope.hideFocus = function() {
			if($scope.searchfocus === true) {
				$timeout(function(){
					$scope.searchfocus = false;

					if($scope.address === "") {
						$scope.address = $rootScope.address;
					}
				}, 500);
			}
		};

		$scope.locate = function() {
			if(connection.type() === 'No network connection') {
				return;
			}

			$rootScope.loading = true;

			geolocation().then(function(position) {
				$rootScope.position = position;

				geoencoder('latLng').then(function(address) {
					if(angular.isObject(address)) {
						$rootScope.address = $scope.address = address[0];
						$rootScope.county = address[1];
						$rootScope.state = address[2];

						loadstations().then(function(data) {
							$rootScope.stations = data;
							$rootScope.$emit('stationsUpdated', new Date());

							loadoutages().then(function(data) {
								$rootScope.outages = data;
								$rootScope.$emit('outagesUpdated', new Date());
								$rootScope.loading = false;
							});
						});
					} else {
						$rootScope.loading = false;
					}
				});

				if(gaPlugin){gaPlugin.trackEvent(null, null, "Locate Current Position", $scope.address, localStorage.SessionID, 0);}
			});
		};

		$scope.toggleMenu = function() {
            if($rootScope.menu == "open") {
               $rootScope.menu = "close";
            } else {
               $rootScope.menu = "open";
            }

            return false;
		};

        $rootScope.$on('addressUpdated', function() {
			$scope.stations = $rootScope.stations;
			$scope.search();
		});
    }
]);

lanternControllers.controller('MainCtrl', ['$scope', '$rootScope', '$http', '$window', '$location', 'geolocation', 'geoencoder',
    function ($scope, $rootScope, $http, $window, $location, geolocation, geoencoder) {
		$rootScope.backstate = "";
		$rootScope.navstate = "hidden";
		$rootScope.animate = "fixed";
		$scope.id = "main";

		if(gaPlugin){gaPlugin.trackPage(null, null, "Main Menu");}
    }
]);

lanternControllers.controller('StationListCtrl', ['$q','$scope', '$rootScope', '$http', '$window', 'loadphone', 'loadstations', 'validatetag', 'tagstatus', 'connection',
    function ($q, $scope, $rootScope, $http, $window, loadphone, loadstations, validatetag, tagstatus, connection) {
		$scope.tagCancel = function() {
			$scope.show = false;
		};

		$scope.callStation = function(id) {
			if(connection.type() === 'No network connection') {
				return;
			}

			loadphone(id).then(function(data) {
				if(data !== null) {
					location.href = 'tel:' + data.formattedPhoneNumber.replace(/\(|\)| |\-/g, '');
				} else {
					$window.navigator.notification.alert('No phone number for this location.', null, null, 'Close');
				}
			});
		};

		$scope.tagStation = function(id, title, address, status) {
			if(connection.type() === 'No network connection') {
				return;
			}

			if(validatetag(id) === true) {
				var tags = eval(localStorage.getItem("tags"));
				var updated = false;

				if(tags !== null) {
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
						$scope.showdetails = null;
						$rootScope.$emit('stationsUpdated', new Date());
					});

					if(gaPlugin){gaPlugin.trackEvent(null, null, "Tag Station", (title + " - " + address), localStorage.SessionID, status);}
				});
			}
		};

		$scope.tagOpenWindow = function(id, status) {
			if(validatetag(id) === true) {
				$scope.status = status;

				switch(status) {
					case "green":
						$scope.state = "open";
						$scope.title = "Gas Station Status: Open";
						$scope.message = "closed";
						break;
					case "yellow":
						$scope.state = "uncertain";
						$scope.title = "Gas Station Status: Uncertain";
						$scope.message = "open or closed";
						break;
					case "red":
						$scope.state = "closed";
						$scope.title = "Gas Station Status: Closed";
						$scope.message = "open";
						break;
				}

				$scope.stationid = id;
				$scope.show = true;
			}
		};

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no,enableViewportScale=yes');
			if(gaPlugin){gaPlugin.trackEvent(null, null, "Directions Requested", $rootScope.address, url, 0);}
		};

		$scope.results = function() {
			$scope.stations = $rootScope.stations;
			
			if(!angular.isObject($scope.stations)) {
				$scope.noresults = true;
			} else {
				$scope.noresults = false;
			}

			$rootScope.loading = false;
		};

		$scope.refresh = function() {
			$rootScope.$emit('refresh', new Date());
		};
		
		$rootScope.$on('stationsUpdated', function() {
			$scope.results();
		});

		$rootScope.$on('refresh', function() {
			if(connection.type() === 'No network connection') {
				return;
			}

			loadstations().then(function(stations) {
				$rootScope.stations = $scope.stations = stations;
				$rootScope.$emit('stationsUpdated', new Date());
			});
		});

		$rootScope.loading = true;
		$rootScope.typestate = true;
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.navbtnlabel = "Map";
		$rootScope.navtext = "GAS STATIONS";
		$rootScope.navclass = "gas";
		$rootScope.maptarget = "station-map";
		$rootScope.listtarget = "station-list";
		$rootScope.mapactive = "";
		$rootScope.listactive = "active";
		$rootScope.animate = "fixed";
		$scope.id = "station-list";
		$scope.saddr = encodeURI($rootScope.address);
		$scope.results();

		if(gaPlugin){gaPlugin.trackPage(null, null, "Station List");}
    }
]);

lanternControllers.controller('StationMapCtrl', ['$scope', '$rootScope', '$http', '$timeout', '$window', 'loadphone', 'geolocation', 'geoencoder', 'loadstations', 'validatetag', 'tagstatus', 'connection',
    function ($scope, $rootScope, $http, $timeout, $window, loadphone, geolocation, geoencoder, loadstations, validatetag, tagstatus, connection) {
		var station_markers = null;

		$rootScope.typestate = true;
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.navbtnlabel = "List";
		$rootScope.navtext = "GAS STATIONS";
		$rootScope.navclass = "gas";
		$rootScope.maptarget = "station-map";
		$rootScope.listtarget = "station-list";
		$rootScope.mapactive = "active";
		$rootScope.listactive = "";
		$rootScope.animate = "fixed";
		$scope.id = "station-map";

		$scope.loadMarkers = function() {
			var stations = $rootScope.stations;
			var size = new google.maps.Size(25,40);

			station_markers = [];

			for(var i=0; i < stations.length; i++) {
				station_markers.push({
					"id" : stations[i].id,
					"station" : stations[i].station,
					"operatingStatus" : stations[i].operatingStatus,
					"address" : stations[i].addressLine1,
					"city" : ((stations[i].addressLine2 !== undefined) ? stations[i].addressLine2.replace(" ", "") : ""),
					"region" : ((stations[i].addressLine3 !== undefined) ? stations[i].addressLine3.substring(0, stations[i].addressLine3.lastIndexOf(" ")).replace(" ", "") : ""),
					"zip" : ((stations[i].addressLine3 !== undefined) ? stations[i].addressLine3.substring(stations[i].addressLine3.lastIndexOf(" ")).replace(" ", "") : ""),
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
		};

		$scope.$on('markersLoaded', function() {
			$timeout(function(){
				$rootScope.loading = false;
			}, 500);
		});

		$rootScope.$on('stationsUpdated', function() {
			$scope.loadMarkers();
		});

		$scope.getDirections = function(url) {
			window.open(encodeURI(url) + '&saddr=' + encodeURI($rootScope.address), '_system', 'location=no,enableViewportScale=yes');
			if(gaPlugin){gaPlugin.trackEvent(null, null, "Directions Requested", $rootScope.address, url, 0);}
		};

		$scope.tagCancel = function() {
			$scope.show = false;
		};

		$scope.callStation = function(id) {
			if(connection.type() === 'No network connection') {
				return;
			}

            loadphone(id).then(function(data) {
				if(data !== null) {
					location.href = 'tel:' + data.formattedPhoneNumber.replace(/\(|\)| |\-/g, '');
				} else {
					$window.navigator.notification.alert('No phone number for this location.', null, null, 'Close');
				}
            });
		};

		$scope.tagStation = function(id, title, address, status) {
			if(connection.type() === 'No network connection') {
				return;
			}

			if(validatetag(id) === true) {
				var tags = eval(localStorage.getItem("tags"));
				var updated = false;

				if (tags !== null) {
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
						$scope.showdetails = null;
						$rootScope.$emit('stationsUpdated', new Date());
					});

					if(gaPlugin){gaPlugin.trackEvent(null, null, "Tag Station", (title + " - " + address), localStorage.SessionID, status);}
				});
			}
		};

		$scope.tagOpenWindow = function(id, status) {
			if(validatetag(id) === true) {
				$scope.status = status;

				switch(status) {
					case "green":
						$scope.state = "open";
						$scope.title = "Gas Station Status: Open";
						$scope.message = "closed";
						break;
					case "yellow":
						$scope.state = "uncertain";
						$scope.title = "Gas Station Status: Uncertain";
						$scope.message = "open or closed";
						break;
					case "red":
						$scope.state = "closed";
						$scope.title = "Gas Station Status: Closed";
						$scope.message = "open";
						break;
				}

				$scope.stationid = id;
				$scope.show = true;
			}
		};

		if(connection.type() === 'No network connection') {
			return;
		}

		if($rootScope.stations === null) {
			loadstations().then(function(data) {
				$rootScope.stations = data;
				$scope.loadMarkers();
				$rootScope.$emit('stationsUpdated', new Date());
			});
		} else {
			$scope.loadMarkers();
		}

		$rootScope.loading = true;

		if(gaPlugin){gaPlugin.trackPage(null, null, "Station Map");}
    }
]);

lanternControllers.controller('OutageListCtrl', ['$scope', '$rootScope', '$http', '$window', 'loadoutages', '$location', '$timeout',
    function ($scope, $rootScope, $http, $window, loadoutages, $location, $timeout) {
		$scope.getMap = function($event, $url) {
			$event.preventDefault();
			$rootScope.outagemap = $url;
			$location.path("/outage-map");
		};

		$scope.results = function() {
			$scope.outages = $rootScope.outages;

			if(!angular.isObject($scope.outages)) {
				$scope.noresults = true;
			} else {
				$scope.noresults = false;
			}

			$rootScope.loading = false;
		};

        $rootScope.$on('outagesUpdated', function() {
			$scope.results();
		});

		$rootScope.loading = true;
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.typestate = false;
		$rootScope.navtext = "POWER OUTAGES";
		$rootScope.navclass = "lightning";
		$rootScope.animate = "fixed";
		$scope.id = "outage-list";
		$scope.results();

		if(gaPlugin){gaPlugin.trackPage(null, null, "Outage List");}
    }
]);

lanternControllers.controller('OutageMapCtrl', ['$scope', '$rootScope', '$window',
    function ($scope, $rootScope, $window) {
		$rootScope.backstate = "visible";
		$rootScope.navstate = "visible";
		$rootScope.animate = "slide";
		$scope.id = "outage-map";
		$scope.src = $rootScope.outagemap;

		alert($rootScope.outagemap);

		$rootScope.loading = true;

		$scope.$on('loaded', function(event, values) {
			$scope.$apply(function() {
				$rootScope.loading = false;
			});
		});

		if(gaPlugin){gaPlugin.trackPage(null, null, "Outage Map");}
    }
]);

lanternControllers.controller('TipsCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "tips-guides";
        $scope.disabledback = "disabled";
		$scope.disabledforward = "disabled";
		$rootScope.loading = true;

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

			$rootScope.loading = false;
        });

        $scope.back = function() {
			$scope.$broadcast('goback');
        };

        $scope.forward = function() {
			$scope.$broadcast('goforward');
        };

		if(gaPlugin){gaPlugin.trackPage(null, null, "Tips & Guides");}
    }
]);

lanternControllers.controller('AlternativeCtrl', ['$scope', '$rootScope', '$window',
    function ($scope, $rootScope, $window) {
		$rootScope.backstate = "hidden";
		$rootScope.navstate = "hidden";
		$rootScope.animate = "slide";
		$scope.id = "alternative";
		$scope.src = "http://www.afdc.energy.gov/afdc/locator/m/stations/r?fuel=ELEC&loc=" + encodeURIComponent($rootScope.address);

		if(connection.type() === 'No network connection') {
			return;
		}

		$rootScope.loading = true;

		$scope.$on('loaded', function(event, values) {
			$scope.$apply(function() {
				$rootScope.loading = false;
			});
		});

		$scope.searchAgain = function() {
			$scope.src = "http://www.afdc.energy.gov/afdc/locator/m/stations/";
		};

		$scope.searchCurrent= function() {
			$scope.src = "http://www.afdc.energy.gov/afdc/locator/m/stations/r?fuel=ELEC&loc=" + encodeURIComponent($rootScope.address);
			if(gaPlugin){gaPlugin.trackEvent(null, null, "Search Alternative Fuels", $rootScope.address, localStorage.SessionID, 0);}
		};
		
		if(gaPlugin){gaPlugin.trackPage(null, null, "Alternative Fuel List");}
    }
]);

lanternControllers.controller('AboutCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
		$rootScope.loading = false;
		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "about";

		if(gaPlugin){gaPlugin.trackPage(null, null, "About Lantern Live");}
    }
]);

lanternControllers.controller('TermsCtrl', ['$scope', '$rootScope',
    function ($scope, $rootScope) {
		$rootScope.loading = false;
		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "terms";

		if(gaPlugin){gaPlugin.trackPage(null, null, "Terms of Use");}
    }
]);