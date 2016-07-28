/// <reference path="../../Html/templates/EditPropertyDialog.tpl.html" />

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
        var index = $scope.models.findIndex(x => x.model.toLowerCase() == $scope.model.toLowerCase())
        if (index != -1) {
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
            $scope.showProperty = true;
            $scope.GetProperties($scope.model);
            $scope.addProperty.propertyModelName = $scope.model;
        }
        $scope.model = '';
    };

    // Add property to model
    $scope.AddPropertyToModel = function (property) {
        var index = $scope.models.findIndex(x => x.model == property.propertyModelName);
        var propIndex = $scope.models[index].properties.findIndex(x => x.propertyName.toLowerCase() == property.propertyName.toLowerCase());
        if (propIndex == -1) {
            var dataTypeType = $scope.dataTypes.findIndex(x => x.value == property.dataType)
            $scope.models[index].properties.push({
                "propertyName": property.propertyName,
                "dataType": property.dataType,
                "required": property.required,
                "list": property.list,
                "dataTypeType": $scope.dataTypes[dataTypeType].type
            });
            $scope.SwaggerJsonGeneration();
        }
        else {
            alert('Duplicate Property')
        }
        $scope.addProperty.propertyName = null;
        $scope.addProperty.dataType = "";
        $scope.addProperty.list = false;
        $scope.addProperty.required = false;
    }

    // Generate Swagger Json from the models created from the UI
    $scope.SwaggerJsonGeneration = function () {
        var index = 0;
        $scope.swaggerEditorJson = [];
        angular.forEach($scope.models, function (model, $index) {
            index = $index;
            $scope.swaggerEditorJson.push({
                [model.model]: {
                    "type": "object",
                    "required": [],
                    "properties": []
                }
            });
            angular.forEach(model.properties, function (property) {
                if (property.dataTypeType == 'primary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "type": "array",
                                "items": {
                                    "type": property.dataType
                                }
                            }
                        });
                    }
                    else {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "type": property.dataType
                            }
                        });
                    }
                } else if (property.dataTypeType == 'secondary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "type": "array",
                                "items": {
                                    "$ref": property.dataType
                                }
                            }
                        });
                    }
                    else {
                        $scope.swaggerEditorJson[index][model.model].properties.push({
                            [property.propertyName]: {
                                "$ref": property.dataType
                            }
                        });
                    }
                }

                if (property.required) {
                    $scope.swaggerEditorJson[index][model.model].required.push(property.propertyName);
                }
            });
        });
        $scope.tableViewModels = JSON.stringify($scope.swaggerEditorJson, null, 1);
    };

    //Edit property of a model - open dialog
    $scope.EditProperty = function (property) {
        $scope.editElement = {
            model: $scope.addProperty.propertyModelName,
            propertyName: property.propertyName,
            dataType: property.dataType,
            list: property.list,
            required: property.required,
        }
        ngDialog.open({
            templateUrl: './templates/EditPropertyDialog.tpl.html',
            scope: $scope,
            closeByDocument: false,
            closeByEscape: true
        });
    };

    // update property on click of save from the edit dialog
    $scope.updateProperty = function (property) {
        var index = $scope.models.findIndex(x => x.model == property.model);
        var dataTypeType = $scope.dataTypes.findIndex(x => x.value == property.dataType);
        var propertyIndex = $scope.models[index].properties.findIndex(x => x.propertyName == property.propertyName);
        $scope.models[index].properties[propertyIndex].dataType = property.dataType;
        $scope.models[index].properties[propertyIndex].list = property.list;
        $scope.models[index].properties[propertyIndex].required = property.required;
        $scope.models[index].properties[propertyIndex].dataTypeType = $scope.dataTypes[propertyIndex].type;
        $scope.SwaggerJsonGeneration();
        $scope.closengDialog();
    };


    //close dialog
    $scope.closengDialog = function () {
        ngDialog.close();
    }

    // Get the list of properties for model to show in the table 
    $scope.GetProperties = function (modelName) {
        $scope.showProperty = true;
        $scope.addProperty.propertyModelName = modelName;
        var index = $scope.models.findIndex(x => x.model == modelName)
        $scope.singleModelProperties = $scope.models[index];
    }

    //Open add model 
    $scope.GoToHome = function () {
        $scope.showProperty = false;
    }

    // Delete property from the model
    $scope.DeleteProperty = function (modelName, propertyName) {
        var index = $scope.models.findIndex(x => x.model == modelName);
        $scope.models[index].properties = jQuery.grep($scope.models[index].properties, function (property) {
            return property.propertyName != propertyName;
        });
        $scope.SwaggerJsonGeneration();

    };

    // Generate models and properties from the swagger file.
    $scope.CreateModelsFromJson = function () {
        $http({
            method: 'GET',
            url: "../JsonData/swaggerScript.json"
        })
   .success(function (response) {
       $scope.swaggerCode = response;
       $scope.tableViewModels = JSON.stringify($scope.swaggerCode, null, 2);
       $scope.modelsGenerate = [];
       angular.forEach($scope.swaggerCode, function (object, $index) {
           var modelIndex = $index;
           var key = Object.keys(object);
           $scope.modelsGenerate.push({
               "model": key[0],
               "properties": []
           });
           $scope.modelNames.push(key[0]);
           $scope.dataTypes.push({
               name: key[0],
               value: '#/definitions/' + key[0],
               type: 'secondary'
           });
           angular.forEach(object[key].properties, function (prop) {
               var propKey = Object.keys(prop);
               var dataType = '';
               if (prop[propKey].type == "array") {
                   if (prop[propKey].items.type != undefined) {
                       dataType = prop[propKey].items.type
                   }
                   else {
                       dataType = prop[propKey].items.$ref;
                   }
               }
               else {
                   if (prop[propKey].type != undefined) {
                       dataType = prop[propKey].type
                   }
                   else {
                       dataType = prop[propKey].$ref;
                   }
               }
               var dataTypeTypeIndex = $scope.dataTypes.findIndex(x => x.value == dataType);
               $scope.modelsGenerate[$index].properties.push({
                   "propertyName": propKey[0],
                   "dataType": dataType,
                   "required": object[key].required.findIndex(x => x == propKey) != -1 ? true : false,
                   "list": prop[propKey].type == "array" ? true : false,
                   "dataTypeType": $scope.dataTypes[dataTypeTypeIndex].type
               });
           });
       });
       $scope.models = $scope.modelsGenerate;
   }).error(function (response) {
   });
    }
});