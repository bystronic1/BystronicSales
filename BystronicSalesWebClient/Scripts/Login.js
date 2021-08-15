var app = angular.module("BystronicClientModule", ['ngCookies', 'connection']);
    app.controller("LoginController", ['$rootScope', '$scope', '$http', '$cookies', '$timeout', 'ConnectionService', function ($rootScope, $scope, $http, $cookies, $timeout, Connection) {
        $scope.init = function () {

        $scope.version = getVersion();
        $scope.MajorVersion = getVersionInfo().MajorVersion;
        $scope.IsCanadianVersion = getVersionInfo().Country === 'CA';
        $scope.IsDemoVersion = isDemoVersion();
        
        $scope.service_login = $cookies.get("bystronic_service_login");
        CE($scope).loginButtonText = "Log in";

        FastClick.attach(document.body);
    };

    $scope.onSubmit = function () {
        if ($scope.isExpired === true)
            return;

        $('#animation_box').removeClass("shake");
        $scope.loginError = "";

        if (!$scope.service_login || !$scope.service_password) return;      
        $scope.user = { Name: $scope.service_login, Password: $scope.service_password };

        Connection.init($scope.user);
        $scope.loginButtonText = "Connecting...";
        
        Connection.login(
            function (response) {
                if (response.Data.Error)
                    onError(response.Data.Error.Message);
                else {
                    $scope.user = response.Data.User;
                    $scope.permissions = response.Data.Permissions;
                    onSuccess($scope.user);
                }
            },
            function () {
                onError("Cannot connect to Bystronic Data Service.");
                $timeout(function () { $scope.$apply(); });
            }
        );
    };

    onSuccess = function (response) {
        sessionStorage.user = JSON.stringify($scope.user);
        sessionStorage.permissions = JSON.stringify($scope.permissions);

        saveCookie($cookies, "bystronic_service_url", $scope.service_url);
        saveCookie($cookies, "bystronic_service_login", $scope.service_login);
        window.location.replace("main.html");
    };

    onError = function (message) {
        $scope.loginButtonText = "Log in";
        $('#animation_box').removeClass("fadeInDown");

        $('#animation_box').addClass("shake");
        $scope.loginError = message;
    };

    $('#username').keypress(function (e) {
        if (e.which == 13) { $('#password').focus(); return false; }
    });
    $('#password').keypress(function (e) {
        if (e.which == 13) { $scope.onSubmit(); return false; }
    });
}]);
