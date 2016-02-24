app.directive('jetpack', function($http, $timeout, $q) {
  return {
    restrict: 'E',  // Restrict to element matches only.
    templateUrl: 'map_partial.html',

    link: function(scope, element, attrs, controller) {
      console.log('link top..');
      var country_code = 'br';  // Hardcoded to Brazil for now.
      var map_center = [-14.5, -54.0];
      var map_zoom = 4;
      var map = get_map();

      scope.is_loading = false;

      draw(map);

      /** Return map.
       * @return{todo} Map. TODO(jetpack): what's this type?
       */
      function get_map() {
        console.log('Getting map.');
        return L.map(element[0], {
          center: map_center,
          zoom: map_zoom,
          layers: []
        });
      }

      /** Draw the map.
       * @param{todo} map - TODO(jetpack): what's this?
       */
      function draw(map) {
        console.log("Drawing.");

        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      }

      console.log('..link bottom');
    }
  };
});
