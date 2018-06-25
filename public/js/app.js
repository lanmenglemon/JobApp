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
            return authService.checkIfCompany();
        }]
    })
    .when('/searchjob', {
        templateUrl: '/view/searchJob.html',
        controller: 'searchController',
        resolve: ['authService', function(authService) {
            return authService.checkIfSeeker();
        }]
    })
    .otherwise({
        redirectTo: '/',
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
            $scope.isSeeker = false;
        } else {
            $scope.isCompany = false;
            $scope.isSeeker = true;
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
        $scope.isSeeker = args !== "company";
    });

    $rootScope.$on('userLoggedIn', function (event, args) {
        $scope.isLoggedIn = args;
    })

    $scope.$on('userTypeChanged', function (event, args) {
        $scope.isCompany = args === "company";
        $scope.isSeeker = args !== "company";
    });

    $scope.$on('userLoggedIn', function (event, args) {
        $scope.isLoggedIn = args;
    })
})

app.controller('signupController', function($scope, $location, $http) {
    $scope.signup = function() {
        $scope.signupForm.isLoggedIn = false;
        $scope.signupForm.savedJobs = [ ];
        $scope.signupForm.appliedJobs = [ ];
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
            $("#dropdownMenu1").text($(this).text() + ' ');
            $("#dropdownMenu1").append('<span class="caret"></span>');
            $("#dropdownMenu1").val($(this).text());
        });
    });


    $scope.searchBy = function($event) {
        $scope.by = $event.target.name;
    };


    $scope.search = function () {
        if (typeof $scope.by != 'undefined' && $scope.by !== "") {
            $scope.query = [ $scope.by, $scope.filter_keyword ];
            $http.post('http://localhost:3000/searchjobs', $scope.query).then(function(resp) {
                $scope.jobs = resp.data;
            });
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

    $scope.saveJob = function (args) {
        $scope.saveObj = {
            "id": args,
            "userId": JSON.parse(localStorage.active_user)._id
        };
        $http.post('http://localhost:3000/savejob', $scope.saveObj).then(function(resp) {
            if (resp.data.length !== 0) {
                localStorage.active_user = JSON.stringify(resp.data[0]);
                document.getElementById('save_' + args).outerHTML = '<input ng-if="checkJobId(job._id)" class="btn btn-primary" disabled="disabled" id="save_{{job._id}}" type="button" value="Saved" ng-click="saveJob(job._id)" />';
            };
        });
    }

    $scope.applyJob = function (args) {
        $scope.applyObj = {
            "id": args,
            "userId": JSON.parse(localStorage.active_user)._id
        };
        $http.post('http://localhost:3000/applyjob', $scope.applyObj).then(function(resp) {
            if (resp.data.length !== 0) {
                localStorage.active_user = JSON.stringify(resp.data[0]);
                document.getElementById('apply_' + args).outerHTML = '<input ng-if="checkIfApplied(job._id)" class="btn btn-primary" disabled="disabled" id="apply_{{job._id}}" type="button" value="Applied" ng-click="applyJob(job._id)" />';
            };
        });
    }

    $scope.$on('$viewContentLoaded', function(){
        $scope.savedJobs = JSON.parse(localStorage.active_user).savedJobs;
        $scope.appliedJobs = JSON.parse(localStorage.active_user).appliedJobs;
    });

    $scope.checkIfSaved = function(id) {
        if (typeof $scope.savedJobs !== 'undefined' && $scope.savedJobs.includes(id)) {
            return true;
        }
        return false;
    }

    $scope.checkIfApplied = function(id) {
        if (typeof $scope.appliedJobs !== 'undefined' && $scope.appliedJobs.includes(id)) {
            return true;
        }
        
        return false;
    }

    $scope.showSavedJobs = function () {
        $scope.savedJobs = JSON.parse(localStorage.active_user).savedJobs;
        $http.post('http://localhost:3000/findjob', $scope.savedJobs).then(function (resp) {
            $scope.jobs = resp.data;
        });
        
    }

    $scope.showAppliedJobs = function () {
        $scope.appliedJobs = JSON.parse(localStorage.active_user).appliedJobs;
        $http.post('http://localhost:3000/findjob', $scope.appliedJobs).then(function (resp) {
            $scope.jobs = resp.data;
        });
    }
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
        'checkIfCompany': function() {
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
        },
        'checkIfSeeker': function() {
            dataService.getData(function() {
                if (localStorage.active_user !== "" && JSON.parse(localStorage.active_user).isLoggedIn) {
                    $rootScope.$emit('userLoggedIn', true);
                    $rootScope.$emit('userTypeChanged', JSON.parse(localStorage.active_user).type);
                    if(JSON.parse(localStorage.active_user).type !== "company") {
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
        },
    }
}]);