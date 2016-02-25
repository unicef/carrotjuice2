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

      // GeoJSON FeatureCollection of admin regions.
      var admin_polygons;

      // How many things are loading. If > 0, view will display a spinner.
      scope.num_loading = 0;
      scope.error_message = null;

      draw(map);

      fetch_admin_polygons(country_code)
        .then(function() {
          console.log('Admin polygons fetched. Redraw!');
          draw(map, admin_polygons);
        });

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

      /** Downloads GeoJSON polygons for admin regions and saves them to
       * `admin_polygons`.
       * @param{string} country_code - Which country's regions to request.
       * @return{Promise} Fulfilled once the request is complete.
       */
      function fetch_admin_polygons(country_code) {
        ++scope.num_loading;
        console.log('Fetching admin polygons..');
        return $http.get('/api/admin_polygons/' + country_code)
          .then(function(response) {
            --scope.num_loading;
            console.log('Fetching admin polygons complete:', response.status);
            // TODO(jetpack): what's the proper way to handle errors?
            if (response.data.length === 0) {
              var err = 'Got empty admin_polygons, weird!';
              console.error(err);
              scope.error_message = err;
            } else {
              admin_polygons = response.data;
            }
          })
          .catch(function(err) {
            console.error('Error fetching admin_polygons:', err);
            scope.error_message = 'Error getting administrative regions!';
          });
      }

      /** Draw the map.
       * @param{todo} map - TODO(jetpack): what's this?
       * @param{FeatureCollection} admin_polygons - Polygons of admin regions.
       */
      function draw(map, admin_polygons) {
        console.log('Drawing.');

        // TODO(jetpack): painfully slow - optimize!
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        if (admin_polygons) {
          console.log('Adding admin polygons.');
          var polygons = L.layerGroup(admin_polygons.features.map(L.geoJson));
          polygons.addTo(map);
        }
      }

      console.log('..link bottom');
    }
  };
});
