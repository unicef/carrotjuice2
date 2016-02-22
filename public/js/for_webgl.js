var app = angular.module("carrotJuice", ["carrotJuice.controllers"]);
         var set_num = 6

        Number.prototype.map = function(in_min, in_max, out_min, out_max) {
          return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        };
        fromRgb = function(n) {
          return Math.ceil((parseInt(n).map(0, 255, 0, 1)) * 1000) / 1000;
        };


angular.module("carrotJuice.controllers", [])
.controller("mainCtrl", function($scope, $http, $q) {
  
});
// WEBGL
// Returns a random integer from 0 to range - 1.
function randomInt(range) {
    return Math.floor(Math.random() * range);
}

function LatLongToPixelXY(latitude, longitude) {
    var pi_180 = Math.PI / 180.0;
    var pi_4 = Math.PI * 4;
    var sinLatitude = Math.sin(latitude * pi_180);
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256;
    var pixelX = ((longitude + 180) / 360) * 256;
    var pixel = { x: pixelX, y: pixelY };
    return pixel;
}

function translateMatrix(matrix, tx, ty) {
    // translation is in last column of matrix
    matrix[12] += matrix[0] * tx + matrix[4] * ty;
    matrix[13] += matrix[1] * tx + matrix[5] * ty;
    matrix[14] += matrix[2] * tx + matrix[6] * ty;
    matrix[15] += matrix[3] * tx + matrix[7] * ty;
}

function scaleMatrix(matrix, scaleX, scaleY) {
    // scaling x and y, which is just scaling first two columns of matrix
    matrix[0] *= scaleX;
    matrix[1] *= scaleX;
    matrix[2] *= scaleX;
    matrix[3] *= scaleX;

    matrix[4] *= scaleY;
    matrix[5] *= scaleY;
    matrix[6] *= scaleY;
    matrix[7] *= scaleY;
}