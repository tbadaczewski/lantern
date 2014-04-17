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
    	$scope.progressShown = true;

   		$scope.openDialog = function() {
			$scope.show = true;
		}

   		$scope.closeDialog = function() {
			$scope.show = false;
		}
    	
    	$scope.camera = function($event) {
    		$event.preventDefault();

			function onConfirm(buttonIndex) {
				if(buttonIndex > 1) {
					navigator.camera.getPicture(
						onSuccess,
						onFail, {
							quality: 30,
							allowEdit : true,
							sourceType : Camera.PictureSourceType.CAMERA,
							destinationType : Camera.DestinationType.DATA_URL
						}
					);
				}
			}

			function onSuccess(imageData) {
	    		var cb = new Codebird;
	            cb.setConsumerKey("m7nsVF0NSPBpipUybhJAXw", "4XwyY0IZ9uqvyARzTCDFQIW2I8CSkOMeh5yW6g");
	            cb.setToken("2161399610-perf69tORepQI8eYEA4JlYZR863TeClEVfq6Z9A","JiQ2zvxYCOnW3hRe76wEd2t25N4syvYu55NLllRHsAP7a");

				var params = {
				    "status": "#downedpowerline",
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
			}

			function onFail(message) {
				$window.navigator.notification.alert('Your photo has failed to upload please try again.', null, 'Error', 'Close');
			}
		}

		$rootScope.backstate = "";
		$rootScope.navstate = "hidden";
		$rootScope.animate = "fixed";
		$scope.id = "main";
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

    	$scope.validateTag = function() {
    		var now = new Date();
    		var last = new Date();

    		if(localStorage.getItem("tagtime") != null) {
    			last = new Date(localStorage.getItem("tagtime"));
    		}

    		var count = Number(localStorage.getItem("tagcount"));
			var diffMs = (last - now);
			var diffDays = Math.round(diffMs / 86400000); // days
			var diffHrs = Math.round((diffMs % 86400000) / 3600000); // hours
			var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

			//alert(Math.abs(diffMins) + " - " + count);
    		
    		if(Math.abs(diffMins) <= 15 && count >= 2) {
    			$window.navigator.notification.alert('You must wait at least 15 minutes to tag another station.', null, 'Exceeded Tag Limit', 'Close');
    			return false;
    		} else if(Math.abs(diffMins) > 15 && count >= 2) {
    			localStorage.setItem("tagcount", 0);
    			return true;
    		} else {
    			return true;
    		}
    	}

   		$scope.tagCancel = function() {
   			$scope.show = false;
		};

		$scope.tagStation = function(id, status) {
			if($scope.validateTag() == true) {
				localStorage.setItem("tagtime", new Date());
				localStorage.setItem("tagcount", (Number(localStorage.getItem("tagcount")) + 1));
				
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
			if($scope.validateTag() == true) {
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
			$scope.show = false;
		}

    	$scope.validateTag = function() {
    		var now = new Date();
    		var last = new Date();

    		if(localStorage.getItem("tagtime") != null) {
    			last = localStorage.getItem("tagtime");
    		}

    		var count = Number(localStorage.getItem("tagcount"));
			var diffMs = (last - now);
			var diffDays = Math.round(diffMs / 86400000); // days
			var diffHrs = Math.round((diffMs % 86400000) / 3600000); // hours
			var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    		
    		if(Math.abs(diffMins) <= 15 && count >= 2) {
    			$window.navigator.notification.alert('You must wait at least 15 minutes to tag another station.', null, 'Exceeded Tag Limit', 'Close');
    			return false;
    		} else if(Math.abs(diffMins) > 15 && count >= 2) {
    			localStorage.setItem("tagcount", 0);
    			return true;
    		} else {
    			return true;
    		}
    	}

		$scope.tagStation = function(id, status) {
			if($scope.validateTag() == true) {
				localStorage.setItem("tagtime", new Date());
				localStorage.setItem("tagcount", (Number(localStorage.getItem("tagcount")) + 1));

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
			if($scope.validateTag() == true) {
				if(status != "red") {
					$scope.status = "open";
				} else {
					$scope.status = "closed";
				}

				$scope.stationid = id
				$scope.show = false;
			}
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

lanternControllers.controller('TwitterCtrl', ['$scope', '$rootScope', '$sce',
    function ($scope, $rootScope, $sce) {
    	$scope.progressShown = true;
		var cb = new Codebird;
		cb.setConsumerKey("m7nsVF0NSPBpipUybhJAXw", "4XwyY0IZ9uqvyARzTCDFQIW2I8CSkOMeh5yW6g");
		cb.setToken("2161399610-perf69tORepQI8eYEA4JlYZR863TeClEVfq6Z9A","JiQ2zvxYCOnW3hRe76wEd2t25N4syvYu55NLllRHsAP7a");

		var params = {
		    "screen_name": "energy",
		    "count": "25"
		};

		if($rootScope.tweets) {
			$scope.tweets = $rootScope.tweets;
			$scope.progressShown = false;
		} else {
			cb.__call(
				"statuses_userTimeline",
				params,
				function (reply) {
					var formatted = "";

					for(var i = 0; i < reply.length; i++) {
						formatted += "<div class='entry clearfix'><div class='message'><a href=\"https://twitter.com/energy\" target=\"_blank\" class=\"title\">" + reply[i].user.name + "</a><br />" + autoHyperlinkUrls(reply[i].text) + "<small class='time'>" + parseTwitterDate(reply[i].created_at) + "</small></div></div>";
						//formatted += "<div class='entry clearfix'><div class='logo'><a href=\"https://twitter.com/energy\" target=\"_blank\"><img src=\"" + reply[i].user.profile_image_url_https + "\" /></a></div>" + "<div class='message'><a href=\"https://twitter.com/energy\" target=\"_blank\" class=\"title\">" + reply[i].user.name + "</a><br />" + autoHyperlinkUrls(reply[i].text) + "<small class='time'>" + parseTwitterDate(reply[i].created_at) + "</small></div></div>";
					}
					
					$scope.$apply(function() {				
						$rootScope.tweets = $scope.tweets = formatted;
						$scope.progressShown = false;
					});
				}
			);
		}

		function autoHyperlinkUrls(text) {
			text = text.replace(/(HTTP:\/\/|HTTPS:\/\/)([a-zA-Z0-9.\/&?_=!*,\(\)+-]+)/ig, "<a href=\"$1$2\" target=\"_blank\">$1$2</a>");
			text = text.replace(/#(\S*)/g,'<a href="https://twitter.com/search?q=$1" target=\"_blank\">#$1</a>');
			text = text.replace(/@(\S*)/g,'<a href="https://twitter.com/$1" target=\"_blank\">@$1</a>');
			
			return text;
		}

		function parseTwitterDate(tdate) {
		    var system_date = new Date(Date.parse(tdate));
		    var user_date = new Date();

		    var diff = Math.floor((user_date - system_date) / 1000);
		    
		    if (diff <= 1) {return "just now";}
		    if (diff < 20) {return diff + " seconds ago";}
		    if (diff < 40) {return "half a minute ago";}
		    if (diff < 60) {return "less than a minute ago";}
		    if (diff <= 90) {return "one minute ago";}
		    if (diff <= 3540) {return Math.round(diff / 60) + " minutes ago";}
		    if (diff <= 5400) {return "1 hour ago";}
		    if (diff <= 86400) {return Math.round(diff / 3600) + " hours ago";}
		    if (diff <= 129600) {return "1 day ago";}
		    if (diff < 604800) {return Math.round(diff / 86400) + " days ago";}
		    if (diff <= 777600) {return "1 week ago";}
		    
		    return "on " + system_date;
		}

		$rootScope.backstate = "";
		$rootScope.navstate = "false";
		$rootScope.animate = "slide";
		$scope.id = "twitter";
    }
]);