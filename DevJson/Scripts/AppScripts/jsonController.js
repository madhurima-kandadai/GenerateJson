app.controller('jsonController', function ($scope, $http) {

    $scope.swaggerJson = [];
    $scope.swaggerEditorJson = [];
    $scope.models = [];
    $scope.tableViewModels = [];

    $scope.modelTypes = [{
        value: 'object',
        name: 'Object'
    },
    {
        value: 'array',
        name: 'List',
        type: 'primary'
    }
    ];

    $scope.dataTypes = [{
        value: 'int',
        name: 'Integer',
        type: 'primary'
    },
    {
        value: 'string',
        name: 'String',
        type: 'primary'
    },
    {
        value: 'DateTime',
        name: 'Date Time',
        type: 'primary'
    }
    ];

    $scope.SwaggerJsonGeneration = function () {
        var index = 0;
        $scope.swaggerEditorJson = [];
        angular.forEach($scope.models, function (model) {
            index = $scope.swaggerEditorJson.length;
            $scope.swaggerEditorJson.push({
                    [model.model]:
                        {
                            "type": "object",
                            "required": [],
                            "properties": []
                        }
            });
            angular.forEach(model.properties, function (property) {
                if (property.dataTypeType == 'primary') {
                    var propertyscript = '$scope.swaggerEditorJson[index].' + model.model + '.properties.push({ [property.name]: {  "type": property.type,"items" : { "type": property.dataType }} });';
                    eval(propertyscript);
                }
                else if (property.dataTypeType == 'secondary') {
                    var propertyscript = '$scope.swaggerEditorJson[index].' + model.model + '.properties.push({ [property.name]: { "type": property.type, "items" : { "$ref": property.dataType }} });';
                    eval(propertyscript);
                }

                if (property.required === true) {
                    var requiredScript = '$scope.swaggerEditorJson[index].' + model.model + '.required.push(property.name);';
                    eval(requiredScript);
                }
            });
        });
        console.log(JSON.stringify($scope.swaggerEditorJson, null, 2));
        $scope.swaggerEditorJson = JSON.stringify($scope.swaggerEditorJson, null, 2);
    };

    $scope.GetModel = function (model) {
        $scope.tableViewModels = [];
        var index = $scope.models.findIndex(x => x.model.toLowerCase() == model.model.toLowerCase());
        $scope.tableViewModels.push($scope.models[index]);
    };

    $scope.DeleteProperty = function (modelname, hashkey, propertyName) {
        $scope.tableViewModels = [];
        var index = $scope.models.findIndex(x => x.model.toLowerCase() == modelname.toLowerCase());
        $scope.models[index].properties = jQuery.grep($scope.models[index].properties, function (obj) {
            return obj.name != propertyName;
        });
        $scope.tableViewModels.push($scope.models[index]);
    };

    $scope.AddPropertyToModel = function () {
        if (JSON.stringify($scope.models).indexOf(JSON.stringify($scope.modelName)) == -1) {
            $scope.dataTypes.push({
                value: "#/definitions/" + $scope.modelName,
                name: $scope.modelName,
                type: 'secondary'
            });
            $scope.models.push({
                "model": $scope.modelName,
                "properties": [{
                    "name": $scope.propertyName,
                    "type": $scope.propertyType,
                    "dataTypeType": jQuery.parseJSON($scope.dataType).type,
                    "dataType": jQuery.parseJSON($scope.dataType).value,
                    "required": $scope.required == null ? false : $scope.required
                }]
            });
        }
        else {
            var index = $scope.models.findIndex(x => x.model.toLowerCase() == $scope.modelName.toLowerCase());
            if (index != -1) {
                debugger;
                var propIndex = $scope.models[index].properties.findIndex(x => x.name.toLowerCase() == $scope.propertyName.toLowerCase());
                if (propIndex == -1) {
                    $scope.models[index].properties.push({
                        "name": $scope.propertyName,
                        "type": $scope.propertyType,
                        "dataTypeType": jQuery.parseJSON($scope.dataType).type,
                        "dataType": jQuery.parseJSON($scope.dataType).value,
                        "required": $scope.required == null ? false : $scope.required
                    });
                }
                else {
                    alert("Duplicate property !~!!");
                }
            }
        }
        $scope.tableViewModels = $scope.models;
        $scope.propertyName = '';
        $scope.dataType = "";
        $scope.propertyType = '';
        $scope.required = null;
    };
});