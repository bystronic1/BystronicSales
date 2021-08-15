angular.module('connectionnew', []).
    service("ConnectionServiceNew", ["$http", function ($http) {
        "use strict";
        var init = function (user) {
            this.serviceUrl = "http://localhost/bystronic"; // local service
            //this.serviceUrl = "http://bystronic.cmd.consulting/bystronic"; // production service
            //this.serviceUrl = "http://localhost:8080"; // local service
            this.authentication = "Basic " + btoa(user.Name + ":" + user.Password);
        };

        //var login = function (onSuccessCallback, onErrorCallback) {
        //    sendPostRequest(this.serviceUrl, this.authentication,
        //        createRequest("login", {}),
        //        onSuccessCallback, onErrorCallback
        //    );
        //};

        var login = function (onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl + "/api/login/", this.authentication,
                createRequest("login", {}),
                onSuccessCallback, onErrorCallback
            );
        };

        var getData = function (user, onSuccessCallback, onErrorCallback) {
            sendGetRequest(this.serviceUrl + "/api/data/", this.authentication, user,
                onSuccessCallback, onErrorCallback
            );
        };

        var getColumns = function (user, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest("getcolumns", { user: user }),
                onSuccessCallback, onErrorCallback
            );
        };

        var saveColumns = function (user, columns, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest("savecolumns", { user: user, columns: columns }),
                onSuccessCallback, onErrorCallback
            );
        };

        var deleteView = function (user, view, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest("deleteview", { user: user, gridname: view }),
                onSuccessCallback, onErrorCallback
            );
        };

        var calculateOrder = function (user, order, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('calculateorder', { user: user, order: order }),
                onSuccessCallback, onErrorCallback
            );
        };

        var recalculateOrder = function (user, orderID, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('recalculateorder', { user: user, id: orderID }),
                onSuccessCallback, onErrorCallback
            );
        };

        var refreshOrderYtdSale = function (user, orderID, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('refreshorderytdsale', { user: user, id: orderID }),
                onSuccessCallback, onErrorCallback
            );
        };

        var createOrder = function (user, templateID, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('createorder', { user: user, template: templateID }),
                onSuccessCallback, onErrorCallback
            );
        };

        var saveOrder = function (user, order, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('saveorder', { user: user, order: order }),
                onSuccessCallback, onErrorCallback
            );
        };

        var deleteOrder = function (user, order, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('deleteorder', { user: user, id: order.ID }),
                onSuccessCallback, onErrorCallback
            );
        };

        var addSalesman = function (user, salesman, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('addsalesman', { user: user, salesman: salesman }),
                onSuccessCallback, onErrorCallback
            );
        };

        var updateSalesman = function (user, id, salesman, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('updatesalesman', { user: user, id: id, salesman: salesman }),
                onSuccessCallback, onErrorCallback
            );
        };

        var deleteSalesman = function (user, salesman, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('deletesalesman', { user: user, salesman: salesman }),
                onSuccessCallback, onErrorCallback
            );
        };

        var addCustomer = function (user, customer, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('addcustomer', { user: user, customer: customer }),
                onSuccessCallback, onErrorCallback
            );
        };

        var updateCustomer = function (user, customer, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('updatecustomer', { user: user, customer: customer }),
                onSuccessCallback, onErrorCallback
            );
        };

        var deleteCustomer = function (user, customer, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('deletecustomer', { user: user, customer: customer }),
                onSuccessCallback, onErrorCallback
            );
        };

        var addProduct = function (user, product, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('addproduct', { user: user, product: product }),
                onSuccessCallback, onErrorCallback
            );
        };

        var updateProduct = function (user, product, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('updateproduct', { user: user, product: product }),
                onSuccessCallback, onErrorCallback
            );
        };

        var deleteProduct = function (user, product, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest('deleteproduct', { user: user, product: product }),
                onSuccessCallback, onErrorCallback
            );
        };

        var getFormula = function (user, templateID, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest("getformula", { user: user, templateID: templateID }),
                onSuccessCallback, onErrorCallback
            );
        };

        var saveFormula = function (user, templateID, formula, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest("saveformula", { user: user, templateID: templateID, formula: formula }),
                onSuccessCallback, onErrorCallback
            );
        };

        var restoreDefaultFormula = function (user, templateID, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest("restoredefaultformula", { user: user, templateID: templateID }),
                onSuccessCallback, onErrorCallback
            );
        };

        var testFormula = function (user, formula, parameters, onSuccessCallback, onErrorCallback) {
            sendPostRequest(this.serviceUrl, this.authentication,
                createRequest("testformula", { user: user, formula: formula, parameters: parameters }),
                onSuccessCallback, onErrorCallback
            );
        };

        var createRequest = function (query, data) {
            return JSON.stringify({ query: query, data: data });
        };

        var sendPostRequest = function (serviceUrl, authentication, request, onSuccessCallback, onErrorCallback) {
            $http({
                method: "POST",
                url: serviceUrl,
                //withCredentials: true, // for Integtrated Windows Identification
                data: request,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authentication
                }
            }).then(function onSucces(response) {
                setTimeout(onSuccessCallback(response.data), 100);
            }, function onError(response) {
                setTimeout(onErrorCallback(response.message), 100);
            });
        };

        var sendGetRequest = function (serviceUrl, authentication, user, onSuccessCallback, onErrorCallback) {
            $http({
                method: "GET",
                url: serviceUrl,
                params: { user: user },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authentication,
                    //'Accept-Encoding': 'gzip, deflate'
                }
            }).then(function onSucces(response) {
                var a = response.headers;
                setTimeout(onSuccessCallback(response.data), 100);
            }, function onError(response) {
                setTimeout(onErrorCallback(response.message), 100);
            });
        };

        return {
            init,
            login,
            getData,
            getColumns, saveColumns, deleteView,
            calculateOrder, recalculateOrder, refreshOrderYtdSale,
            createOrder, saveOrder, deleteOrder,
            addSalesman, updateSalesman, deleteSalesman,
            addCustomer, updateCustomer, deleteCustomer,
            addProduct, updateProduct, deleteProduct,
            getFormula, saveFormula, restoreDefaultFormula, testFormula
        };

}]);
