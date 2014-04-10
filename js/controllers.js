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

    		var d = new Date();
            var cb = new Codebird;
            cb.setConsumerKey("m7nsVF0NSPBpipUybhJAXw", "4XwyY0IZ9uqvyARzTCDFQIW2I8CSkOMeh5yW6g");
            cb.setToken("2161399610-perf69tORepQI8eYEA4JlYZR863TeClEVfq6Z9A","JiQ2zvxYCOnW3hRe76wEd2t25N4syvYu55NLllRHsAP7a");

            try {
	            cb.__call(
	                "statuses_update",
	                {"status": "Test " + d.getTime()},
	                function (reply) {
	                    // ...
	                }
	            );
        	} catch(err) {
        		alert(err);
        	}

			//navigator.camera.getPicture(onSuccess, onFail, { quality: 25 });
			
			//function onSuccess(imageData) {
				/*
	    		var cb = new Codebird;
	            cb.setConsumerKey("m7nsVF0NSPBpipUybhJAXw", "4XwyY0IZ9uqvyARzTCDFQIW2I8CSkOMeh5yW6g");
	            cb.setToken("2161399610-perf69tORepQI8eYEA4JlYZR863TeClEVfq6Z9A","JiQ2zvxYCOnW3hRe76wEd2t25N4syvYu55NLllRHsAP7a");

				var params = {
				    "status": "This is a test. #downedpowerline",
				    "media[]": '/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjk5NEY1MDYzQjZCMjExRTNBRTVCODdBNTJDQkIwMEVGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjk5NEY1MDY0QjZCMjExRTNBRTVCODdBNTJDQkIwMEVGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OTk0RjUwNjFCNkIyMTFFM0FFNUI4N0E1MkNCQjAwRUYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OTk0RjUwNjJCNkIyMTFFM0FFNUI4N0E1MkNCQjAwRUYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAmQWRvYmUAZMAAAAABAwAVBAMGCg0AABdJAAAcFAAALdEAAEs2/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wgARCAElASUDAREAAhEBAxEB/8QAywAAAgMBAQEAAAAAAAAAAAAAAgQBAwUABgcBAAMBAQEAAAAAAAAAAAAAAAABAgMEBRAAAQQBAwMDBAICAwEAAAAAAQARAgMEECASMEAhMUITIjIUBVBBMyRgIxU0EQABAgMGBAQFBAMBAQAAAAABABEhMQIQMEFRYRIgcSIDgaGxMkCRQlIT8MHRM+FignIjEgEAAAAAAAAAAAAAAAAAAACgEwEAAgEDBAIBBAMBAQAAAAABABEhEDFBIFFhcYGRMKGxwdHw4fFAUP/aAAwDAQACEQMRAAABR5tyCQgKwyLlViNIRWDockqsCWmB2IhlydYiHACF6OBcDFtJ3xTeWtuOnRUhKCAhaLjRvPw/VBBICCLWXSQqa2XDrFUHBeNoKgICC0ADgsHYAA6nnCuQ8xhNcN7m2t59pQQpAg0ajQvLw/TPBwAGBc59zUHBYMWgReNkdiM9podYrg4BZenSIgtTkFXLibo2EbfH0llpwSlIEzRcP1n4nqjggFg8vrFbUgIXDsYSZAymgKkGh2CqatAgtGIgBUNBCzFxboaUVp8fV2d8EpSBM0HGhWfiuqeDgpF5bWFWjYKDAx2pwDarMcNzo7N9U1ipuJQbVoJAsJtNRq0NEGR+o4umMdeDkSImaJD95+N6o4fBUHkNsl2GHI4OHYndNXKkrjWz1ci1rhybyducBAImKBWF4jCoHU/QBs8XUOWnBwSkTNAjQvPx/VPIgODHtYloHNYhYad01bN7GW+bpi8r6WvUuzWJrgrUGAsumga5zIEO8NNHo+fe3l2gfBKCafJ0Kz8l1RwcEAJeEbr3hl6Yc1bNTN6uW/oMtRDz/Rz6eWuVplU5AeTrhwrB6Oeql5i5ZHcnDTSfp8NWOTeB8EpEDznQrPyvVBBwQELVRdPmN+BG87k7JvQy29Jltpy7kZDaFwrU5WuO3j0ZOmGZrjU0ynU0QXpkmu16JG5y73YawPglEtPE6DjzHXmSctQErROevG0ww9uO5V6Hn6dOb00Xp3CMSapBvye2FgtfPZmazqnI1wXuBEYQykndT9Jx9M51A+DgITpOg4851ZkOQhrlRR2+cvPA34dzLf0+O9wk6WHpmQtfPTVim0qx57AVaRIjSGFRXeYp+S2xkNeHt828Q+HwcgmnBaDz8/1QQSHCz6NTPr89Uef35PR4dXpMtIRnUJXCTSdRXUeox6NzOrREImoThrqmzTPOR8s3xfm/Zc+t2WkRXBwcgmnBaDzweqCCRczz1S7PTZGnl9+P02HV6CGaEB4msZOuKhLMbXBvZbasO0UgLStRRUt3nRWfhLPa4a3xQ51EVw4CUS04LQeeH1QYiCGZbWTa28etOs9DO9OLZFDSJWW6zrldy9K1Y0bmqAw9csjbnIWiq3CVGkk9/KxmozqJqE+DkE04J9xjdWZhIuY7pn4lvTw6m0XKrppiS5oASLVYDmwT49IjDa81dVVnrC2IrZefz/SN/K7kxmozqJuEQEoITbWg88bqgwuFpbZLUvn0bemw6LgslkqOWZUJk5JohHStEySrefnY6LU9SsrhXa4edmm1UIiaHOumoTgOQQNudF5h34GGhpnDPKZa5eXRpTdgjlkqKXaMw4Kxm5uckFzXXjk5dAlOPNu8l6jOT4cIiaHOom4RwcEocc6Lz1fU4xAQEfiefqPPZkJc2xUpkqlOR8mAM1DNQTGazTloZ78Fjh/XnxggOHCBlxFxFwjg4JQ250XGr6nFzBQA/A8/W9ltcE3lbF8qKXyuE4GNJ2oZIbvM2kFeZj0XuHNMFKzVTgOHCBlxFxFwiAkJQ050XGt6vFAQAp/Oefr18t7BRedsuZqVUzRJtVEUYFO5VtpXOBrPIx6Xax1N+XLTVmoDhwAw4i+ihTgOCUNNaLz1/V4uCArT8DzdmllsQBedwpmuVWzXNdS0CXzOhuxlKqxxVNXVDO2M1KUvPi1IsAKXqVDdTjYboZa8ORMi0XGp6vCQcAJ+K5e1rLXmVtFedsslXKkKllHpFnA3bz4OCGEKQ5gp27Y3a5witOuWwgwxMdfN8nZAEkwLRqNP1eKQIQp+T5ewstuHU0FQw5KaoKWD0Ch8VjkxW0rakU5ZLUirVSI+nDmmAMRhEVkZaeS4e2ByhgWi41fW4IHISjzPN1VY9HDrZS5KoaQuq0ktJTfUkKRm1ZUyAhnxvArBCno789e+LTVgWNHLzcb8dw94JyDCWg41/W4BDhyjz+HQnz9XDBqoKnLFQ7Na0ze1Y0bXChuxq1yI+QIQOWqZq/fC7XO4JZaJTOvK8PZXNWOWGm3LvocogIEPIy0wuXusCEVsFgOfTzDaVlI2oAmiCA4IGtNVKuC1y5edlzZ0YGFrJFKaGN1Q5YYEKroiAEOGvL8Pyd7k0SAYLNdRsEWuTZAE1wSyEVKsSdfJ1bs0wi8Wq417x0erkmlYEAQTJVnXBwSCG0yABAQn4Pm7Cz1tT4HHO9MsVFrkmcEBIpZTLxVr5Or9XD2q50p0pVeeemwL1HVwXa5EHBa1YirKuHwcGXrJBACHD8rhvjY9LCbQvQTLJN9zY1AcBNQAoXVeQOjfU69Y0KsWN9asbXnOsub4sOeAmWpGzs2Mvg4MnVEHAI4BaH4vm7mEbsDxLFRdS5gIhHMFFKeOt11eq4deXlLqzPXfWTl5NaZ37ZxcywwMDESY5OA4MrVSHAIcPheY5utjHV2C+oZub6kU6JdaYhUPKNBLJD5NVT4jQ9JjptGbLhi83dcy1jrmxEgYrGDnXScGTqpDggIGCMPl67MNmXDdTa5lgIrTWV0DRdYDv2CzzVrrGOPbw29SHqymXLNZvaZMUu3ysaIDEQdLiHIYWqwqNZDaOHj5bI8nXoSOVm3cQitMB1Jql5DrPd8HqVniGuuRmNKDMWhDdIbqHLyML9IPbO2pkDEaYw5Rj6ry9PKCsGJt/i7GcruE7UN1HBSmjOi7YbY+ceujjtU1uJYlPSSWSkK2mpbaTTi9wyQzau0izoxILBGyM6lGPolW1gy08/m6XefoYQQ7WnXnAVIz6eL04b2mWRl03c/Spa0YotcHbydrKAxcegM9STJVqmLJDFTZcsdfPe0YWC7OpDH0S46GY2einJ2OZ00ICrybBVhzXn+jPV3w5xmRvp4daCp0V+/I9tza6VQ10/I8XfdFmntPEU7RM3DnZysXNwSIorpePrNAJt+X5ulzn6GZbAcBj4XC6pyezm1ryzmUqr+L0XNedPPZrr4dC89dIAAfl+brUw3al6hmI7hXuGuvm0dsyCxqc66X/9oACAEBAAEFAth9L5cZTuJBkmLMIRYu6iHRAelgrJlh9FcGEX8RaUQERxUQ6kHQdRlOK/yKuZgue1kAqgm8bLrEZqZAICdGRkv7UORMvEftTvF17ZD/AKwhZ59RH6U4lGfiVcoyjTKUZGYMI3TM6/s2BVL+tSrrOUjXIJkU30xCKEGMYo+E7keAFHzG6RX2KQeP1LlMATaUw4lWQqbi8n5V1GUohhtqX9a2vwZpSkq/MvQjzCDRAiCf7j6WzUAjyXxvWPpl4Ih5l9pZjP7OXgeYguhy5UW/TQfO6pf1rZ9pA5SZV+DINJzFesuXmPkzmOB9aovGdXiIKtq8BcSLH5Rkriol1CRUnEyyxpwnGuN9VrAbql7dZh4zcSZRUvIPoPAjoIOm+vHh9Vx4xiRECD1EjndIchNcvHmRj6iTTn5Q5NS1dlJ31L27MyoSU4jnINpH1KHhQDmuvxlUmFlCyHMID5bMy1oPxToEBciVVF1IefuA5AfLxVVkpnHscU/4NtS9uzgCfhM5SpiiooRZAOqK1XUAsjGE4DlTYIiaxgYW2vZkXU8YIO6xmecw8XeIJMqxFCviMcfVRERr21L27CPE/wDrrvkSfRDwPMlVSqKQFGC4OMrG5GmJisil54MgLuHyV24JI4ELgoSkvhsQrIXJSskBGR5UQ8R9dtS9u3Mj9JpEhP7qoGcqsUAVUMoxAQMQuQR4lSxoKzCKy8G2uePmkGNsbF8ImrcCqSlh2xR+eKELJLhOCnGRUKjOX21geNta9uxwCYiUbwazxc4NQeMAvRWGZFtl8VXmyiq/2ECoXRknClXAqz9fVJV4UYKNcWNIUsdfixI/83HK/Bx4K0wnaLYLFq5y3Vr27Mu4U10y+Sr9lF5xHnDgBCsfTIKdjI2xkpxxyjjqN9tMsXPExGbp9fCYJgogNnn4sYSCrE5HHrFVO6te3Z+2+39VbI4uVjQtUYkSwwWiiFZUCsjGV3yhcsgiTxMKQqbJBCxfIua+QKWdVFf+lUqM+Bl+9n/qYtHKyumEBvrXt2Z2Oba8e/4a6Mj5Y24wlPFDQjoYup1qcAvghEnGiTCAAqi44EKcuIlnTsVmVZJVVfKR+uksT9dIS/dze39bV0a17RsFXCOfZGy6iDRCZAqMkJKSlBfGvgJQoVNS4Bv2UF8IjL8aaoxCo1FUxWQZ5OZVWK4dCpe10FGEpKqjis6zhTQDZdAMI7XKAdeNGUUFlVcyamMKwoBhEeciZrxcagVQ6NS9sv16rwxFMBp+2m6x6xFN43eEVHQIet5Uw6AUVD1y5uelUvbqVmHlmQGgTauuSdOoegXDzCH1ZJaS4KLrlwh06l7dT6Xy/wB2Gg3eqsBEa/tioEJw/wCwDSBQKhBXz5T6da9up9LP/sjoPu2CKjAKwDjGWfUqv2ETOFwUbQ+ZPnD0VYUYEiyicN7HbWvbrJSD5w3818iogSjIRUsSnIRw8Zfg1r8cMcKBMcXiojiPBVmCJKeJbFcJogqNcpKrFRxwsirjsrXtfUpv9vQqJ1MvFl4isMxuLshFyPTkE65BclyKeSeSjIrwV8cSjRFfjxCjBGKzI/RrWvbqVaGykUUCgdJI08liY8MesB9YNscLkEZBRPk+FGafUrKH0a1r27MsNk6FFRKdSBWNUyA0GgOpVk7lEXlfFNcpQMJCQZjHQHS/0n92la9uz9iGmDoUdISVceRAQQGyKfYUDGQ+OUE4lGOy6Pi3HPP8coY6hQvi8bP2UXx4ScPs8vTXwigN3JGxSvC/IX5AKjZFRsXhxs9ROpfEvjXBcNt8eVUJMgU+uJQgEBvKy8uFEbMzIvVP5ql+Uq8xlDJgqLXKGsVIJkyZNtKyY8MmMk69Vj085RQGxtZLMyjQBXbm34+DXECuIFkImU6KSrceeNZj5AUJPGOsen+0p8xKCqrMzXFgB5Gj7HU5eMrnfbi48YQ9FbJofkPOqIhE1xmKcLHihHighoOnbULIGsxlTA8qoCMQVFNoU6dOpSV9nyTlFrq7EJL9nm8rMTwoIKJUvOo6uZX/ALFVYjpFA6FFclyRmsrL4LDr8DzkCDLKs440Y+ccAKBTqElE9eRZWkGyChF9IuuSdEqUlzKvyOKxgZzoDRrP1CXj9lNwYqiXiJUVEqBQKfzqEdbOXxU/uItXm400JxKMgsjIeUfqkFWmXoE6MlNZeWK1SsQKs/TVZ5gXjkRe4xVagVFRUCnXqBI6jYFfg/XPHlFASCq5Gz7jAIeTXYAuSJRkpzZTuEVyMlbDjdRWGqaNlZ+mdbZdJaRk8v6iFEqMkJoWIFRKdDfYPqlAFW0BQ+6HjWJcgsDJOszIFVOLCczCKzapfPSJxjcCMqsmKupeePSLB/5uOpYFCupnTJ1yKjNQCdCSdVl9Btt0zLQqx4imRUfCJRPl1k/7GVXX4lcykZTnUHjkxIUGlXZ/iw/s/oq+oW1eYl1D1h6GXmBLAquQQ3W/bLlxLuFXqEXX9eWw+CLtJQ4qn5HHBV8VZ/jw/sRR9Mzj+QFFB+OgdoajX//aAAgBAgABBQLuym/hWUv4WX8Kf4WXbFDrS6g6IRQ0HUn1n3g6nQbDvn1h0gjo/Sl1n1foApteS5bz2B2sm6Tp9T146Hc+hHUPVCkgdDsB2PuZN2jaHc+5kydck+h67di6dFDsAND2YR6nFcdT1z20usFLtj15dseo2sjqAm7I9Vk2jJkCnXFNsZMiOlLtAdjay6Uu7PSl2baA7j0pdqyidpRCZMmTbZdi6fV95CboHtgdx6R7YdeXatvPfjsD2w68umdx6Z6BPcg9MlE9ERR646cj0RodgC4LguCI7E9GI1lshsPQHRPRGp0jpHbLfHYdP//aAAgBAwABBQL/AIENx78bj/KhNo3UHbBHrDqneykEEdJbRvj1I+pCbaNCF6aBFEbAjuj1IepR2AbiFHQxTdEdSPqiNAm3PoYoS14rim7IaHSO10+99DtHXlpHay46A9yVBGOg2Min0bVtjo9kChLQbm3OnTLjqOu/Y8FxQR7B9B1h2XJPrEdcbD2UOsSo6ns49U6V6ns49F9jJlDQolP2UdTvOjrmVzTrknTJk6fY6dA9KHaEbH1j0od2OlDsQF4T6Ebh0odq6I3Ap1yXJPtj2DJkyZMm7EdoykOwj1widXTohHrx6zI6BMjpyPegIIjQdrHpgI6P28R0wjqO1iOqdR2gCA1bcZKO0721PTiOiTpDYZMjYuZXNAvsPVHROtaOtmwHoHojonWOk3XlS9dkN53f/9oACAECAgY/Ais//9oACAEDAgY/Ais//9oACAEBAQY/AuEEFNgslz4YB6k5iZAJ5nFAZDzQfxReQxTfUF62P9WeaHkdNUx/yuX6dU1Ca6RzCdmF6wTBSUZJ7eSimpDBNitAgv1NCk4pxE+oTFRUET8x6r0Kh4LI5JxAiCz0QheED52sgmxxsbKfAQFrghzW4eCh/W/y5JxEZrpKjELd9wdPiFvol9QCG6LJ6RNP8013BFjOYtqTYiK1thJQs9F/sTAI0pkaV/rV6rxWqp0RCNGiy+0o0VQJknEcP4N4bIQX7onWCFS0ROfotFlT6p7ORQqmYsoTXqEMs152AYTTI5p8FCNFSarD9OhTr0nMJrshEVcDWsnM0xsJ5lAaN/K3nHBUtNbRNNkmR8rOahLELa0NUMRU7qiWYN6IdRkiMlGyPhY/yFr5p1VyTfpltHgicbXRKOagnUkWgw3OhQctpVPyvHOElWV1T8rXtlY1Us1GRgqu2fdSvx04Y6CZUMgeA8kUW5heqG4PSqtsXgi+KfGuNV4UGmjktU/F7YLaY5FDu0Q7gVbzqG0IZhbu2I/VR/CYws1UA6iCEw+aadlNRg7+SGQpvRVYdEFK2dvoVAo10BxiF1DmodNWBTV0NViD+xXt2nMKEU1RIUG5k2O7aLbPVCiionA/4vj2qv8Ako0+a58BZNgowUeB8VLgaoL2pxRJVEmC2dsTn/lGr6aTemo+Co7mYRbARs5oWSUaF9VC6O6CfkouE2NzXVomxzW2gTnUtl7SEKKvplyW4z0XkVpwdMChHamcVVH2hltqERMLd24HJAHh9wU7G+8oDFQEb6ExJbT09ylA1BlWRxMQnoG3UKKAGFpqqMAv/kIZrqqLL3j91CoFA9xUdsfQHR7h8L/dUoBAXEuGmnCZT0wUGIyKOzpf3VLKys04lkKBhewTmaK3YX7cFdVPuZqfFf7GZvIVLqLqFg7YxvhxCgYT+BOl+3Buxw+C7l/TVhVwNhT8FX/6uim/FVX2sCy2Hpr+02005Rtgsxn8F3Od1uq+Vj97tippOvY3JdJqHmmd1NQKkohPTBZqXC913edy4LgTsc8UlJS4YWm67mtx+y20jU8/gjdcxcbjO56aCV1BrOpMU3Ebmirw4mvttUQcE9MaU+I4jcv9seKE8PgHHjf1U5hNlw/kq/5F0d56cM10v26fM817z4qNXkm7g264KFT/AANY8eBz7RdBhuNUgt1XtClZStgpeo+S/JRLHUIF4L0vx3RyNvqUwELnRQxhTyQpErKltojVLksyZ1JituwEJpX5oOKNJwsa6/HTL6lyFo7FB6R/YdclDgf4AtitcU1ztp/sMtNU6r+Sddw6MPhSU+N1tp9/ojVVEkxNhqzJso7Y51ftcNcV7Pc3TzTd2ljmFCsKBsamVK9TZDj20/2VeWqPmV4myoYgkWVJ+PUJjcVbFEWAbja/DonKgqgZ2VDWyuPuYpijVn8G6qPhcE5wpGq/J3C5wewNiF1CGaAH1jzCYr8jxCeqWk1OpdL0+aaqR9tWd+LNo8bNeF7Ng9nbnzWialRTGSoq+0rXBDNC00HGR1TGYnbG8hNHdN4oZcEOA/c/Vztq3Lp81X+XKL5LoNTKCHBU0/q58Gtz/9oACAEBAwE/ISGjGxkA4fEyBY8zt4MaiYd/eoYlpd3nP9x2HmADv5iZXlxD0Tz8e+CW09sHfsfzDLm7OeweorXiV8m/3h7ebj2Bj24nkjt+5HBvZ+lYzKGS6f8AGbt/F2P8Mr2qwzc9npEcyVjwf8+41tlWhkTs7xLL2t1zZEBs8254i2rrNng8ysDuO0CVK0ZOoVjlvnll2y93iIMFJY3sZfXiJu3/ADsRDsbvqOfbmWZeINZUSmCO75YLi8fV7/MLVQblSmi/2l4VioAH2W+SFwlBuf44nuBQvI95eEbf58k7nJt67RBTzyD/AJubBL/a7f1MqVXw/s8wA1yV54x4zN1TUbCcMS5eC/8AMwpmHGZUqVpu6tYgIK4eF9ptBfmXunZllQ8/tHZG8SuSzJS/ibBqh8nef5nmUK/XioJ0YaRtn2x4p7n+UxBtGBgpD0v/AAiCwVWDlxygFh8QHSgO5Gzomz/cQRtYP3m0uH43Izdl6D3JXKBXfMyKwrTHO8JYdu6+GICbTdek36djC5MutKgqxD4krEWl7ht34nrmFvO65bebLPEKvzb+8yTh3f13ZkrZKm+FlTXN3AMWAjbneb2s47NdoCWeT4lGu2PhgY+weOxlgrHZC4crr3Dwdh8ytptVfxf7QICA4OztLu8B5OzAbn9n+BDJfKW9J1JzeIhrk5JkqDF9W8IS/l/aYlhTecpvT0BuThKVjwP7hutrvia/3L+o7+qouTe6H3LNmeT1GUFGD9LgFtjb+WZ5N/mIpvJi+xyj9iKm78vzMfE/VxLiuX/GXK7NyYl557f6iDeFze18Pi4gTG/uDiKz4VQ2eDzFNbx36TUrSo5m6Ygxsm8VzzBzt4mFexvEv80R5HmO7eKN9CjcGxCmy7y84ucp4/oiNw1t43cuMe48OI+pu/SZQ9pXQ2wI405csW33uMKpthi2el9+0Fb8CF59S9B3bdnz4JdMk+FP7jmTSxm3jyWRHvY5vpNSpWlRioupcwGZUfOT58ylmFL/AM2grbf6CJp4D93mIAGLP+/MyLG6LQ2UH0yym2HA8/6hvF1o7EyV5/iZhz4jlO8Vdg/eNi7PsiF1u/keyQMSHv8AjvMRd/uVKyMm1dyVAHJNs7yr4P1HSalSpUqIgW5wUJgZv6DyBsO8rkNhgPa7TMcZ333nPKx3cXFVl32h+FuEuylezs8zn9D/AHHeLyKcZJYnD7PeWmIv7fEG6Dnb3MBsZB5m1rz+pBaWHL/EIPH2PMoneHsvMN+IhTtdsNXcrrvx90wqBN6+uk1CVKlT2VTCcFsti+w4hVndQ5m7xAAPnxHU8bw0xmB7gsh6jpVlxLwKHu9J4iMaVPlPM5Kn2LmV4RV5ExElD499/FjifrLcJ4ghNot3V4m8fCpTbef7SgjzYIF5j8FDNMXo2EHSagSpUqBh9RanaK2s+ZULhUHqCe6uZyQ9ocl04JwD1cOKEc5ibHF5CZGS/qIBTJbj3JWM/MwvlHmYu/Y7PSdoka6YFj55CHNdn/RL8QfphX5C/wAxzYgexa5NviDGQ8sQwT0G0EFEMuwLde9Qges9JrBKlSoAXziEZfPgi4w8eEcusLHqXC7uzDcTAv6gE/8APE/5ZfzNgf4+5Uihm/qCepupHEhbxE933BVCo+XcQphUc7H1iCEtjDvBe5/OJXr3wfy/ggcYg7NH9x/BBKlSpxVbe7MRZN+4CO+HaI5YHgmcb7vXE3Tet5jnNskxdniyYdU4U2iPpguUrqQ4f2uEE+kEYzCMuj95fxPHonGVOvbMRF2uksnHcVt4/uGKU7vXx0ECVKj99neAXh6p45V9xGO4wwXDabYczFS3O8se3qK/YuKvmZQlqg29iDEn+DUwk8zb4n2wmLRWJm8sBsN8zs3gYXf7hALsB+8+XEI+wx6+OgIGlTCvNFqa3AzKDe20JgP5qEPfmL9IUkITFiOEFO4lkuQLyTcn2TxoCUXfQYNMyxpxDZf6guLtxzUDAfq39UtlA7cR2ijYIYTFg9zP634XHQIaArRvB5btKGF99DBcKYqpVoAyiS6J4jfSmpQ6SgEkKTt4lrylhtl+t46hMKxbZ28S0WcMGxUrq9pm9FD2DE2+dz+MIVzZELnzcfEVPljQcqnOgsLjzTcShCmAraAIts4hpfapnhLEKLt4WmXysJR65NZ6jUrykYuANQqMYbrf6ggBtCkG8GG0CFTDGm0WZ4QJum23mCblhDKVBeG3aDsLP2/EairozZKA8caVT28TdCr0K6H/AKm+ckEE4TE0FQ7zwhsRt8mPeKrbu7/nHSs9lQY024m9frNobRmJlSxnzEUraLQcGLx9XyaN02JiHaP/ABcGvy1rZ3lpOPUK5lMsdHVkxFfaNYTPX0b8RWbKnISqs3U+4Wsy4L3Ig5VUzSeB1+PoOr2T0mDotU9oOL7y+Ybw8yo0HzHPevURPYKDeZVC1ZGT5mwD8hKW1OM/ygGR8JarX4gbj5iVWXll46IlZaDWEobv6gNxIzgxB3SUNpt3Rv0kXptjnsGvFUzCVRvDKnn/AG7ShjQHUPySugdpOzoTwCUNql7hHjRu5DaJTDrp7fpYOm2fEjDRslLL5VTPEwALvEU1FvtUuZi8EFrMO6KaYhB1Ai+rtohYabZbB0Ju0urrc6MGUvh3hY3hHxFFee3giLDaDSjaFsyTbhzBNI9wxN7PrHcvMrq1ezxONjLOtyOZJbHaHOCj867tL0fIamCXFprzOZ8Q+6E44OkvoqM9RlRIBulFtn75/cAjnc9awhL1AtwwgspnDomhLQ7oiglosd4wGDcailN0IGhcuGlswgBA7swnKlq7g4gWnVZBycw0poS5iqAu0BAwnZo6n3gI2flTLdC6bZ5/yZyS2VW0zpnR2jI5UfIvASpKvan7kTKt9LlZsvoQM0jFc/6R5ZW7Nwxd+KiACbfxx/U3Rl465Bo6bJ2vWnzpb5+qYj8XfxMJzfcqZj40BFi+pWBbs8cxe94b49HghHnMGKg7WG36ipvBjh3Y4LFon+Fk7xMjPSOgtumJN4kqVKho6pWf44iEVzDMB/wlDiIW7aCbaDS4iAJWhuyi2Hxzuw9aH3ANkv21EVxJR3B3YwrlNuspvY7wFsGbe8PGYcTAndDLoIkrU6dvU/rNwhUxNO/6QUCJdQLMNFqNYG8Xhu/+JQh/3mMOezMFsPKzZ7dnx5lQcPEd4c+I86AoDjeeNBBh089FabAzVqGBvzRaSGG0z7QqOKML+NGrdey7O6PkyuVYLvZPoSwCXk1nRvbghggpWJj7ENLeVErPEIaEI79ToJRwT2pzzBm9iFk8ws2PmciRm76jk3O8u2incptx7RDLxSbDGvmFWe4DA5DxRSDzEpenbvOaVQdmAL/jzoQYujuyileGYwL5sxA/rOJsS/MDlSZM8Hn/AFH6OTmUCtpRoEcJcHGn5Ys3xCd/aOzu/iWS2V3OWUXj/pDrKLdfqycpmEg4D7qX2tpf/sSJSPFzBN8yCeJljk4Ya3JDTdDuwytT9yZsinzAiTlz25gquwbD+kICbg44nJQKYmAgV5iPylCnjP8AEW8PMbKLZZkJ7P8AjfMtpE2yge9mNsVEvrksojJKIBvC5na1YDjniLEIac6cze94JAjsSHE9IKZ3gKeIUZdu04nHaHG/4hdWJkt9hF4mkDOQSfGGbK+A2lEFbzt/wiBuu3aJToFeyCkqlezzMRQBuXvK1Ju9/wApTi9p2/o+ICVcy1q8+P7m2v8AoIfSY4feUJevnXml4lE3rt/xKst2ZsGGeOIOCGlEGwcBxLXwmBZzmWH9pX3lAAoTame8tLuhrxL5b2S1t1F8OLhUGQX7RZuRnREbpgn3dgbMFONKHklWLCbH6P7iWIKn3KcwBUu5hDXM2vcysfae22cpduErWIeNpy+s1vLevifXxMevM+ziYb8/3ZmTW02M75VcbzMwThwfrJP+Du6ubgt9mH9yvj876I20b89UEKzcTiw3gusT+rNxDbSkdP/aAAgBAgMBPyHpJX/nE6jqP/enUH/oWK+o/wDBf5nrH/gZcuX+Ni/IfgvpF0PwOgz+RQ6lix6jiHpYdQ/IwcaDoWLKJdxmRDBF0jqWPyOg6Fi6jUWKbZcJuXHrf5GGgixhdK6L0WaqXBQEuXL0uX+cZ0epAIwzWosV6CWloSo6j+QjqepKlumh/CErRij+WMyiX1AplGp6RS8CcxYxj+QYlxi+oOi9HUkhpqEejH8hofw3L0qBL11Bo6MfxBoMWj+RNTUtWP4GDUosI/kfQR6GP5hH8VQZm7Uh0sfz3rNSXDqHUx/8V1qVMRUuDqGg9JjK/NI9dwJTRWgimVYwuVpUPz8OkIlakuXLly5fRVK01oMfi39LrcXoOm5cGD0v/gyOj+KtG3VJofwnq3j1nUTDqBMv4fGOtfwXL1Lgw/CFSpXUTpfxBcqopL6I6R+I/ldFrStK0GPpfxD8x0kqBgBt+cmq6H4r0qMIQYup/Fvi6EPxmjDQYMXU/hfQS/xDqEuD+FUrWuOh1hGPU9BLgyzofwF2pL6Aud3QuvErrvQi6XpdB6wuDQxIGJUvh3SkRKI9NwYfhUX8Zs0NbqLidQx46Hqv4Nmu3SnMalaxHo3x/If/2gAIAQMDAT8h/wDWS4PU/wDuv/40f/KfzkOp/wDAIxX5B138wTmHWGJzH8T6nqq4M9QQih1DMWOkR1vQj6nrM0rHUIYEslWm8NMyZg/HDPU/gK1DQNLm8CpyTdKvUVCVK6T1PXO2iwQgNa1XOY0LubxMXGkqVpUqHU9W7R0aDoVhIdbmIVL0XFKJRGXB1vUsvE2Qg6URi0lkrpvRg6EDressQGV1VyXhpJWitFJTRxA0Ot6mUSyJ1KlSJoaLGWS2hOgdb1MENtDWuu5dyoxhMI+g63oWMEOh1PUoaMYw1IdTqddkCMPwOrDAlRNB0EOp6hjRh01q6XMWu4o9J1vVt0YfgdVRaMX5Xq26uppcYGLCmMsinRaB1r6Xq26jrUqNJ5IrUbxvFwkm9Ljp3fi2avVerK0qVKlSuivReiz0PVs6Hpeh6alRidW/ofx0hov4QjoUO34IavU/zPSRxMuqGYfwy89T+GtBr2HrDLly5fSRdK6X1kO83laVrHpPxLHS/gIEGjcGD3haXw/nfQx/AQhaDOh3LqMlXf8AONQfxh0QrUxiRP8AwPGrK6KlStTx0nRIxP8AwTF0ZWoSpWqyoNajGMqJ0n4U0emoakGj0mMTRIn5CjVitQ07MyNCMJsh0VEjoYPxHSOlR1GLEu9N9F2tIXXlRj+EwOh6FFlxZ0XHDN/RQwdWVEj+NPx7XicZmxW0PSX3dOzV1emaf//aAAwDAQACEQMRAAAQZt3QeMtjCoAfFfGN6/PprXY+6fzPMOm0IezeBNpZT16jgvQiuTsKk/gxN7LUAAmDN66FGLkjYikDWH+VTeimZT3xjk3qlAht7G2DdlPJ3fVUkZdCynTgAKLtTopTI88iKSix+R0xAZy3iSKuDkbBhK8QxaJXUHYutw/cCpVxtds8qUp/oXHMfLglseV0SBo36NyqfQks8GMq2YEIVJfYAhQEBmmAxhW5YTRCqu8/W2bmB4msu7tIj8MsrT6Du0UZwxEEcoXl78oJmCMDyDGuYomdnnX2MVr3N34w5V6nCQd2Y4Qkzl4xVCXmJxZ/noxUsSRC3fVoXIxLKZcOzsYG0bwAFtC5HpdZtFF12LYSU69FoHO1vhNMhRP0lGB1SNRR7NopFtuddsg02yhQSCWy4jZkM3Xf+419OEMZu7kY2VEDqFTZUe33FMkOOeUQ5mzRXdqgchiOepUJeoHNDB/GKh3TYMlxvhRcXdIpvqQoh8w3W5TK2q2TdsBWAHCLH+DKFVWL+2vtGaVY9xJOq2HseHrbZZwZNDUvN+fQOaTshD/pfBh1v3b+hy8CIE25jd7eyXHvYIQjSuVxlTd79ryyxbHuUBBBnyxB3R/EwCbkEzLsxxV/rTKdlIG+OdLjY531NNgbuu79U09j/wCZcl4PjwoEHFZi615UMaoEmx/BW5NdLl//2gAIAQEDAT8QGi48d4hAOdmoVgKVHNuGGrNwfs7MfLRHGWpZXKs7B+04xVvpcM94E00blaVOVczcITdXQ+O7Lywa1bhWKP3ibaOsr+l/I34hFBOAic+g3XMbm45BVdD0jrhdxhYr75QS5CPd7+cwBsm7BSzDw94UJ2j4P/SVDMKm6St9MyouHBhqqo/55lxQQYFA1jOFMMfdGo4fcvLZ4YM3ICs8JziMnt7kEvBPqZ/CQO00sOEIwi2Ctj3vyTMg0cbRvGZEBa8aAoQRgS6tEIacE3tGNhL4mZUm/Xw8xbaQYyXDF68T5e3EdXA7GQGB/mE8UYuTufdYjoBulvhvEyjCYNi2gxywTk9tFLjODj3KDJdW6lHtXdipmYjtvP22lwVJV+9321Dy52vAUq/1i6mB45bOH6l7AQ96Lz7q2BDdxM8T5eDEyS0LwDs2ZbAdhWeNsbnDvAgaEt1hTlnHuYX1u9NgV5K9o1R40fNLve8eegjY+f0DHy0soBi2pjC0DvWjgHB6uNy4anNbRdCEFzAhn38wkEAgwnCf5+oGjEsmwYjfKXv1u+kMyB4NjK6+wBu/MHDIN5AwSuIxTZIB3Gq/WBRbNhmq2MQ2jnBrNEqEghGVS/rjMEw7G7lantsQpHkT2bD4mag5PllvC474C9/BtBBZSxznIlthKKdxH9p+lbjkr5qArwYCixXdvbZiYx4ClUWI8965ju25gpuWDL8KqxWx2QrqF5tVSGJ7B3OQfW0fJHzEUz6neOCGDcHhvz3hTjfgqmysUMSTcTBYGcHFRXAqRa1qQm1OEualQWMPNjV9ipRgZXyLteYirmu1le4+QsN3YWrgE8KeLbx7Ym5urm2P7REXArbiqiB8pOxuz4ju7mWt1Sp/m0dYyOOD+x37QXbVQrsY5jiyqlvbj7hEWmTdrrA+JdDs5EDB/uK3SNvahTaWsLwPfKoiLAEvf+CpQjC2DhnufURdVd3Y5T7JlYAomxYx8nEXwFHBvT7hQhLm5sFpDdAQGcuXH1WISXcHIStI+F/WPSD5OVxR3eGZYCAVA3ODccqUM5sGpBjyTjpqVEgvIFV+oh26TNmB3YLClPcWu6WG1Y+wYqKWcd8N8n8xAkKFvFEwKps1HfxP0Rh0e/P/ABgkFBsY7Dxh8sKwbeDLwERUulGybCu0Q6RSNzXCM2HdXJUBd15V7mbPcqgckyVwKfEb7d8jc5GL7gBPfsfvCXE1u3VOPLMLKEfO7dLy4DPZXHwZSKFBvCJ29kb3AtLULzl4yxKjl0fgHPk7x1yxer5m3w4fhYhCBAJUijFgtOGDFQDNOfWpCbiPbQRWjCawt3hfWWn9ELW52DjEXCbBVMS4Dy8Lrf8AqoRvzmxR/hiW4eZBjHYeYF87jJ3b+YYolBsd3syqGZ4b7/xLlMFwLbvuwh2yVTKVz5OZeFLMOVs+mIgGecwh+sqV45ZimUfdZlC1g0GULZFUg7PGjKsPA0HBcqYLZ+ztd95cikKGxQfvMl1rsKhZXxCddhmotlfcOwy3SP4HeNQ7SiiOB2EsJeBgdhEOPgJNpMZjRLrXwmLuGbBiDs3niZ1JvI8kvQYT4l490KEy7wpiwVWVOPuULy7Kz/UKeVAUDtBlBWz3vcCJdG61gHPllbu3a4N3usEcB+6wLDSu9pzKB0cXB/hjm7J72NGuyXNWzhtRmvggNG+v8+4QLYJzwMcCeEkmztRXPeKd3YX7Sjytg72wDlwK2gq3FPLgTYUCg4psmUQxT2vkQYbW+ONq7HiDrT3LQYeRlcFXxYnwXwXLHFZbC1oNjKfUbdt3v5sj5qIVd+tSboskuC2lnIhuLCcjW8IpEK8qbB/MrLi8KN0u7GUpkCYo4iRS2bTa+1wQVpS1bVJdWVX4HaAgC9uLX0cy4hjlsL59wzFDLuvhPNw7unPy2F7PmUKVmU2U+l7xmsNPO4U8JTcQAQ4wH9IlCSDukf1ufOVXaCTubq2PacOgQvdtExWITnJTf1CMPwpVuMPf3H2Cs2XPI3N6jJQeLZW6pfZgg6UmLQvIyRBinQrtF+uSKxgBWIN6cYnmGKUJXaLYI6k4RbS4H/Z36cWW04DpN4MS7BlXKyhaTttnvCjO5xlx7gUd0JelH+IGTKCrZmwhKGKXDhifSpxtmA3MM5LuKEfDt9EtKAXQB7+biwIsOKG7OVTAg1W4zCnl6lskWXcQSsBqAphrCdlIeU2+4c36Eu15U5DZwiRNpV8Ht/MojeJgrcp+4uRdVYObu6dz1G6BZMCFcZzUy1VNAb80wRSx4FdsYx2JTOJNtjOwcwNZZnAxSk4vvGqtEuLW3R0NC2lwCZhGzab8wa65TO6kVWwwXBZgRX1FVRqDa8N+cw4n+y7y0IUzxWVxS8r/AAeIRQFwvmCCWO7A/UNilpfZgxFEpzw/1Fyodlke4/3GrDczhJ+zOKM4nzg3gaztR2OwHf3hGJN3G8Pdcl+pQ5jC7jZfUmyQQTsKr87GNC7Zr9OUThdFQhBVFu+NT3u4hSot0bcUd79RHAW79g3z2g0Gt4mO7a7e45qzqyeyHLKA4UoR5SMdDQ9pcYYaDFg6F+rEuMj5Dn4igoNFtbd+CIPYI4Dt9R1XYvbpxArKPPuJlq49o+Vxfk9sSztbzSKB4y/LwlWuPvZAPYGTPHmHwtfdCTZ7pa7XxBQNxRn53jAwbqKn1Mexdre3mCIHz2lxqz33gpKmBBr7jYrDcSH6hn7L7Vna1qLSB4y5qztzLI5Qvrf7YY4NcFYLHuFmOpCcdQQaDD5Ijl4agPA+oskt1XIjLn9IOMk4Nh8eZQRdgaxTh65liK0B8jeOWCg2TvDafRH7hFsGaI9sDXzAExu1/UXcbWq7h7KuqgqsA20p3LHwkqhvk94BULvMtXl27StoxwQQKxbh/wBRUxXw/eCLpRv5Y42l5xEgrOcQd3WPgog1NEEtF3qFscABFhAGF5UM4TIZz/uO8ZehDS/z9Q4mCdkpLqEDCVQu3TYfEQ4OpyAwU5gxVTH3hlRv5BT2ZUyQFFiS6u92OWv2uogqQpbbHIuVSQUsKbWuFrL9SoEiy0cYIpFwmwTHcfUUojSMr9uzHrteG74iUvOzcAWPuVWrV8XGC1eVaqccYFL+pyUea58hCyUti9n7w7wku5uhjl0VZdX/ADC0ShcZU7xW33ix1IR6tggRhhkcLvXEu2Ih/wAsYfdB5e05I6C7g5lrFKvK6y/cuSmrXceBvzFIg3GsCk2OI75ys/DL4KVgPmq2vxAbS+Qfu7mR4B6h7xgVhi9oAwXXG+YFQa1tXrlmfDUkVDfGyyXFwoq1ZXD3N46BSrAC++Dcq+cS3XznP3E+ntV/JTzzL7la7WsfoRE+xzd3ljvHaMdSDpXpBKggLWAI4zks4EYlXqh5lVGwQkXlXd4thEgLCtsECsvqEN7bB5htEzKPveOWy2LqAe4qhiNqcxQNFzNpRA5XB+kIsJ8D0m0cusiBcsZA7SjUyIBxZ28IRRdbLgUeOSClsWq9oe6OWy6L8EyeB7HljGMYy4MIttJQIQp2+eJjk4OxDQayl2iHZ8QUXNG0JQGcJEtcXxAxnfmVgdohSFm+03tgjqyHfO3iLCgshsQE8RG0c294iZg405Z3YaYYiXecNXAkp+IGDfeLmUbUbVLjDA+J+9wAR7ArLj+uhYxjLii2000Twgy+4mw4JUiDsS1MfDPs+0pjGFy0CYit6+4DeKOSFEO8zXuzaxiIxdLzc4TbtAbrfiW9GLhduYhrgdy/1hcnIp7xAhhzcLAteYAswSoFbZR8xlrw+0YAds/ztGcRjGOjosx7S5r7cRJhMHDWWCDyyjMMK37yyK4NLxMAFW5VgFvGf2mO9Soc53NpkuavNRxz/SI3fLBYJDT33nnDB7gDuKNoTW2MRvWq/wBJkis7ylXvDx7iHl8/EQJaKnu6sdox0YQi2lyRdG5CruK/QmLOCO+BFv4gIS5vDwxyyieIlNlXkfUDjl4JdKbu7fM2VeiOAUx6HMCS2Y+SGl4p3JQt3KhVcC9zvC9uE9slS0ea2jUayftGtJV8e5nfgzZeXR0Y7RjqQj2lxUSM3oLukgQAjtCyGOXkhcxXYfM2o7CqrO8SwsnBxBjf4nEXzMBXiZTEJfeJQDhfALMp2amXKdlevKrg4ARn3E2LF7TieC4RQR0TS0Yi0FYPZCHDAe1kTcoz/IRjoxja0FsarvUyNfpqo8kuBjGbsW1s7ME43luzdfzB3+7OYZWqnd4ivA9m8objx2glQMDy+pkCCZrKjbMEhydgP9xirl8vqDG0IqGRpT+sWWLulPpmHC5ED3oQevMRb7gpiHsINbq4J/E8FypmVb1sWmI1U2UMj8RwAHbDEEGm5aD/AHgkpCW5hatPmHrWXqqLzGDDeLCXFDVwxizfOZWJnn4qCqqNF9otwlz5cLLGHJf+MVPfz4m/JUYXDks/n1FwHCMhXCf1qGDdz9WcGDYh5mWt/TeJ7v6Q7n6MA3F9Qd/cZfuKhnce2NC4MIOGuYGopkqPxA6FPJGLE9QeMJsgtJkMR2h3hNiXlLDAgkBaGYP9CHBBhhIS3atpRO/MeD5jq2q8o8wM1sI5uWGLuey/xEF2HeOFG2xMCq8QeRd8s+JAtuAMMD7lPicJL9ysI2dv4jFjzL+Il1dwnMreGyEAzXfDDSnZSGjY0GEHMzJkNqW+6NQCvMV4ljcm94eJyvYQm2Y38+Iptvu7M2inB5+PbzADsHEFUGrlOavtKvfbtBoCgi2MwNwamTaOxifiz90WXvpnu9MOUXs4gNUuk3Ph2+J6aj2e5Dfy1ffsy0BmSxm2dG8/E8SKEJsS8oI4YTipjjCq95Jb4xtzmJzxHeP1lj9jOXDlMvSXRTi+D+YxQNv18wM3vxEQWBiUJ64iJtEa7d42xLEBWaqCGFcGu87ikAf9iBAO3H57PMUWhSOR/U4sUlaJFwxaWzCpdtkduTlDLN1KbES5zQYoxSwnoaYar3IJtxL/ABLxRK/WEGoKOVaJYeEt7vLDN8XtOb6lgqpZfHLBi5RwZjd2O0TS3G1y7Lja5jaXtEC6sdklgML2gQLPiNVcGGS2Y5FdyB2hx64l2kdEK2xEuOLyudhOwgnEphUNoCowiuz9hUed1PEjUYCSi7ZN5c4fictYOY5uUybg7vy8S4cr8QaK7YGOxGFPJDJfPaAsX8QEwy+S47Q48nJG37AD9yGLFSsXXbU4DwQ4A8Vv7SYFbDGQvDiBmZSxKxd7wbAUBLL4iCwcuCdpswqB7vd8bpkIqNB5e0FzURxKwMpHHRzCLItbXxXObZ22n6sMqBd05CIndu/gcxWzt+hfE2AxQCuMyrW/ZBmuyVGu+WU5d5QRQu6i+wAiqNyTiN9Zgxjw8QsQ0DL+sx9ARuCxfQoftg4DWdmzfwdu8bmsCxfnHyEOHYjwGUyojZ3w0v6zJuY2Lj3Bk7xoSl6Az7lktGNIzaQKb3uiGZ2ivCTfFWLg5HlhJVdG0MqY/vMo8diBTJ7m/wAdpRVvMpyn1Md5W3h+yq2wEoQWWV3lPd3gZwgGyrlh4cNiZRyafLggakzc7spu+IMJzF227/BxKczYMtwZo5F2SoVXGINq4iyz9SfUmyKc2ipUFYhGIRIYltL7DIy4q98UFEt5ceTL8At33zv9wxBeNuf0lLYh2a/iZBDHaOzZtxAeMyhjmY4HMRd5vGAli207S7n82dr5twr/AFMwWpkMfEXiW8x4ran5I3N3lESAWai3kpWGAggD5laWwdxCvIjkBzHBRKiURTc0rRP5aNxgGIDfYWPeVFDFuzLRCF9/NAShhw8ePMdTI7hC3MHd7xox+szY3P1I+UihSZgS6i0acHMpTG79n+B3gctW6KuVfMdwsA+x/eAB2PiI5JuCcMfbKGMrm82u+ZmNs2igz4HeHhG+02Ll5AOu/b3M25gQY8RzDUOB0uCCjDjAF3/ETPN1bYOP0JcrUo34PM42Wpw4ZRAs8Db1FR2G0Ssb9okV9oZiWgMDvElLbc4ipDMVkOH+kWGvO1br/hBIHEGwXuShpkPUGN4M3HL3VPoPm8xq7DG3eGPCsIxEL28TmwrcliCIO/eI5hwk5EVbeD2gzCBUyRcwb0vCx0Lw0vxiGjON68tbkBJl5bfTBhDewYfRVncgkBoVGF/8TaLyXsG797TEkDSr/n6Qgohy7vuLY57ERRdVxGhXmKPUAeys94L2X+Ygc6m4U36vZA828ot5FYjqluaOLT4lvAdsZfcsX8Mph2KvxDIBs12BuLsALA7vMqKvbeA1S+YYzfllPM7DtUwm95bazywWdncjAFIsOa3iags2QQPErMQdxyQOANyYy3HH6EcB7wiEmBoWlZKzsBECfChw892J1nzsHdmCTKg7AeIHTl3/ANy2r6mSHK1napdVmyV2qd+Jv2YWQK0tlvgcw5Sju/6hoUu3K9su+GbBL7nMdGyCl5GCAAx2FtuEIgaMlLsPNQRlIubEN0lhK3janB+kvqcn21KnzVLW0r3nMrBZ7cTnAe02zk0e/EBpMhFETc3nDqFt7ktHd/eJuPgg4lGiqgxU2j9ROIPGYcgyU2+YR2Ot3obV9x863lvKqbQIOEZ+fMpAY7DxtGa15c19S0IeCKMIcDzHY2FEm/og5Nvrdl4FKStDsXtFc7EoSFtbSCh2xlel8St014GX9VBtqrBFfJASiQVhG35OI4VkeTY5YJleGGg7ZMfESR4owH2RkNStQN0exzB82VvV3MJABsRDKVuF/dEp5YbHwvbyyltwKQ/mbsbazM13SqElYDf2RAYl6t5l4gsXGoNvyMbIN+8VkSE8Vdd3llHTGeBXd+IFBMKENgOIaVl7DsXL3fHk8SkCnlM0e+8AH+6doIDwxxFcwtn7S5ClQN2T64IBMWVW0ML2iR9AvLMNlQwu/mIhUCdrJ42gtFodhM37HGSVxuREqD/FLO8KBQ7VKZSorHMPHlWFuoHA794r7JYHkq6l47jaeDt74lATVH17mUDO03LBFUasTMvEcJ8qlRYFUxZC/gnPPcLvjxW0/wCIN5y+LbAK39y1GXptHg/gL/aZMH5N/NzFzh/t8ze/3XxNqq3+N8Te7zQXk7u89V4qcDeZLRZeD4VfMqAc2NH6j5mCy1VMDYybrV+lSzqX2e17x+53TDPe8y3xy80vMrkqqaub94ICinDzirmbNV+k5294rtMDLz3rmbn0r+Zi8757/E8Svt8zk3vt44ldkP0mLGjNT//aAAgBAgMBPxDpzhASpvLjoRZUd4vVtKlQhsmTUq6hKx0i4Qi6GlTGm/RzrepokSUqoAcx6nHTi/ER1JWlSokIZiTeUEtX1uOgIbQI6svRhGLg41HQdHVlTbN/W46CG0Iw14i1obR1CcI00HQ6SbQiZhXR1E46LmWjqxYsYvEWJulzJUvGi9LrSoOmU3KlHUJx01RWdKyrRvKg4ipipLGLeJWhHFjWpUSpzxOk6lQysQXGpYtaSRVKnEVR0MrZLWVKlaDjouLNlHpOrbBtqBosWtK6JKjwDKSnaGxUaMr327wLoAyyLLhKjP3I/j2RZhSLEqJZLJWipUqoSaUy/aL8iWNmEiIB20UYJMIwrY9XHS7aZpsaSwgIiCxIxWgtmK3lSoS2gpuwIS3MpVoeknHSbYKUmDGXOlzKCOYFA8kSYinTiBCHEcwiRVLnQ9XHTum8iw4Tfowa0KGnRuR4MJpcuBEQg5AjBFeo9XHTU6apqFSbo9FMu6LzoSBcA3hmxOwhbiVnfOCOo9XHQSkt0VsWMdVlwegYodAI3Zc6V0RWx/CcaXEZTl00EN9THUNDpll6DLosdH8AaeWEbwNK5fN2p6HQYMYFugsuDpXGr0D0E40rRjzpuh0Y9AQIEy6UCCvyBOOhm/Q0JokdTKhKwylaPfQ0noegeg6WbtCGSVGCMqEEUt2mAzuQjJLANBGY51io9B0scvRwRjEgQjllCc20YAI6NEEVUMbaE7QUtEmWgiV56eOhm/VS4kYGrLgRYlIxTTeWlsuKdKRMRxMYn4owaiDB0EXoOlaCSkrM0tJeqXBUFkfwMOegYoJcUNDQYOjFZZ0WrOidF0OJvfw4uggzZqNCVHRcqVoxDhiljaWFdN5Gi0OrsshOkalzoanQZdC8p0QzZ0pf4hBZpMrQilQJUNDRjEVEB5TsJSV2m0oczbXUVrXSkoYkqVFrQga1A1BbKFEBZQiSmxB4ZQy3oIIn4GckZUWpdwIGlwlS4sYqIFs2jtGCoB3m1S4ZhXUPw3kSougTKVoy5cuLFiwi4YXN8UWsHQQR/CdQqihHS5cuGZuxlTfFs1h0sUtx0sGfwLiZa0C4alxZegaCMuYQYMwYQY4Ul/SNSMW1qRQ0VNoy5el+dB0rRYOshHHKObQOgMakHEuXKJYuLoq0XFlxliZ72THGg6BcYRNHJE0HRccoYas3ajosTgi0NLlwl6pXKmaZJZDDlrci3l9TyMRsx3TFosJcNArNCMd9TSslzHoWGmK4FQIKtBuOLicpu1pVpJGEuDoWdA5l6EZepaPUStKhUJW9xuY3/HxBbd+v96Ju6KdQS9amr//aAAgBAwMBPxDpZcXWs6EYRdDWtXVmMxzpX0uXnpYx6bhKm3Qwlx1dRl7jxjrc9KxOg0qBHStWXGXLgxjiXCBbKDrc9DosJehqRQJUSbajE1XQl5mbNvX56GMSEdOdA0ZYTBC2Zlomi9LN54QtW9fnpZXQQgaNbJkmBKolFpVxv1M6XpUCptmWHX56W4OYIiJqQJdCCZjvHeZmQXlcGMy9HQNMYaLinB1+ek2IamO8ylwgdAgCmDodoEMh2lq5XSMNKRZhAlRIE3nX56TjAhZHd9Al2gKl6EBmLhGWm8YK95gl+2/aKN9CSWhFaXD8F56XQmUCw5lrDCURZegUheUY4wU3gdm8A3EZCRN0sxRG5lCDXX56XQj34lhKzOeVGMPFN4iY3NBEVbko2i7hNIEexKNiIWJ2JYw6/PTRC4e8zr2m6VEdEinaKi8MH0wpYSY0zFRWPMwrBguVQ63PTsl9e2klGbIwZdxtB64RS4SU3MR9461KncRgh2g0pkhoOtz0iyJt3lC6lrc2a3BmRmcAgR2jxBghEdo7uzuCY8ymO0ENB1uemzBBDUBjUkZCDGJKigQcJEteGVNrMFaFXAqGg63MqVAJdDLGO2ohoBFU3iVo5iSuOyLM2ICO2CtD8I5go7tF1FE26hg6ELgaL0eFlzKo6gedTrHTz0E3kqbY5cISoQETQzE0AshGcEdvQaCGh0Oeg6YGEIOm0u5viQMVUsE5JWtOkhDodHPQajBTCGgY0iRLmXvNlsx41S0YulVDeghCA6nPQQwx0CEIMZUrMQTFwIDCymtAzSMruC8xzeCyneCRJpim26Gc9B0AxKqDBlxZtm8WplCKltNZTvASps0uCgtFyrpOegj1MEIQlRxxq2EWZiMtCDiUStRgxUIdDnoI8OrE0FDQWLqkqbwicqEY2zAyrFMegYsx2HQ56CZk6GJEpl4ixdGXCU0uXL0WyN5TfhjD1RxWMMbumg9LBcviLHrEK6bxNBWqY9B+Ih0jLDoZxRY0l63LhLQAWguzEe6AcRbFMpIeehily5fUS+B0WLoXUlxdRVLcu0pwRaxgYHJx+8LKUMSjoYfiz1CXF0KLpWlxlQ5nBK9otywQFZ2iLsdpdWS9Y1HLVvUP4b1ywGLeiR1NKlaFBbFi9JgVHaGoPwAfjJiEFxhh0nJFRUMCNsMrOIFS8QxNIZlXUfgC5QTZKugqBqTTVsGKjnEysSEdAwxij8gJbvBRHSMq3SoQNKxBiZJvDTMiJCMEMzQIUrjow6qlkqVHRnQEqExoMyoqHkjtNkObndMrTCLLzo21SoJg/EMzkgaiiJboEGsy6KVwDZvLpl0xMcSxlpR+4eCD3zBHmDoFxSowINGEOm1lRpcGK4ErErXGMkgrJKTAZsdCXEuLNLm/EMNAQU9B0ErodCPmFRuMtcb0weUYfIMV38xUyW9v9TO5/p8dNpITdp70b+p//9k='
				};

				cb.__call(
					"statuses_updateWithMedia",
					params,
					function (reply) {
						$window.navigator.notification.alert('Outage Reported 1', null, 'Outage Reported 2', 'Close');
					}
				);
				*/
			//}

			//function onFail(message) {
			//}
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

			$scope.showdetails = null; 
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