// TODO(jetpack): is this really the best way to specify globals? :-/
/* global log_rescale, stopwatch */

// TODO(jetpack): what's proper way to handle errors? currently just setting
// scope.error_message and logging to console..

app.directive('jetpack', function($http) {
  return {
    restrict: 'E',  // Restrict to element matches only.
    templateUrl: 'map_partial.html',

    link: function(scope, element, attrs, controller) {
      stopwatch.reset('the top!');
      // Brazil.
      var country_code = 'br';
      var map_center = [-19.0, -45.5];
      var map_zoom = 7;
      // When zoomed out more, the polygons look really messed up. This zoom
      // level already shows all of Brazil.
      var min_map_zoom = 5;
      var map = get_map();

      var most_recent_date_with_data;
      // Map from region_code to GeoFeature, with properties `name` and `temp`.
      var regions;
      // Map from date to region_code to weather data (currently just
      // `temp_mean`).
      var region_weather;
      // Map from region_code to weather data (equivalent to
      // region_weather[scope.current_date]).
      var region_weather_current_date;

      // How many things are loading. If > 0, view will display a spinner.
      scope.num_loading = 0;
      scope.error_message = null;
      // Date of data, in ISO stirng format (e.g. "2016-03-01T00:00:00.000Z").
      scope.current_date = '';

      draw();
      fetch_regions_and_weather(country_code).then(draw);

      /** @return{map} Leaflet map. */
      function get_map() {
        return L.map(element[0], {
          center: map_center,
          zoom: map_zoom,
          minZoom: min_map_zoom,
          fadeAnimation: false,
          attributionControl: false
        });
      }

      /**
       * Downloads region data (including GeoJSON features) and weather data.
       *
       * @param{string} country_code - The country.
       * @return{Promise} Fulfilled once the requests are complete.
       */
      function fetch_regions_and_weather(country_code) {
        ++scope.num_loading;
        stopwatch.click('Fetching regions and weather..');
        // TODO(jetpack): http service returns object with "success". use that
        // instead?
        // TODO(jetpack): factor these two...
        var weather_fetch = $http.get('/api/country_weather/' + country_code)
            .then(function(response) {
              stopwatch.click('Fetching weather complete: ' + response.status);
              // Relying on the `catch` below for error handling.
              region_weather = response.data;
              // There should only be 1 date key in the response map: the latest
              // date for which we have data.
              scope.current_date = _.keys(region_weather)[0];
              region_weather_current_date = region_weather[scope.current_date];
            }).catch(function(err) {
              console.error('Error with weather data:', err);
              scope.error_message = 'Error getting weather!';
            });
        var region_fetch = $http.get('/api/regions/' + country_code)
            .then(function(response) {
              stopwatch.click('Fetching regions complete: ' + response.status);
              if (response.data.length === 0) {
                throw new Error('Got empty regions, weird!');
              } else {
                return weather_fetch.then(function() {
                  // Now `region_weather_last` has potentially been populated.
                  regions = response.data.reduce(function(result, region) {
                    // Augment region
                    var geo_feature = region.geo_feature;
                    _.set(geo_feature, ['properties', 'name'], region.name);
                    if (region_weather_current_date) {
                      _.set(geo_feature, ['properties', 'temp'],
                            region_weather_current_date[region.region_code]
                            .temp_mean);
                    }
                    result[region.region_code] = geo_feature;
                    return result;
                  }, {});
                  stopwatch.click('Stored regions as geofeatures.');
                });
              }
            })
            .catch(function(err) {
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
        stopwatch.click('Drawing.');

        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
          .addTo(map);

        // TODO(jetpack): painfully slow - optimize!
        // - simplify-geometry? https://www.npmjs.com/package/simplify-geometry
        // - TopoJSON to send less data over the wire (br polygons are ~45MB!)
        // - cull non-visible?
        // - TileLayer/canvas?
        //   http://leafletjs.com/reference.html#tilelayer-canvas
        // - show higher-level admin regions above a certain zoom level?
        // - web workers, so at least we don't block?
        if (regions) {
          var geojsons = _.values(regions)
          // .filter(function(x, i) { return i % 10 === 0; })
              .map(function(geo_feature) {
                return L.geoJson(geo_feature, {
                  style: {
                    stroke: false,  // No borders.
                    fillOpacity: log_rescale(geo_feature.properties.temp,
                                             25, 1000)
                  },
                  onEachFeature: onEachFeature
                });
              });
          stopwatch.click('Converted to geojson..');
          var layerGroup = L.layerGroup(geojsons);
          layerGroup.addTo(map);
          stopwatch.click('Added to map!');
        }
      }
    }
  };
});
