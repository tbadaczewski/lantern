"use strict";

var lanternApp = angular.module('lanternApp', [
	'ngAnimate',
    'ngRoute',
	'ngTouch',
    'ngSanitize',
    'lanternControllers'
]);

lanternApp.run(function($rootScope, $http, geolocation, geoencoder, loadstations, loadoutages, twitter) {
    $rootScope.menu = "close";
    $rootScope.position = {"coords" : {"latitude" : "38.8951", "longitude" : "-77.0367"}};

    document.addEventListener('deviceready', function() {
        intializeMe();
    }, false);

    document.addEventListener('resume', function() {
        intializeMe();
    }, false);

    function intializeMe() {
        geolocation().then(function(position) {            
            $rootScope.position = position;

            geoencoder('latLng').then(function(address) {
                $rootScope.address = address[0];
                $rootScope.county = address[1];
                $rootScope.state = address[2];

                loadstations().then(function(data) {
                    $rootScope.stations = data;
                }); 

                loadoutages().then(function(data) {
                    $rootScope.outages = data;
                });
            });
        });

        /*
        twitter().then(function(timeline) {
            $rootScope.tweets = timeline;
        });
        */
    }
});

lanternApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
        when('/', {
            templateUrl: 'partials/main.html',
            controller: 'MainCtrl'
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
            templateUrl: 'partials/outage-list.html',
            controller: 'OutageListCtrl'
        }).
        when('/outage-map', {
            templateUrl: 'partials/outage-map.html',
            controller: 'OutageMapCtrl'
        }).
        when('/tips', {
            templateUrl: 'partials/tips.html',
            controller: 'TipsCtrl'
        }).
        when('/twitter', {
            templateUrl: 'partials/twitter.html',
            controller: 'TwitterCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
    }
]);

lanternApp.factory('validatetag', ['$window',
    function ($window) {
        return function ($id) {
            var now = new Date(), last = new Date();
            var last = new Date();
            var count = 0, diffMs = 0, diffMins = 0;;
            var tags = eval(localStorage.getItem("tags"));
            var limit = 15;

            if(tags != null) {
                for(var i = 0; i < tags.length; i++) {
                    if(tags[i].station.id == $id) {
                        last = new Date(tags[i].station.lastupdated);
                        now = new Date();
                        count = tags[i].station.count;
                        diffMs = last - now;
                        diffMins = Math.abs(Math.round(((diffMs % 86400000) % 3600000) / 60000)); // minutes

                        if(diffMins <= limit && count >= 2) {
                            $window.navigator.notification.alert('You must wait at least 15 minutes to tag THIS station again.', null, 'Exceeded Tag Limit', 'Close');
                            
                            return false;
                        } else if(diffMins > limit && count >= 2) {
                            tags[i].station.count = 0;
                            localStorage.setItem("tags", JSON.stringify(tags));
                        }
                    }
                }
            }

            return true;
        };
    }
]);

lanternApp.factory('twitter', ['$q', '$rootScope','$window',
    function ($q, $rootScope, $window) {
        return function () {
            var deferred = $q.defer();
            var cb = new Codebird;
            cb.setConsumerKey("m7nsVF0NSPBpipUybhJAXw","4XwyY0IZ9uqvyARzTCDFQIW2I8CSkOMeh5yW6g");
            cb.setToken("2161399610-perf69tORepQI8eYEA4JlYZR863TeClEVfq6Z9A","JiQ2zvxYCOnW3hRe76wEd2t25N4syvYu55NLllRHsAP7a");

            var params = {
                "screen_name": "energy",
                "count": "25"
            };

            cb.__call(
                "statuses_userTimeline",
                params,
                function (reply) {
                    var formatted = "";

                    for(var i = 0; i < reply.length; i++) {
                        formatted += "<div class='entry clearfix'><a href=\"https://twitter.com/energy\" target=\"_blank\" class=\"title\">" + reply[i].user.name + "</a><small class='time'>" + parseTwitterDate(reply[i].created_at) + "</small><br /><div class='message'><a href=\"https://twitter.com/energy\" target=\"_blank\" class=\"logo\"><img src='" + reply[i].user.profile_image_url + "' /></a>" + autoHyperlinkUrls(reply[i].text) + "</div><div class='block'><div class='right'><a href='https://twitter.com/intent/tweet?in_reply_to=" + reply[i].id + "' target='_blank'><span class='icon-reply' aria-hidden='true'></span></a>&nbsp;&nbsp;&nbsp;<a href='https://twitter.com/intent/retweet?tweet_id=" + reply[i].id + "' target='_blank'><span class='icon-retweet' aria-hidden='true'></span></a>&nbsp;&nbsp;&nbsp;<a href='https://twitter.com/intent/favorite?tweet_id=" + reply[i].id + "' target='_blank'><span class='icon-favorite' aria-hidden='true'></span></a></div></div></div>";
                    }

                    deferred.resolve(formatted);                 
                }
            );

            return deferred.promise;
        };
    }
]);

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
    
    if (diff <= 1) {return "now";}
    if (diff < 60) {return diff + " s";}
    if (diff <= 3540) {return Math.round(diff / 60) + "m";}
    if (diff <= 86400) {return Math.round(diff / 3600) + "h";}
    if (diff < 604800) {return Math.round(diff / 86400) + "d";}
    
    return system_date;
}

lanternApp.factory('geolocation', ['$q', '$rootScope', '$window',
    function ($q, $rootScope, $window) {
        return function () {
            var deferred = $q.defer();
            var options = { maximumAge: 30000, timeout: 30000, enableHighAccuracy: false }
            
            function onSuccess(position) {
                deferred.resolve(position);
            }

            function onError(error) {
                deferred.resolve($rootScope.position);
            }

            $window.navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

            return deferred.promise;
        };
    }
]);

lanternApp.factory('geoencoder', ['$q', '$rootScope',
    function ($q, $rootScope) {
        return function ($type) {
            var deferred = $q.defer();
            var geocoder = new google.maps.Geocoder();
            var position = $rootScope.position;
            var params = null;

            if($type == 'latLng') {
                params = {'latLng': new google.maps.LatLng(position.coords.latitude, position.coords.longitude)};
            } else {
                params = {'address': $rootScope.address};
            }

            geocoder.geocode(params, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var location = new Array("","","");

                    //Beautified Address
                    location[0] = results[0].formatted_address;

                    //County
                    for(var i=0; i < results[0].address_components.length; i++) {
                        if (results[0].address_components[i].types[0] == "administrative_area_level_2") {
                            location[1] = results[0].address_components[i].long_name.toLowerCase().replace("county","").trim();
                        }
                    }

                    //State
                    for(var i=0; i < results[0].address_components.length; i++) {
                        if (results[0].address_components[i].types[0] == "administrative_area_level_1") {
                            location[2] = results[0].address_components[i].short_name;
                        }
                    }

                    if($type == 'address') {
                        $rootScope.position = {"coords" : {"latitude" : results[0].geometry.location.lat(), "longitude" : results[0].geometry.location.lng()}};
                    }

                    deferred.resolve(location);
                }
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadstations', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function () {
            var deferred = $q.defer();

            $http.get('http://doelanternapi.parseapp.com/gasstations/search/' + $rootScope.position.coords.latitude + '/' + $rootScope.position.coords.longitude).success(function (data) {
                deferred.resolve(eval(data));
            }).error(function(data) {
                deferred.resolve(null);
            });

            return deferred.promise;
        };
    }
]);

lanternApp.factory('loadoutages', ['$q', '$rootScope', '$http',
    function ($q, $rootScope, $http) {
        return function () {
            var deferred = $q.defer();

            $http.get('http://doelanternapi.parseapp.com/utilitycompany/data/territory/' + $rootScope.state + '/' + $rootScope.county).success(function (data) {
                deferred.resolve(eval(data));
            }).error(function(data) {
                deferred.resolve(null);
            });

            return deferred.promise;
        };
    }
]);

lanternApp.directive('focusme', function($timeout, $rootScope) {
    return {
        link: function(scope, element, attrs) {  
            scope.$watch('searchfocus', function(value) {
                $timeout(function() {
                    if (value == true) {
                        if(document.activeElement != element[0]) {
                            element[0].focus();

                            if (typeof SoftKeyboard !== 'undefined') {
                                SoftKeyboard.show();
                            }                      
                        }
                    }
                }, 500);
            });

            element.bind("keyup", function(e) {
                if(e.keyCode == 13) {
                    $rootScope.$emit('addressUpdated', new Date());
                    element[0].blur();

                    if (typeof SoftKeyboard !== 'undefined') {
                        SoftKeyboard.hide();
                    }
                }     
            });
        }
    };
});

lanternApp.directive('googlemap', function($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div></div>',
        link: function(scope, element, attrs) {
            var intialized = false;
            var prev = null;
            var map = null;
            var mapmarkers = [];
            var mapOptions = {
                zoom: 12,
                center: new google.maps.LatLng($rootScope.position.coords.latitude, $rootScope.position.coords.longitude),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                panControl: false,
                zoomControl: false,
                streetViewControl: false
            };

            map = new google.maps.Map(document.getElementById(attrs.id), mapOptions);

            google.maps.event.addListener(map, 'tilesloaded', function(e) {
                google.maps.event.addListener(map, 'click', function(e) {
                    scope.$apply(function() {
                        scope.showdetails = null;
                    });

                    if(scope.prev != null) {
                        var normal = { 
                            url: scope.prev.icon.url,
                            scaledSize: new google.maps.Size(25,40)
                        };

                        scope.prev.setIcon(normal);
                    }
                });

                if(!intialized) {
                    scope.init();
                }
            });

            scope.init = function () {
                for (var i = 0; i < mapmarkers.length; i++) {
                    mapmarkers[i].setMap(null);
                }

                mapmarkers = [];

                scope.addMarkers(scope.markers);
            }

            scope.addMarkers = function (markers) {
                var bounds = new google.maps.LatLngBounds();

                angular.forEach(markers, function (marker) {                    
                    var size = new google.maps.Size(25,40);
                    var myLatlng = new google.maps.LatLng(marker.latitude, marker.longitude);
                    var point = new google.maps.Marker({
                        position: myLatlng, 
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                        map: map,
                        id : marker.id,
                        operatingStatus : marker.operatingStatus,
                        station : marker.station,
                        address : marker.address,
                        city : marker.city,
                        region : marker.region,
                        zip : marker.zip,
                        "icon" : {
                            url: 'img/pin-' + marker.operatingStatus.toLowerCase() + '.png',
                            scaledSize: size
                        } 
                    });

                    mapmarkers.push(point);
                    bounds.extend(myLatlng);

                    google.maps.event.addListener(point, 'click', function() {
                        scope.$apply(function () {
                            if(scope.prev != null) {
                                var normal = { 
                                    url: scope.prev.icon.url,
                                    scaledSize: new google.maps.Size(25,40)
                                };

                                scope.prev.setIcon(normal);
                            }

                            var large = {
                                url: point.icon.url,
                                scaledSize: new google.maps.Size(50,80)
                            };

                            point.setIcon(large);

                            scope.stationid = point.id;
                            scope.operatingStatus = point.operatingStatus;
                            scope.station = point.station;
                            scope.latitude = point.latitude;
                            scope.longitude = point.longitude;
                            scope.address = point.address;
                            scope.city = point.city;
                            scope.region = point.region;
                            scope.zip = point.zip;
                            
                            if(!scope.showdetails) {
                                scope.showdetails = "show";
                            }

                            scope.prev = point;
                        });
                    });
                });

                map.fitBounds(bounds);
                intialized = true;
            }

            scope.$watch('markers', function(newValue, oldValue) {
                if (newValue !== oldValue) {        
                    scope.init();
                }
            });
        }
    };
});

lanternApp.directive('modaldialog', function($rootScope) {
    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        template: "<div class='ng-modal' ng-show='show'><div class='ng-modal-dialog' ng-transclude></div></div>",
        link: function (scope, element, attrs) {
            scope.$watch('show', function(newValue, oldValue) {
                if (newValue !== oldValue) {        
                    scope.toggleModal();
                }
            });

            window.onresize = function() {
                scope.fitHeight();
            };

            scope.toggleModal = function() {
                scope.fitHeight();

                if(scope.show === true) {
                    document.body.insertBefore(element[0], document.body.firstChild);
                } else {
                    element[0].remove();
                }
            }

            scope.fitHeight = function() {
                if(document.body.clientHeight <= element[0].children[0].offsetHeight) {
                    element[0].children[0].children[0].style.height = (document.body.clientHeight - 75) + "px";
                }
            }
        }
    };
});

lanternApp.directive('contentframe', function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            id: '@',
            title: '@',
            icon: '@',
            src: '@'
        },
        template: "<div><div id='frame-nav'><a id='return' href='#/'><span class='icon-close'></span></a><span id='title'><span class='{{icon}}'></span>{{title}}</span><span id='arrows'><a id='back' href='' ng-click='back()' class='disabled'><span class='icon-arrow2-left'></span></a><a id='forward' href='' ng-click='forward()' class='disabled'><span class='icon-arrow2-right'></span></a></span></div><div id='frame-content'><iframe id='contentframe' src='{{src}}' name='contentframe' ng-transclude></iframe></div></div>",
        link: function (scope, element, attrs) {
            scope.index = 0;
            scope.frame = element[0].childNodes[1].childNodes[0];
            scope.history = [scope.frame.contentWindow.location.pathname];

            scope.frame.onload = function() {
                var fonts = document.createElement("link");
                var css = document.createElement("link");
                var back = document.getElementById("back");
                var forward = document.getElementById("forward");

                fonts.href = "../css/fonts.css"; 
                fonts.rel = "stylesheet"; 
                fonts.type = "text/css"; 
                this.contentWindow.document.body.appendChild(fonts);

                css.href = "../css/tips.css"; 
                css.rel = "stylesheet"; 
                css.type = "text/css";                 
                this.contentWindow.document.body.appendChild(css);

                this.height = (this.contentWindow.document.body.offsetHeight + 30) + "px";
                this.parentNode.scrollTop = 0;

                if(scope.index > 0) {
                    back.className = "";
                } else {
                    back.className = "disabled";
                }

                if(scope.index < (scope.history.length - 1)) {
                    forward.className = "";
                } else {
                    forward.className = "disabled";
                }

                if(this.contentWindow.location.pathname != scope.history[scope.index]) {
                    scope.history.push(this.contentWindow.location.pathname);
                    scope.index++;
                }
            }

            scope.back = function() {
                if(scope.index > 1) {
                    scope.index--;
                    scope.frame.src = scope.history[scope.index];
                }
            }

            scope.forward = function() {
                if(scope.index < scope.history.length - 1) {
                    scope.index++;
                    scope.frame.src = scope.history[scope.index];
                }
            }
        }
    };
});

lanternApp.directive('loading', function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        template: '<div class="progress" ng-hide="hideloading"><div ng-transclude>Loading</div></div>',
        link: function (scope, element, attrs) {
            scope.$watch('hideloading', function(newValue, oldValue) {
                scope.hideloading = newValue;
            });
        },
    };
});