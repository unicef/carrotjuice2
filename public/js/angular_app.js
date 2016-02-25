// Angular
var app = angular.module("carrotjuice", ['ui.router']);

// TODO(jetpack): why no $http required here?
app.controller('mainCtrl', ['$scope', function($scope) {
  console.log('mainCtrl app.controller top.');
}]);
