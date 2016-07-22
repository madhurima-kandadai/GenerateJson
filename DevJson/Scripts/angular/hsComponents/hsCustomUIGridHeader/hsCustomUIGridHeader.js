angular.module('hsCustomUIGridHeader', ['ui.grid'])
.directive('categoryHeader', function () {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            grid: '=',
            col: '=',
            renderIndex: '='
        },
        link: function (scope, element, attrs) {
            /*key sorting function*/
            Array.prototype.keySort = function (key, desc) {
                this.sort(function (a, b) {
                    var result = desc ? (a[key] < b[key]) : (a[key] > b[key]);
                    return result ? 1 : -1;
                });
                return this;
            }

            scope.$watch('renderIndex', function (newv, oldv) {
                scope.catHeaderRowHeight = (scope.grid.options.categoryHeaderRowHeight) ? (scope.grid.options.categoryHeaderRowHeight + 'px') : (scope.grid.headerRowHeight + 'px');

                $(scope.grid.element[0]).find('.ui-grid-render-container-left .ui-grid-header-canvas').height(scope.catHeaderRowHeight + scope.grid.headerRowHeight);
                scope.customHeaders = [];

                for (var level = 0; level < scope.grid.options.maxCategoryLevels; level++) {
                    angular.forEach(scope.col, function (col) {
                        if (col.colDef.categoryDisplayName && col.colDef.categoryDisplayName.length !== scope.grid.options.maxCategoryLevels) {
                            var matched = false;
                            angular.forEach(col.colDef.categoryDisplayName, function (category) {
                                if (category.level === level - 1) {
                                    matched = true;
                                }
                            });

                            if (!matched) {
                                col.colDef.categoryDisplayName.push({ name: '\u00A0', level: level + 1 });
                            }
                        }
                    });
                }

                angular.forEach(scope.col, function (row) {
                    if (row.colDef.categoryDisplayName && row.colDef.categoryDisplayName.length === scope.grid.options.maxCategoryLevels) {
                        row.colDef.categoryDisplayName.keySort('level');
                    }
                });

                for (var level = 0; level < scope.grid.options.maxCategoryLevels; level++) {
                    var categories = [];
                    var lastDisplayName = "";
                    var totalWidth = 0;
                    var left = 0;
                    //var cols = scope.grid.options.columnDefs;
                    for (var i = 0; i < scope.col.length; i++) {
                        totalWidth += Number(scope.col[i].drawnWidth);

                        var displayName = (typeof (scope.col[i].colDef.categoryDisplayName) === "undefined" || typeof (scope.col[i].colDef.categoryDisplayName[level]) === "undefined") ? "\u00A0" : scope.col[i].colDef.categoryDisplayName[level].name;

                        if (displayName !== lastDisplayName) {

                            categories.push({
                                displayName: lastDisplayName,
                                width: totalWidth - Number(scope.col[i].drawnWidth),
                                widthPx: (totalWidth - Number(scope.col[i].drawnWidth)) + 'px',
                                left: left,
                                leftPx: left + 'px'
                            });

                            left += (totalWidth - Number(scope.col[i].drawnWidth));
                            totalWidth = Number(scope.col[i].drawnWidth);
                            lastDisplayName = displayName;
                        }
                    }

                    if (totalWidth > 0) {
                        categories.push({
                            displayName: lastDisplayName,
                            width: totalWidth,
                            widthPx: totalWidth + 'px',
                            left: left,
                            leftPx: left + 'px'
                        });
                    }

                    scope.customHeaders.push(categories);
                }
            });
        },
        templateUrl: '/Scripts/angular/hsComponents/hsCustomUIGridHeader/customHeader.tpl.html'
    };
});