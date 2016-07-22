angular
.module('hsCarouselMenu', [])
.directive('hsCarouselMenu', ['$window', '$timeout', '$templateCache', function ($window, $timeout, $templateCache) {
    return {
        restrict: 'A',
        replace: false,
        scope: {
            menu: '='
        },
        link: function (scope, element, attrs) {

            $timeout(function () {
                var pathname = document.location.pathname;
                var menu = scope.menu;

                var menuItemIndex = 0;
                var isMatched = false;
                angular.forEach(menu, function (value, key) {
                    if (value.link.toLowerCase().split(/[?#]/)[0] === pathname.toLowerCase()) {
                        var activeMenuItem = element[0].querySelectorAll(".menu-item")[menuItemIndex];
                        angular.element(activeMenuItem).addClass('active');
                        isMatched = true;
                    }

                    if (!isMatched) {
                        menuItemIndex++;
                    }
                });

                var totalItems = scope.menu.length;
                var windowWidth = $window.innerWidth;
                var bufferWidth = 100;
                var menuItemWidth = element[0].querySelector(".menu-item").offsetWidth;
                var arrowWidth = element[0].querySelector(".nav-right-arrow").offsetWidth;
                var totalMenuItemsWidth = totalItems * menuItemWidth;
                var menuWrapperWidth = (2 * arrowWidth) + totalMenuItemsWidth;

                var navLeftArrow = element[0].querySelector('.nav-left-arrow');
                var navRightArrow = element[0].querySelector('.nav-right-arrow');
                var menuWrapper = element[0].querySelector(".menu-wrapper");
                var menuItems = element[0].querySelector(".menu-items");
                var menuItemsWrapper = element[0].querySelector(".menu-items-wrapper");

                menuItems.style.width = totalMenuItemsWidth + "px";

                scope.setActive = function (index) {
                    var currentActiveMenuItem = element[0].querySelector(".menu-item.active");
                    if (currentActiveMenuItem) {
                        angular.element(currentActiveMenuItem).removeClass('active');
                    }

                    var activeMenuItem = element[0].querySelectorAll(".menu-item")[index];
                    angular.element(activeMenuItem).addClass('active');
                    //var currentMenuItemsMargin = menuItems.style.marginLeft;
                    if (sessionStorage.currentMenuItemsMargin) {
                        sessionStorage.currentMenuItemsMargin = sessionStorage.currentMenuItemsMargin;
                    } else {
                        sessionStorage.currentMenuItemsMargin = (menuItems.style.marginLeft)? menuItems.style.marginLeft : 0;
                    }
                }

                var clickCount = 0;
                if ((menuWrapperWidth + menuItemWidth) >= windowWidth) {                    
                    var menuItemsMarginLeft = (sessionStorage.currentMenuItemsMargin) ? parseInt(sessionStorage.currentMenuItemsMargin) : 0;
                    
                    var menuWrapperWidth = Math.floor((windowWidth - (2 * arrowWidth) - menuItemWidth) / menuItemWidth) * menuItemWidth
                    menuItemsWrapper.style.width = menuWrapperWidth + "px";
                    menuWrapper.style.width = menuWrapperWidth + (2 * arrowWidth) + "px";

                    menuItems.style.marginLeft = menuItemsMarginLeft + "px";
                    maxClickCount = (totalMenuItemsWidth - menuWrapperWidth) / menuItemWidth;
                    clickCount = Math.abs(menuItemsMarginLeft / menuItemWidth);
                    if (maxClickCount - clickCount) {
                        angular.element(navRightArrow).addClass('active');

                        if (clickCount) {
                            angular.element(navLeftArrow).addClass('active');
                        }
                    } else {
                        angular.element(navLeftArrow).addClass('active');
                    }

                    function increaseMargin() {
                        if (clickCount < maxClickCount) {
                            menuItemsMarginLeft -= menuItemWidth;


                            sessionStorage.currentMenuItemsMargin = menuItemsMarginLeft;

                            menuItems.style.marginLeft = menuItemsMarginLeft + "px";
                            angular.element(navLeftArrow).addClass('active');
                            clickCount++;

                            if (clickCount === maxClickCount) {
                                angular.element(navRightArrow).removeClass('active');
                            }
                        }
                    }

                    function decreaseMargin() {
                        if (clickCount > 0) {
                            menuItemsMarginLeft += menuItemWidth;
                            sessionStorage.currentMenuItemsMargin = menuItemsMarginLeft;
                            menuItems.style.marginLeft = menuItemsMarginLeft + "px";
                            clickCount--;

                            if (clickCount < maxClickCount) {
                                angular.element(navRightArrow).addClass('active');
                            }

                            if (clickCount === 0) {
                                angular.element(navLeftArrow).removeClass('active');
                            }
                        }
                    }

                    navRightArrow.addEventListener("click", increaseMargin);
                    navLeftArrow.addEventListener("click", decreaseMargin);

                    
                } else {
                    menuWrapper.style.width = menuWrapperWidth + "px";
                }
            }, 5);
        },
        templateUrl: '/Scripts/angular/hsComponents/hsCarouselMenu/hsCarouselMenu.tpl.html'
    };
}])
/*.run(['$templateCache', function ($templateCache) {
    $templateCache.put('hs-carousel-menu-template',
      "<div class=\"menu-wrapper\"><div class=\"nav-left-arrow-wrapper\"><a href=\"javascript:void(0)\" class=\"nav-left-arrow\"></a></div><div class=\"menu-items-wrapper\"><ul class=\"menu-items\"><li ng-repeat=\"menuItem in menu track by $index\" class=\"menu-item\"><a href=\"{{menuItem.link}}\" class=\"menu-icon {{menuItem.cssclass}}\" ng-click=\"setActive($index)\"></a><br><a href=\"{{menuItem.link}}\" class=\"menu-title\" ng-click=\"setActive($index)\">{{menuItem.name}}</a><div class=\"active-underline-wrapper\"><div class=\"active-underline\"></div></div></li></ul></div><div class=\"nav-right-arrow-wrapper\"><a href=\"javascript:void(0)\" class=\"nav-right-arrow\"></a></div></div>"
    );
}]);*/