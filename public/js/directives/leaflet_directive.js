

app.directive('leaflet', function ($http, $timeout, $q) {
  return {
    restrict: 'EA',
    //require: "^set",
    templateUrl: 'map_partial.html',

    link: function (scope, element, attrs, set) {
      // Default to Brazil for now
      country_iso  = 'br'
      map_center = [-22.518375, -50.625000]
      map_zoom   = 6
      // Loading spinner
      scope.is_loading = true
      // Division raw polygons
      var divisions
      //division ids to their index
      var division_index
      // Vector of divisions - selected or not
      var division_v
      // Division leaflet polygons
      var polygons
      // Max value of diagonal of matrix
      var max_value
      // Strength of opacity of polygon color
      var strengths
      //Mobility matrix
      var matrix
      var map = get_map();

      // Default to coloring polygons on linear scale
      scope.coloring      = 'linear'

      // Default to display voronoi cells
      scope.division      = 'cell'
      scope.division_text = 'cells'

      // Fetch 
      fetch_geojson_for_divisions(scope.division)

      scope.coloring      = 'linear'
      scope.coloring_text = 'log'

      // Toggle between linear / log coloring scale
      scope.change_coloring = function(){
        scope.coloring      = scope.coloring == 'linear' ? 'log' : 'linear'
        scope.coloring_text = scope.coloring == 'linear' ? 'log' : 'linear'
      }

      scope.$watch('coloring', function(new_value, old_value) {
        if(old_value != new_value){
          // WATCH OUT HERE with use of final_matrix
          console.log('Coloring has changed! Fetch: ' + new_value)

          max_value = get_max_diagonal(scope.matrix);

          draw(map, divisions, division_index, division_v, scope.matrix, max_value, strengths);
        }
      });



      function fetch_geojson_for_divisions(division){
        console.log('Fetching ' + division)
        scope.division_text = 'loading'
        // Get divisions
        $http.get('/api/division/' + division + '/' + country_iso).
        then(function(response) {
          if(response.data.length == 0){
            alert('divisions could not be fetched due to a memory problem');
            document.location.href='/';
            return;
          }

          // Update label in view so users knows whether looking at division type admin or cell
          scope.division_text  = scope.division == 'admin' ? 'cells' : 'divisions'
          scope.is_loading     = false
          divisions               = response.data;

          // Create a hash of admin ids to their index in the divisions array which will match their order in the mobility matrix
          division_index = divisions.features.reduce( function(h, e, i){ h[e.id] = i++; return h}, {})

          // get vector of divisions selected (0 = non selected, 1=selected)
          division_v = math.zeros(Object.keys(division_index).length);

        })
        .then(function(){
          start_date = new Date()
          end_date   = new Date()
          // The 6th argument as 0 refers to the main matrix, not the one to compair with
          fetch_matrix_then_draw(division, map, divisions, division_index, division_v, 0, true)
        })
      }  

      // Formerly fetch_matrix_with_dates_then_draw
      function fetch_matrix_then_draw(division, map, divisions, division_index, division_v, matrix_index, suppress_display_loading){

        scope.matrix     = !!scope.matrix ? scope.matrix : null

        scope.is_loading = true
        $http.get('/api/diagonal/matrix/' + division + '/' + country_iso  )
        .then(function(data){
          scope.matrix = data.data
          // used in get_strength
          max_value    = get_max_diagonal(scope.matrix);

          scope.is_loading = false
          if(scope.matrix.length == 0){
            alert('Could not serve the matrix');
          }else{
            // This used to be without condition. Not sure what happened. 11-29-15
            if(!!division_v)
              draw(map, divisions, division_index, division_v, scope.matrix, max_value);              
            }
          })
        }

      function draw(map, divisions, division_index, division_v, matrix, max_value, strengths) {

        if(!is_all_zeroes(division_v._data)){
          console.log("drawing with selected division")

          strengths = recalculate_strengths(matrix, division_v, scope.coloring);

          polygons  = recolor_polygons(map, divisions, division_index, division_v, matrix, max_value, strengths);
        }else{
          console.log("drawing from diagonal")
          console.log('on load or on log/linear change')
          polygons = recolor_polygons(map, divisions, division_index, division_v, matrix, max_value);
        }

        map.eachLayer(function (layer) {
          if(!!layer){
            if(!!layer.options){
              if(!!layer.options.style){
                layer.on('click', null)
                map.removeLayer(layer);                
              }
            }
          }
        });

        // Add new polygons
        polygons.addTo(map);

        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      };

      function recolor_polygons(map, divisions, division_index, division_v, matrix, max_value, strengths){
          if(scope.coloring == 'log'){
            z_x_values = divisions.features.map(function(e){return Math.log(z_x(e.properties.temp))})            
          }else{
            z_x_values = divisions.features.map(function(e){return z_x(e.properties.temp)})            
          }

          // Used when coloring after click
          // NOT YET USED
          scope.n_z_x = z_x_values.map(function(e){ return normalize(e, z_x_values)})


        return L.layerGroup(
          divisions.features.map(function(poly, ind){
            i           = division_index[poly.id]

            strength    = !!strengths ? strengths[i] : get_strength(matrix, i, max_value, scope.coloring)

            color       =  get_color(strengths, division_v, i);
            var style   = poly_atts(poly, strength, color)
            var polygon = L.geoJson(poly, {style: style})
                          .on('click', function(e){
                            // division_v   = update_division_v(division_v, e);
                            // promise      = get_matrix(division_v)
                            // promise.then(function(m){  
                            //   scope.matrix = m
                            //   polygons  = draw(map, divisions, division_index, division_v, m, max_value, strengths);                              
                            // })

                          }).bindLabel((poly.properties.admin_2_name || poly.properties.name));

            return polygon          
          })
        )
      }    

      function get_color(strengths, selected_v, i){
        if(!strengths) return '#8DC63F'

        if(selected_v._data[i] == 1) return get_selected_color(selected_v._data[i],  scope.z_x_v[i]) // In core.js

        return is_all_zeroes(selected_v._data) ? '#8DC63F' : get_selected_color(selected_v._data[i], scope.n_z_x[i])
      }


      function get_map(){
        return L.map(element[0], {
                center: map_center,
                //center: [9, -12],
                zoom:   map_zoom,
                layers: []
              });
      }
    }
  };
});