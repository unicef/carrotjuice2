// TODO(jetpack): is this really the best way to specify globals? :-/
/* global app, iso_to_yyyymmdd, log_rescale, stopwatch */

// TODO(jetpack): what's proper way to handle errors? currently just setting
// scope.error_message and logging to console..

app.directive('jetpack', function($http) {
  return {
    restrict: 'E',  // Restrict to element matches only.
    templateUrl: 'map_partial.html',

    link: function(scope, element, attrs, _controller) {
      stopwatch.reset('the top!');

      // Brazil.
      var country_code = 'br';
      var map_center = [-23.3, -46.3];  // São Paulo.
      var map_zoom = 9;
      // When zoomed out more, the polygons look really messed up. This zoom
      // level already shows all of Brazil.
      var min_map_zoom = 5;
      var max_map_zoom = 12;
      var map_region_layer = L.layerGroup();
      var map = initialize_map();

      // TODO(jetpack): Rethink how this data is stored. What do we need to
      // access, and how? Do we have duplication? What data will be needed for
      // the prevalence/oviposition calculations? And population density? What
      // needs to be accessible from scope?

      // Map from region_code to GeoFeature, with properties `name` and `temp`.
      var geofeature_by_region;
      // Map from date to region_code to weather data (currently just
      // `temp_mean`).
      var weather_by_date_and_region;

      // For debugging.
      var display_debug_info = true;
      scope.debug_display_value = display_debug_info ? 'block' : 'none';
      scope.redraw_notify = function() { console.log('redrawing now!'); };

      // How many things are loading. If > 0, view will display a spinner.
      scope.num_loading = 0;
      // TODO(jetpack): Do something with toasts instead! setTimeout to remove itself, etc.
      scope.error_message = null;
      // Date of current data.
      scope.current_date = null;
      scope.iso_to_yyyymmdd = iso_to_yyyymmdd;  // Expose util function.
      // Leaflet GeoJSON object for all regions.
      // TODO(jetpack): shouldn't need to be in `scope` anymore.
      scope.regions_geojson = null;
      // Map coloring options.
      scope.coloring_function_options =
        ['mosquito prevalence', 'oviposition rate', 'population density'];
      scope.coloring_function = scope.coloring_function_options[0];

      // Selected region.
      scope.current_region = null;
      // Array of [YYYY-MM-DD string, mean temp] pairs.
      scope.current_region_temps = [];

      // User chose a different coloring function.
      scope.change_coloring = function() {
        console.log('Coloring changed to:', scope.coloring_function);
        scope.class_prevalence = scope.coloring_function === 'mosquito prevalence' ?
          'coloring-selected' : 'coloring-nonselected';
        scope.class_oviposition = scope.coloring_function === 'oviposition rate' ?
          'coloring-selected' : 'coloring-nonselected';
        scope.class_population = scope.coloring_function === 'population density' ?
          'coloring-selected' : 'coloring-nonselected';
        // Recolor based on new coloring_function.
        recolor_regions();
      };

      /** @return{string} Debug string of weather_by_date_and_region. */
      // eslint-disable-next-line no-unused-vars,require-jsdoc
      function weather_debug() {
        var result = '';
        _.keys(weather_by_date_and_region).forEach(function(date) {
          var date_result = iso_to_yyyymmdd(date) + ': ';
          _.keys(weather_by_date_and_region[date]).forEach(function(region_code) {
            date_result += region_code + ',';
          });
          result += date_result + '<br>';
        });
        console.log('weather_debug:', result);
        return result;
      }

      // TODO(jetpack):
      // - Don't fetch if we already have data for the date already.
      // - Add next_date.

      // User chose a different date.
      scope.prev_date = function() { change_date_relative(country_code, -1); };
      scope.next_date = function() { change_date_relative(country_code, 1); };

      // eslint-disable-next-line valid-jsdoc
      /**
       * Wrapper for `change_date` that takes a number of days relative to
       * `current_date`.
       */
      function change_date_relative(country_code, n_days) {
        var new_date = new Date(scope.current_date);
        new_date.setDate(new_date.getDate() + n_days);
        return change_date(country_code, new_date);
      }

      /**
       * Fetch weather data for country for specified date.
       *
       * @param{string} country_code - Country.
       * @param{Date} date - Date to change to.
       * @return{Promise} Fulfilled when fetching, updating, and recoloring are
       *   complete.
       */
      function change_date(country_code, date) {
        if (scope.num_loading > 0) {
          console.error('Already loading something!', scope.num_loading);
          return Promise.reject('already loading something');
        }
        ++scope.num_loading;
        console.log('Requesting country weather for date:', date);
        return fetch_country_weather_and_update_data(country_code, date).then(function() {
          console.log('And now current_date is:', scope.current_date);
          recolor_regions();
          --scope.num_loading;
        });
      }

      // TODO(jetpack): http service returns object with "success". use that instead?

      /**
       * Downloads region data (including GeoJSON features) and saves it in
       * `geofeature_by_region`.
       *
       * @param{string} country_code - Country.
       * @return{Promise} Fulfilled once the request completes.
       */
      function fetch_country_regions(country_code) {
        return $http.get('/api/regions/' + country_code)
          .then(function(response) {
            stopwatch.click('Fetching regions complete: ' + response.status);
            if (response.data.length === 0) {
              throw new Error('Got empty regions, weird!');
            }
            var result = {};
            response.data.forEach(function(region) {
              // Augment regios's geo_feature's properties with region data.
              var geo_feature = region.geo_feature;
              geo_feature.properties = geo_feature.properties || {};
              _.assign(geo_feature.properties,
                       _.pick(region, ['name', 'region_code', 'geo_area_sqkm']));
              result[region.region_code] = geo_feature;
            });
            geofeature_by_region = result;
            stopwatch.click('Stored regions as geofeatures.');
          });
      }

      /**
       * Downloads weather data for all regions for the specified date and saves
       * it in `weather_by_date_and_region`.
       *
       * @param{string} country_code - The country.
       * @param{Date} date - Date to fetch data for (default: today).
       * @return{Promise} Fulfilled with response data once the request completes.
       */
      function fetch_country_weather(country_code, date) {
        // When no date_str specified, we get the latest data available.
        var date_str = '';
        if (date === undefined) {
          console.log('No date specified - fetching latest available data..');
        } else {
          date_str = '/' + iso_to_yyyymmdd(date);
        }
        return $http.get('/api/country_weather/' + country_code + date_str)
          .then(function(response) {
            stopwatch.click('Fetching weather complete: ' + response.status);
            weather_by_date_and_region = _.merge(weather_by_date_and_region, response.data);
            return response.data;
          });
      }

      /**
       * Fetches country weather, then updates local data:
       * - Updates `current_date`.
       * - Modifies `geofeature_by_region` by augmenting properties with new
       *   weather data.
       *
       * @param{string} country_code - The country.
       * @param{Date} date - Date to fetch data for (default: today).
       * @return{Promise} Fulfilled once the request completes and data is updated.
       */
      function fetch_country_weather_and_update_data(country_code, date) {
        return fetch_country_weather(country_code, date)
          .then(function(response) {
            // Update `scope.current_date`.
            console.log('Latest available data had key:', _.keys(response)[0]);
            if (date === undefined) {
              console.log('No date given, setting current date to latest available.');
              scope.current_date = new Date(_.keys(response)[0]);
            } else {
              scope.current_date = date;
            }

            // Update `geofeature_by_region`.
            _.keys(geofeature_by_region).forEach(function(region_code) {
              var date_key = scope.current_date.toISOString();
              var region_data = weather_by_date_and_region[date_key][region_code];
              if (region_data && region_data.temp_mean) {
                geofeature_by_region[region_code].properties.temp = region_data.temp_mean;
              }
            });
          });
      }

      /**
       * Return style for admin region. Coloring depends on
       * `scope.coloring_function` setting.
       *
       * @param{Feature} feature - Admin region GeoJSON feature.
       * @return{object} Style for the region.
       */
      function get_region_style(feature) {
        var style = {
          fillColor: '#03F',
          color: '#000',  // Border color.
          weight: 2
        };
        // TODO(jetpack): Use real science and stuff.
        switch (scope.coloring_function) {
          case 'mosquito prevalence':
            style.fillOpacity = log_rescale(feature.properties.temp, 1, 100);
            break;
          case 'oviposition rate':
            style.fillOpacity = log_rescale(feature.properties.temp * 0.5, 1, 100);
            break;
          case 'population density':
            style.fillOpacity = log_rescale(feature.properties.geo_area_sqkm, 10, 100000);
            break;
          default:
            console.error('Unknown coloring type:', scope.coloring_function);
        }
        return style;
      }

      /**
       * Recolor region polygons (perhaps due to new weather data, or a different coloring function.
       */
      function recolor_regions() {
        scope.regions_geojson.setStyle(get_region_style);
      }

      /**
       * Return URL to fetch N days worth of weather data for the region.
       *
       * @param{string} country_code - Country.
       * @param{string} region_code - Region.
       * @param{number} n_days - Number of days. Default of 180.
       * @return{string} URL for /region_weather/ endpoint.
       */
      function region_weather_url(country_code, region_code, n_days) {
        if (n_days === undefined) {
          n_days = 180;
        }
        var today = new Date();
        var start_date = new Date();
        start_date.setDate(start_date.getDate() - n_days);
        return '/api/region_weather/' + country_code + '/' + region_code + '/' +
          iso_to_yyyymmdd(start_date) + '/' + iso_to_yyyymmdd(today);
      }

      /** Set up interactions on region features. */
      // eslint-disable-next-line require-jsdoc
      function onEachFeature(feature, layer) {
        var region_popup = L.popup({
          autoPan: false,
          closeButton: false,
          offset: L.point(0, -10),
          className: 'custom-popup'
        }, layer);
        region_popup.setContent('<b>' + feature.properties.name + '</b>');

        var mouseover = function(e) {
          var layer = e.target;
          layer.setStyle({
            weight: 5,
            opacity: 1
          });
        };
        var mouseout = function(e) {
          scope.regions_geojson.resetStyle(e.target);
        };
        var mousemove = function(e) {
          region_popup.setLatLng(e.latlng);
          map.openPopup(region_popup);
        };
        var click = function(e) {
          scope.current_region = e.target.feature.properties;
          console.log('clicked. current_region now:', scope.current_region);
          stopwatch.reset('Fetching region weather..');
          // TODO(jetpack): break out into own function. merge response data into shared map.
          $http.get(region_weather_url(country_code, e.target.feature.properties.region_code))
            .then(function(response) {
              stopwatch.click('Fetching region weather complete: ' + response.status);
              var weather_history = response.data;
              scope.current_region_temps = _.keys(weather_history).map(function(date) {
                return [iso_to_yyyymmdd(date), weather_history[date].temp_mean];
              });
            }).catch(function(err) {
              console.error('Error with region weather data:', err);
              scope.error_message = 'Error getting region weather!';
            });
        };
        layer.on({
          mouseover: mouseover,
          mouseout: mouseout,
          mousemove: mousemove,
          click: click
        });
      }

      /**
       * Small helper to return URL to ESRI basemap tiles. See
       * http://doc.arcgis.com/en/living-atlas/ for ESRI basemaps.
       *
       * @param{string} basemap_name - Name of ESRI basemap.
       * @return{string} URL Leaflet tile layer format.
       */
      function esri_url(basemap_name) {
        return 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
          basemap_name + '/MapServer/tile/{z}/{y}/{x}';
      }

      /** @return{map} Leaflet map. */
      function initialize_map() {
        stopwatch.click('Initializing map.');

        /* eslint-disable max-len */
        var basemaps = {
          'CartoDB': L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
          }),
          'ESRI Gray': L.tileLayer(esri_url('Canvas/World_Light_Gray_Base'), {
            attribution: '&copy; <a href="http://doc.arcgis.com/en/living-atlas/item/?itemId=149a9bb14d604bd18f4597b21c19fac7">ESRI</a>'
          }),
          'ESRI Streets': L.tileLayer(esri_url('World_Street_Map'), {
            attribution: '&copy; <a href="http://doc.arcgis.com/en/living-atlas/item/?itemId=8bf7167d20924cbf8e25e7b11c7c502c">ESRI</a>'
          }),
          'ESRI Imagery': L.tileLayer(esri_url('World_Imagery'), {
            attribution: '&copy; <a href="http://doc.arcgis.com/en/living-atlas/item/?itemId=a2e7c99be14d421abac4f002d6c301f5">ESRI</a>'
          }),
          'OSM Transit': L.tileLayer('http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://thunderforest.com/">Thunderforest</a>'
          }),
          'OpenStreetMap': L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          })
        };
        /* eslint-enable max-len */

        var overlays = {
          'Administrative regions': map_region_layer
        };

        // TODO(jetpack): uh what's element[0]?
        var map = L.map(element[0], {
          center: map_center,
          zoom: map_zoom,
          minZoom: min_map_zoom,
          maxZoom: max_map_zoom,
          fadeAnimation: false,
          layers: [basemaps.CartoDB, map_region_layer],
          zoomControl: false  // Added manually below.
        });

        map.attributionControl.setPrefix('Carotene');
        L.control.layers(basemaps, overlays).addTo(map);
        L.control.scale({position: 'bottomright'}).addTo(map);
        // The zoom control is added manually so that it's above the scale control.
        L.control.zoom({position: 'bottomright'}).addTo(map);

        return map;
      }

      // TODO(jetpack): slow... optimize!
      // - simplify-geometry? https://www.npmjs.com/package/simplify-geometry
      // - TopoJSON to send less data over the wire (br polygons are ~45MB!)
      // - TileLayer/canvas? http://leafletjs.com/reference.html#tilelayer-canvas
      // - show higher-level admin regions above a certain zoom level?
      // - web workers, so at least we don't block?

      // Go! Load region polygons and latest weather data, convert to polys, add to map.
      fetch_country_regions(country_code)
        .then(function() {
          // Depends on `geofeature_by_region` being loaded by fetch_country_regions first.
          return fetch_country_weather_and_update_data(country_code);
        })
        .then(function() {
          stopwatch.click('Converting to leaflet geojson..');
          scope.regions_geojson = L.geoJson(
            _.values(geofeature_by_region).filter(function(x, i) { return i % 1 === 0; }), {
              onEachFeature: onEachFeature,
              style: get_region_style
            });

          stopwatch.click('Adding to map layer..');
          map_region_layer.addLayer(scope.regions_geojson);
          stopwatch.click('Added to map!');
        })
        .catch(function(err) {
          console.error('Problem!', err);
          scope.error_message = err;
        });
    }
  };
});
