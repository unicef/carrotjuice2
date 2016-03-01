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

      var most_recent_date_with_data;
      // Map from region_code to Region document.
      var regions;
      // Map from date to region_code to weather data (currently just
      // `temp_mean`).
      var region_weather;
      var region_weather_last;

      // How many things are loading. If > 0, view will display a spinner.
      scope.num_loading = 0;
      scope.error_message = null;

      draw();

      fetch_regions_and_weather(country_code)
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
        }, {min: Infinity, max: -Infinity, total: 0});
      }

      /** Logarithmically rescales a value in [min, max]. */
      // eslint-disable-next-line require-jsdoc
      function log_rescale(x, min, max) {
        return Math.log(x - min + 1) / Math.log(max - min + 1);
      }

      /**
       * Downloads region data (including GeoJSON features) and weather data.
       *
       * @param{string} country_code - The country.
       * @return{Promise} Fulfilled once the requests are complete.
       */
      function fetch_regions_and_weather(country_code) {
        ++scope.num_loading;
        console.log('Fetching regions and weather..');
        // TODO(jetpack): http service returns object with "success". use that
        // instead?
        // TODO(jetpack): what's proper way to handle errors?
        // TODO(jetpack): factor these two...
        var region_fetch = $http.get('/api/regions/' + country_code)
            .then(function(response) {
              console.log('Fetching regions complete:', response.status);
              if (response.data.length === 0) {
                throw new Error('Got empty regions, weird!');
              } else {
                regions = response.data.reduce(function(result, region) {
                  result[region.region_code] = region;
                  return result;
                }, {});
              }
            })
            .catch(function(err) {
              console.error('Error fetching regions:', err);
              scope.error_message = 'Error getting administrative regions!';
            });
        var weather_fetch = $http.get('/api/country_weather/' + country_code)
            .then(function(response) {
              console.log('Fetching weather complete:', response.status);
              if (response.data.length === 0) {
                throw new Error('Got empty admin_pops, weird!');
              } else {
                region_weather = response.data;
                // TODO(jetpack): HACKS.
                region_weather_last = _.values(region_weather)[0];
              }
            }).catch(function(err) {
              console.error('Error fetching regions:', err);
              scope.error_message = 'Error getting administrative regions!';
            });
        --scope.num_loading;
        return Promise.all([region_fetch, weather_fetch]);
      }

      /** Set up layer to show admin name popup on click. */
      // eslint-disable-next-line require-jsdoc
      function onEachFeature(feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindPopup(feature.properties.name + " " +
                          feature.properties.temp);
        }
      }

      /** Draw the map. */
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
        if (regions) {
          console.log('Adding admin polygons..');
          var geojsons = _.values(regions)
              //.filter(function(x, i) { return i % 10 === 0; })
              .map(function(region) {
                var f = region.geo_feature;
                f.properties = {name: region.name};
                if (region_weather_last) {
                  f.properties.temp =
                    region_weather_last[region.region_code].temp_mean;
                }
                return L.geoJson(f, {
                  style: {
                    stroke: false,  // No borders.
                    fillOpacity: log_rescale(f.properties.temp, 25, 1000)
                  },
                  onEachFeature: onEachFeature
                });
              });
          console.log('Converted to geojson..');
          var layerGroup = L.layerGroup(geojsons);
          console.log('Added to layerGroup..');
          layerGroup.addTo(map);
          console.log('Added to map!');
        }
      }

      console.log('..link bottom');
    }
  };
});
