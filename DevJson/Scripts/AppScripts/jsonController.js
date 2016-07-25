app.controller('jsonController', function ($scope, $http, ngDialog) {

    $scope.swaggerJson = [];
    $scope.swaggerEditorJson = [];
    $scope.models = [];
    $scope.tableViewModels = [];
    $scope.modelNames = [];
    $scope.showProperty = false;
    $scope.addProperty = {
        required: false,
        list: false
    };
    $scope.dataTypes = [{
        value: 'int',
        name: 'Integer',
        type: 'primary'
    }, {
        value: 'string',
        name: 'String',
        type: 'primary'
    }, {
        value: 'DateTime',
        name: 'Date Time',
        type: 'primary'
    }];


    //Add Model 
    $scope.AddModel = function () {
        var exists = false;
        angular.forEach($scope.models, function (obj) {
            if (Object.keys(obj) == $scope.model) {
                exists = true;
            }
        });
        if (exists) {
            alert('Duplicate Model Name');
        } else {
            $scope.models.push({
                "model": $scope.model,
                "properties": []
            });
            $scope.dataTypes.push({
                value: '#/definitions/' + $scope.model,
                name: $scope.model,
                type: 'secondary'
            });
            $scope.modelNames.push($scope.model);
        }
        $scope.model = '';
        console.log($scope.models);
    };

    // Add property to model
    $scope.AddPropertyToModel = function (property) {
        var index = $scope.models.findIndex(x => x.model == property.propertyModelName);
        var dataTypeType = $scope.dataTypes.findIndex(x => x.value == property.dataType)
        $scope.models[index].properties.push({
            "propertyName": property.propertyName,
            "dataType": property.dataType,
            "required": property.required,
            "list": property.list,
            "dataTypeType": $scope.dataTypes[index].type
        });
        console.log($scope.models);
        //   $scope.tableViewModels = JSON.stringify($scope.models, null, 2);
        //console.log($scope.tableViewModels);
        $scope.addProperty.propertyModelName = "";
        $scope.addProperty.propertyName = null;
        $scope.addProperty.dataType = "";
        $scope.addProperty.list = false;
        $scope.addProperty.required = false;
    }

    $scope.GetTypeOfDataType = function (dataType) {
        var index = $scope.dataTypes.findIndex(x => x.value == dataType);
        return $scope.dataTypes[index].type;
    };

    $scope.EditProperty = function (model, property, hashkey) {
        var index = $scope.dataTypes.findIndex(x => x.value == property.dataType);
        $scope.editElement = {
            hashkey: hashkey,
            modelName: model,
            propertyName: property.name,
            dataType: property.dataType,
            propertyType: property.type == 'list' ? true : false,
            required: property.required,
        }
        ngDialog.open({
            template: 'EditPropertyDialog',
            scope: $scope,
            closeByDocument: false,
            closeByEscape: true
        });
    }

    $scope.GetProperties = function (modelName) {
        $scope.showProperty = true;
        $scope.addProperty.propertyModelName = modelName;
    }

    $scope.GoToHome = function()
    {
        $scope.showProperty = false;
    }
});