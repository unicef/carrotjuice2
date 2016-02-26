app.directive('jetpack', function($http) {
  return {
    restrict: 'E',  // Restrict to element matches only.
    templateUrl: 'map_partial.html',

    link: function(scope, element, attrs, controller) {
      console.log('link top..');
      var country_code = 'br';  // Hardcoded to Brazil for now.
      var map_center = [-14.5, -54.0];
      var map_zoom = 5;
      // When zoomed out more, the polygons look really messed up. This zoom
      // level already shows all of Brazil.
      var min_map_zoom = 4;
      var map = get_map();

      // GeoJSON FeatureCollection of admin regions.
      var admin_polygons;
      // Array of relative population estimates for each admin region.
      // TODO(jetpack): make this per-day.
      var admin_populations;
      // Holds summary stats: 'min', 'max', and 'total'.
      var admin_population_stats;
      // TODO(jetpack): gotta be something simpler... everything in arrays?
      // everything in maps?
      // Mapping from admin name to array index (to associate admins with
      // various array-based data).
      var admin_name_to_index;

      // How many things are loading. If > 0, view will display a spinner.
      scope.num_loading = 0;
      scope.error_message = null;

      draw();

      fetch_admin_polygons_and_populations(country_code)
        .then(function() {
          console.log('Admin polygons fetched. Redraw!');
          draw();
        });

      /** Return map.
       * @return{todo} Map. TODO(jetpack): what's this type?
       */
      function get_map() {
        console.log('Getting map.');
        return L.map(element[0], {
          center: map_center,
          zoom: map_zoom,
          minZoom: min_map_zoom,
          fadeAnimation: false,
          attributionControl: false
        });
      }

      /** Returns summary statistics.
       * @param{Iterable} xs - Numbers to generate stats for.
       * @return{Object} Map with fields 'min', 'max', and 'total'.
       */
      function summary_stats(xs) {
        return xs.reduce(function(stats, x) {
          if (x < stats.min) { stats.min = x; }
          if (x > stats.max) { stats.max = x; }
          stats.total += x;
          return stats;
        }, {
          // Initial min and max will be replaced by any finite values.
          min: Infinity,
          max: -Infinity,
          total: 0
        });
      }

      /** Logarithmically rescales a value in [min, max].
       */
      function log_rescale(x, min, max) {
        return Math.log(x - min + 1) / Math.log(max - min + 1);
      }

      /** Downloads GeoJSON polygons to `admin_polygons` and relative population
       * estimates to `admin_populations`.
       * @param{string} country_code - The country.
       * @return{Promise} Fulfilled once the requests are complete.
       */
      function fetch_admin_polygons_and_populations(country_code) {
        ++scope.num_loading;
        console.log('Fetching admin polygons and populations..');
        // TODO(jetpack): http service returns object with "success". use that
        // instead?
        // TODO(jetpack): what's proper way to handle errors?
        // TODO(jetpack): factor these two...
        var polys = $http.get('/api/admin_polygons/' + country_code)
            .then(function(response) {
              console.log('Fetching admin polygons complete:', response.status);
              if (response.data.length === 0) {
                var err = 'Got empty admin_polygons, weird!';
                console.error(err);
                scope.error_message = err;
              } else {
                admin_polygons = response.data;
                admin_name_to_index = admin_polygons.features.reduce(
                  function(h, feature, index) {
                    h[feature.id] = index;
                    return h;
                  });
              }
            })
            .catch(function(err) {
              console.error('Error fetching admin_polygons:', err);
              scope.error_message = 'Error getting administrative regions!';
            });
        var pops = $http.get('/api/admin_populations/' + country_code)
            .then(function(response) {
              console.log('Fetching admin pops complete:', response.status);
              if (response.data.length === 0) {
                var err = 'Got empty admin_pops, weird!';
                console.error(err);
                scope.error_message = err;
              } else {
                admin_populations = response.data;
                admin_population_stats = summary_stats(admin_populations);
                console.log('summary_stats:', admin_population_stats);
              }
            });
        --scope.num_loading;
        return Promise.all([pops, polys]);
      }

      /** Set up layer to show admin name popup on click.
       */
      function onEachFeature(feature, layer) {
        if (feature.properties && feature.properties.admin_2_name) {
          layer.bindPopup(feature.properties.admin_2_name);
        }
      }

      /** Draw the map.
       */
      function draw() {
        console.log('Drawing.');

        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
          .addTo(map);

        // TODO(jetpack): painfully slow - optimize!
        // - simplify-geometry? https://www.npmjs.com/package/simplify-geometry
        // - cull non-visible?
        // - TileLayer/canvas?
        //   http://leafletjs.com/reference.html#tilelayer-canvas
        // - show higher-level admin regions above a certain zoom level?
        // - copy over timeit/stopwatch stuff from resources for lightweight
        //   timing.
        if (admin_polygons) {
          ++scope.num_loading;
          console.log('Adding admin polygons..');
          var geojsons = admin_polygons.features
          // .filter(function(x, i) { return i % 2 === 0; })
              .map(function(f) {
                f.properties.scaled_population =
                  log_rescale(admin_populations[admin_name_to_index[f.id]],
                              admin_population_stats.min,
                              admin_population_stats.max);
                return L.geoJson(f, {
                  style: {
                    stroke: false,  // No borders.
                    fillOpacity: f.properties.scaled_population
                  },
                  onEachFeature: onEachFeature
                });
              });
          console.log('Converted to geojson..');
          var layerGroup = L.layerGroup(geojsons);
          console.log('Added to layerGroup..');
          layerGroup.addTo(map);
          --scope.num_loading;
          console.log('Added to map!');
        }
      }

      console.log('..link bottom');
    }
  };
});
