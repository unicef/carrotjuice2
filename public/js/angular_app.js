// Angular
var app = angular.module("carrotjuice", ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/home');
  
  $stateProvider    
    // HOME STATES AND NESTED VIEWS ========================================
    .state('home', {
      url: '/home',
      templateUrl: 'map_partial.html'
    })

    .state('zika', {
      url: '/zika',
      templateUrl: 'webgl_partial.html'
    })

    
    // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
    .state('about', {
        // we'll get to this in a bit       
    });     
});

//on main.html
app.controller('mainCtrl', ['$scope', function($scope) {
}]);


// on map_partial.html
app.controller('straightCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.compare_mode = false;
}]);