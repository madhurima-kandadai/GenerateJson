/// <reference path="../../Html/templates/EditPropertyDialog.tpl.html" />

app.controller('jsonController', ['$scope', '$http', 'ngDialog', 'pathService', 'definitionService', function ($scope, $http, ngDialog, pathService, definitionService) {

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
        value: 'integer',
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
    }, {
        value: 'boolean',
        name: 'Boolean',
        type: 'primary'
    }, {
        value: 'number',
        name: 'Number',
        type: 'primary'
    }];

    // Path initializations
    $scope.paths = [];
    $scope.edit = false;
    $scope.test = {
        methodName: ''
    };
    $scope.showPaths = false;
    $scope.httpVerbs = [{
        'name': "GET",
        'value': 'get'
    }, {
        'name': "PUT",
        'value': 'put'
    }, {
        'name': "POST",
        'value': 'post'
    }, {
        'name': "DELETE",
        'value': 'delete'
    }];
    $scope.responsesList = [{
        "name": "200 OK",
        "value": "200"
    }, {
        "name": "404 Not Found",
        "value": "404"
    }, {
        "name": "405 Method Not Found",
        "value": "405"
    }, {
        "name": "500 Internal Server Error",
        "value": "500"
    },
    {
        "name": "Default",
        "value": "default"
    }];
    $scope.parameters = [];
    $scope.responses = [];

    //Add Model 
    $scope.AddModel = function () {
        var index = $scope.models.findIndex(x => x.model.toLowerCase() == this.model.toLowerCase())
        if (index != -1) {
            alert('Duplicate Model Name');
        } else {
            $scope.models.push({
                "model": this.model,
                "properties": []
            });
            $scope.dataTypes.push({
                value: '#/definitions/' + this.model,
                name: this.model,
                type: 'secondary'
            });
            $scope.modelNames.push(this.model);
            $scope.showProperty = true;
            $scope.GetProperties(this.model);
            $scope.addProperty.propertyModelName = this.model;
        }
        this.model = '';
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
            $scope.test = $scope.models;
            console.log($scope.test);
            $scope.SwaggerJsonGeneration();
        } else {
            alert('Duplicate Property')
        }
        $scope.addProperty.propertyName = null;
        $scope.addProperty.dataType = "";
        $scope.addProperty.list = false;
        $scope.addProperty.required = false;
    }

    // Generate Swagger Json from the models and services created from the UI
    $scope.SwaggerJsonGeneration = function () {
        $scope.swaggerEditorJson = {};
        angular.forEach($scope.models, function (model, $index) {
            $scope.swaggerEditorJson[model.model] = {
                "type": "object",
                "required": [],
                "properties": {}
            };
            angular.forEach(model.properties, function (property) {
                if (property.dataTypeType == 'primary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "type": "array",
                            "items": {
                                "type": property.dataType
                            }
                        };
                        if (property.dataType == "integer") {
                            $scope.swaggerEditorJson[model.model].properties[property.propertyName]["items"].format = "int32"
                        }
                    } else {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "type": property.dataType
                        }
                        if (property.dataType == "integer") {
                            $scope.swaggerEditorJson[model.model].properties[property.propertyName].format = "int32"
                        }
                    }
                } else if (property.dataTypeType == 'secondary') {
                    if (property.list) {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "type": "array",
                            "items": {
                                "$ref": property.dataType
                            }
                        };
                    } else {
                        $scope.swaggerEditorJson[model.model].properties[property.propertyName] = {
                            "$ref": property.dataType
                        };
                    }
                }
                if (property.required) {
                    $scope.swaggerEditorJson[model.model].required.push(property.propertyName);
                }
            });
        });
        $scope.pathJson = {};
        angular.forEach($scope.paths, function (pathObj) {
            $scope.pathJson[pathObj.pathName] = {};
            angular.forEach(pathObj.methods, function (methodObj) {
                $scope.pathJson[pathObj.pathName][methodObj.methodName] = {
                    "consumes": [],
                    "produces": [],
                    "parameters": [],
                    "responses": {}
                };
                angular.forEach(methodObj.parameters, function (param) {
                    $scope.pathJson[pathObj.pathName][methodObj.methodName].parameters.push({
                        "name": param.parameterName,
                        "in": param.in,
                        "required": param.required,
                        "type": param.dataType,
                    });
                });
                angular.forEach(methodObj.responses, function (resp) {
                    if (resp.list) {
                        $scope.pathJson[pathObj.pathName][methodObj.methodName].responses[resp.status] = {
                            "description": resp.status,
                            "schema": {
                                "type": "array",
                                "items": {
                                    "type": resp.output
                                }
                            }
                        };
                    } else {
                        $scope.pathJson[pathObj.pathName][methodObj.methodName].responses[resp.status] = {
                            "description": resp.status,
                            "schema": {
                                "type": resp.output
                            }
                        };
                    }
                });
            });
        });
        $scope.json = {
            "definitions": $scope.swaggerEditorJson,
            "path": $scope.pathJson
        };
        $scope.tableViewModels = JSON.stringify($scope.json, null, 1);
    };

    //Edit property of a model - open dialog
    $scope.EditProperty = function (property) {
        $scope.editElement = {
            model: $scope.addProperty.propertyModelName,
            propertyName: property.propertyName,
            dataType: property.dataType,
            list: property.list,
            required: property.required,
        };
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
    };

    // Get the list of properties for model to show in the table 
    $scope.GetProperties = function (modelName) {
        $scope.showDef = true;
        $scope.showProperty = true;
        $scope.addProperty.propertyModelName = modelName;
        var index = $scope.models.findIndex(x => x.model == modelName)
        $scope.singleModelProperties = $scope.models[index];
    };

    //Open add model 
    $scope.GoToHomeDefinitions = function () {
        $scope.showProperty = false;
        $scope.showDef = true;
    };

    $scope.GoToHomeDefinitions();

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
        }).success(function (response) {
            console.log(response);
            $scope.swaggerCode = response;
            $scope.tableViewModels = JSON.stringify($scope.swaggerCode, null, 2);
            $scope.modelsGenerate = [];
            var keysList = Object.keys($scope.swaggerCode['definitions']);
            angular.forEach(keysList, function (key) {
                $scope.dataTypes.push({
                    name: key,
                    value: '#/definitions/' + key,
                    type: 'secondary'
                });
            });
            angular.forEach(keysList, function (key, $index) {
                $scope.modelsGenerate.push({
                    "model": key,
                    "properties": []
                });
                $scope.modelNames.push(key);
                var propList = Object.keys($scope.swaggerCode['definitions'][key].properties);
                var mainObject = $scope.swaggerCode['definitions'][key].properties;
                angular.forEach(propList, function (propKey) {
                    var dataType = '';
                    if (mainObject[propKey].type == "array") {
                        if (mainObject[propKey].items.type != undefined) {
                            dataType = mainObject[propKey].items.type
                        } else {
                            dataType = mainObject[propKey].items.$ref;
                        }
                    } else {
                        if (mainObject[propKey].type != undefined) {
                            dataType = mainObject[propKey].type
                        } else {
                            dataType = mainObject[propKey].$ref;
                        }
                    }
                    var dataTypeTypeIndex = $scope.dataTypes.findIndex(x => x.value == dataType);
                    var required = false;
                    if ($scope.swaggerCode['definitions'][key].required != undefined) {
                        if ($scope.swaggerCode[key].required.findIndex(x => x == propKey) != -1) {
                            required = true;
                        }
                    }
                    var dataTypeType = $scope.dataTypes[dataTypeTypeIndex].type;
                    $scope.modelsGenerate[$index].properties.push({
                        "propertyName": propKey,
                        "dataType": dataType,
                        "required": required,
                        "list": mainObject[propKey].type == "array" ? true : false,
                        "dataTypeType": dataTypeType
                    });
                });
            });
            $scope.models = $scope.modelsGenerate;
            $scope.services = [];
            var serviceKeyList = Object.keys($scope.swaggerCode['paths']);
            angular.forEach(serviceKeyList, function (service, pathIndex) {
                $scope.services.push({
                    'pathName': service,
                    methods: []
                });
                var methods = Object.keys($scope.swaggerCode['paths'][service]);
                angular.forEach(methods, function (mthd, methodIndex) {
                    $scope.services[pathIndex].methods.push({
                        "methodName": mthd,
                        "parameters": [],
                        "responses": []
                    });
                    angular.forEach($scope.swaggerCode['paths'][service][mthd].parameters, function (param) {
                        $scope.services[pathIndex].methods[methodIndex].parameters.push({
                            "in": param.in,
                            "parameterName": param.name,
                            "dataType": param.type,
                            "required": param.required,
                            "format": param.format,
                            "duplicate": false
                        });
                    });
                    var responses = Object.keys($scope.swaggerCode['paths'][service][mthd].responses);
                    angular.forEach(responses, function (resp) {
                        if ($scope.swaggerCode['paths'][service][mthd].responses[resp].schema.type == 'array') {
                            $scope.services[pathIndex].methods[methodIndex].responses.push({
                                "status": resp,
                                "output": $scope.swaggerCode['paths'][service][mthd].responses[resp].schema.items.$ref,
                                "list": true,
                                "description": $scope.swaggerCode['paths'][service][mthd].responses[resp].schema.description,
                                "duplicate": false
                            });
                        }
                    });
                });
            });
            $scope.paths = $scope.services;
        }).error(function (response) { });
    };

    // for paths--------------------------------------------------

    $scope.addNewParameter = function (value) {
        if (value == "query") {
            $scope.parameters.push({
                "in": "query",
                "parameterName": "",
                "parameterType": "",
                "required": "",
                "list": "",
                "duplicate": false
            });
        } else if (value == "request") {
            $scope.parameters.push({
                "in": "header",
                "parameterName": "",
                "parameterType": "",
                "required": "",
                "list": "",
                "duplicate": false
            });
        } else if (value == "response") {
            $scope.responses.push({
                "status": "",
                "output": "",
                "list": "",
                "description": "",
                "duplicate": false
            });
        }
    };

    $scope.AddPath = function () {
        $scope.paths = pathService.AddPath($scope.paths, this.path);
        $scope.path = "";
        $scope.showPaths = true;
    };

    $scope.AddMethodToPath = function (path, methodName, parameters, responses) {
        var result = $scope.CheckParameterName(parameters, responses);
        var index = $scope.paths.findIndex(x => x.pathName == path);
        var length = $scope.paths[index].methods.length;
        var methodIndex = $scope.paths[index].methods.findIndex(x => x.methodName == methodName);
        if (!$scope.edit) {
            if (methodIndex == -1) {
                $scope.paths[index].methods.push({
                    "methodName": methodName,
                    "parameters": [],
                    "responses": []
                });
                $scope.paths[index].methods[length].parameters = parameters;
                $scope.paths[index].methods[length].responses = responses;
                $scope.ClearData(path);
            } else {
                alert("This method is already available.");
            }
        } else {
            var methodIndex = $scope.paths[index].methods.findIndex(x => x.methodName == methodName);
            $scope.paths[index].methods[methodIndex].parameters = parameters;
            $scope.paths[index].methods[methodIndex].responses = responses;
        }
        $scope.SwaggerJsonGeneration();
    };

    $scope.GoToHomeServices = function () {
        $scope.path = "";
        $scope.showDef = false;
        $scope.showPaths = false;
    };

    $scope.GetMethodDetails = function (pathName, methodName) {
        $scope.showDef = false;
        $scope.edit = true;
        $scope.showPaths = true;
        $scope.pathNameLabel = pathName;
        var pathIndex = $scope.paths.findIndex(x => x.pathName == pathName);
        var methodIndex = $scope.paths[pathIndex].methods.findIndex(x => x.methodName == methodName);
        var methodObject = $scope.paths[pathIndex].methods[methodIndex];
        $scope.test.methodName = methodName;
        $scope.parameters = methodObject.parameters;
        $scope.responses = methodObject.responses;
    };

    $scope.ClearData = function (pathName) {
        $scope.pathNameLabel = pathName;
        $scope.showDef = false;
        $scope.showPaths = true;
        $scope.edit = false;
        $scope.path = "";
        $scope.test.methodName = "";
        $scope.parameters = [];
        $scope.responses = [];
    };

    $scope.DeleteFromParams = function (hashkey) {
        var index = _.findIndex($scope.parameters, function (path) {
            return path.$$hashKey == hashkey;
        });
        $scope.parameters.splice(index, 1);
    };

    $scope.DeleteResponse = function (hashkey) {
        var index = $scope.responses.findIndex(x => x.$$hashKey == hashkey);
        $scope.responses.splice(index, 1);
    };

    $scope.CheckParameterName = function (parameters, responses) {

        var attributes = _.groupBy($scope.parameters, function (item) {
            return item.parameterName == parameter.parameterName && item.in == parameter.in;
        });
        if (attributes.true != undefined && attributes.true.length > 1) {
            parameter.duplicate = true;
        } else {
            parameter.duplicate = false;
        }
    };
}]);