var app = angular.module('myapp', ['ngRoute']);

app.config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: '/view/homepage.html',
        resolve: ['authService', function(authService) {
            return authService.checkIfLoggedIn();
        }]
    })
    .when('/signup', {
        templateUrl: '/view/signup.html',
        controller: 'signupController',
        resolve: ['authService', function(authService) {
            return authService.checkIfNotLoggedIn();
        }]
    })
    .when('/login', {
        templateUrl: '/view/login.html',
        controller: 'loginController',
        resolve: ['authService', function(authService) {
            return authService.checkIfNotLoggedIn();
        }]
    })
    .when('/postjob', {
        templateUrl: '/view/postJob.html',
        controller: 'postController',
        resolve: ['authService', function(authService) {
            return authService.checkUserType();
        }]
    })
    .when('/searchjob', {
        templateUrl: '/view/searchJob.html',
        controller: 'searchController',
        resolve: ['authService', function(authService) {
            return authService.checkIfLoggedIn();
        }]
    });
});


app.directive('navbar', function () {
    return {
        templateUrl: '/view/navbar.html',
        restrict: 'EA'
    };
});

app.controller('myappController', function($scope, $rootScope, $http, $location) {
    if (localStorage.getItem("active_user") !== null && localStorage.active_user !== "") {
        $scope.isLoggedIn = true;
        if (JSON.parse(localStorage.active_user).type === "company") {
            $scope.isCompany = true;
        } else {
            $scope.isCompany = false;
        }
    } else {
        $scope.isLoggedIn = false;
    }
    $scope.logout = function() {
        $http.get('http://localhost:3000/userLogout').then(function (resp) {
            if (resp.data.flg) {
                localStorage.active_user = "";
                $scope.$emit('userLoggedIn', false);
                alert('Log out successfully!')
                $location.path('/login');
            }
        });
    };

    $rootScope.$on('userTypeChanged', function (event, args) {
        $scope.isCompany = args === "company";
    });

    $rootScope.$on('userLoggedIn', function (event, args) {
        $scope.isLoggedIn = args;
    })

    $scope.$on('userTypeChanged', function (event, args) {
        $scope.isCompany = args === "company";
    });

    $scope.$on('userLoggedIn', function (event, args) {
        $scope.isLoggedIn = args;
    })
})

app.controller('signupController', function($scope, $location, $http) {
    $scope.signup = function() {
        $scope.signupForm.isLoggedIn = false;
        $http.post('http://localhost:3000/userSignup', $scope.signupForm).then(function (resp) {
            if (resp.data.flg) {
                alert('Sign up successfully!')
                $location.path('/login');
            }
        });
    };
    $scope.gotologin = function() {
        $location.path('/login');
    }
});

app.controller('loginController', function($scope, $location, $http) {
    $scope.login = function() {
        if ($scope.loginForm.username == '' || $scope.loginForm.password == '') {
            alert('Please fill!');
            return false;
        }
        
        $http.get('http://localhost:3000/userLogin/' + $scope.loginForm.username + '/' + $scope.loginForm.password)
        .then(function(resp) {
            if (!resp.data.length) {
                alert('Your username/password is not correct!');
            } else {
                $scope.active_user = resp.data[0];
                localStorage.active_user = JSON.stringify($scope.active_user);
                $scope.$emit('userLoggedIn', true);
                $scope.$emit('userTypeChanged', $scope.active_user.type);
                $location.path('/');
            }
        });
    };

    $scope.gotosignup = function() {
        $location.path('/signup');
    }
});

app.controller('postController', function($scope, $http, $window) {
    $scope.postJob = function() {
        $http.post('http://localhost:3000/postnewjob', $scope.postForm).then(function (resp) {
            if (resp.data.flg) {
                alert('Post a job successfully!')
                $window.location.reload();
            }
        });
    };
});

app.controller('searchController', function($scope, $location, $http, $sce) {
    $(function(){
        $(".dropdown-menu li a").click(function(){
            $(".btn:first-child").text($(this).text() + ' ');
            $(".btn:first-child").append('<span class="caret"></span>');
            $(".btn:first-child").val($(this).text());
        });
    });

    $http.get('http://localhost:3000/getjobs').then(function(resp) {
        $scope.jobs = resp.data;
    });

    $scope.searchBy = function($event) {
        $scope.by = $event.target.name;
        console.log($scope.by);
    };


    $scope.search = function () {
        if (typeof $scope.by != 'undefined' && $scope.by !== "") {
            $scope.filterFn = function (job) {
                if ($scope.filter_keyword === "") {
                    return true;
                }
                else {
                    if(job[$scope.by].toLowerCase().indexOf($scope.filter_keyword.toLowerCase()) != -1) {
                        return true;
                    }
                    return false;
                }
            }
        }
        else {
            alert('Please select a search option!');
        }
    }

    $scope.reset = function () {
        $scope.filter_keyword = "";
        $(".btn:first-child").text('Search by ');
        $(".btn:first-child").append('<span class="caret"></span>');
        $scope.by = "";
    }
});

app.filter('jobFilter', function(){
    return function(data, keyword) {
        return (keyword) ? data.filter((job, index) => {
            if(job.title.toLowerCase().indexOf(keyword.toLowerCase()) != -1) {
                return true;
            }
        }) : data;
    };
});

app.factory('dataService', function($http) {
    return {
        'getData': function(callbackFn) {
            if (localStorage.getItem("active_user") === null || localStorage.active_user === "") {
                $http.get('http://localhost:3000/checkUserStatus').then(function(resp) {
                    if(resp.data.length != 0) {
                        localStorage.active_user = JSON.stringify(resp.data[0]);
                    } else {
                        localStorage.active_user = "";
                    };
                    callbackFn();
                });
            } else {
                callbackFn();
            }
        }
    };
});

app.factory('authService', ['$location', 'dataService','$rootScope', function($location, dataService, $rootScope) {
    return {
        'checkIfLoggedIn': function () { 
            dataService.getData(function() {
                if (localStorage.active_user !== "" && JSON.parse(localStorage.active_user).isLoggedIn) {
                    $rootScope.$emit('userLoggedIn', true);
                    return true;
                } else {
                    $rootScope.$emit('userLoggedIn', false);
                    $location.path('/login');
                    return false;
                }
            });
        },
        'checkIfNotLoggedIn': function () { 
            dataService.getData(function() {
                if (localStorage.active_user !== "" && JSON.parse(localStorage.active_user).isLoggedIn) {
                    $rootScope.$emit('userLoggedIn', true);
                    $location.path('/');
                    return false;
                } else {
                    $rootScope.$emit('userLoggedIn', false);
                    return true;
                }
            });
        },
        'checkUserType': function() {
            dataService.getData(function() {
                if (localStorage.active_user !== "" && JSON.parse(localStorage.active_user).isLoggedIn) {
                    $rootScope.$emit('userLoggedIn', true);
                    $rootScope.$emit('userTypeChanged', JSON.parse(localStorage.active_user).type);
                    if(JSON.parse(localStorage.active_user).type === "company") {
                        return true;
                    }
                    else {
                        $location.path('/');
                        return false;
                    }
                } else {
                    $rootScope.$emit('userLoggedIn', false);
                    $location.path('/login');
                    return false;
                }
            });
        }
    }
}]);