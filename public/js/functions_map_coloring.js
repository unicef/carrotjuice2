
function gradient(score){
  return "#" +rainbow.colourAt(score*100)
}
// If polygon is selected (1) then color with later
function get_selected_color(i, score){
  return i == 0 ? gradient(score) : '#0099FF'
}

function poly_atts(poly, strength, color){
  // Flip sign of strength if negative
  strength = strength < 0 ? strength * -1 : strength
  return {
    fillColor:     color,
    color:        'black',
    dashArray:    '3',
    id:           poly.id,
    admin_2_name: poly.properties.admin_2_name,
    weight:       '0.5px',
    fillOpacity: strength 
  }
}

function get_matrix(division_v){
  url =  '/api/matrix/cell/' + country_iso
  selected_cells = []
  selected_cells_index = []
  //division_v._data.filter(function(e){ return e == 1})

  division_v._data.forEach(function(e, i){
    if(e == 1){
      selected_cells.push(i)
      selected_cells_index.push(divisions.features[i].properties.name)
    }
  })

  // if user has selected one or more divisions
  if(selected_cells_index.length > 0){
    url = url  + '/' + selected_cells_index.join('-')
  }
  scope.is_loading = true
  console.log("Quering resources for: " + selected_cells_index + " " + url)
  return $q(function(resolve, reject) {
    $http.get(
      '/api/matrix/cell/' +
      country_iso +
      '/' + 
      selected_cells_index.join('-')
    )
    .then(function(data){
      scope.is_loading = false
      resolve(data.data)    
    })
  });
}

function recalculate_strengths_raw(matrix, division_v){

  if(is_all_zeroes(division_v._data)){
    return get_normalized_linear_diagonal(matrix)
  }
  console.log("selected divisions:" + division_v._data.length)
  strengths = math.multiply(division_v._data, matrix); 

  // we don't want to color selected divion by strength
  division_v.forEach(function(e, index){
    if (e !=0)
      strengths[index] = 0;
  })

  return strengths;
}

function recalculate_strengths(matrix, division_v, coloring){
  strengths = recalculate_strengths_raw(matrix, division_v);
  // Get max value of the array
  max_value = Math.max.apply(null, strengths); 

  // Make sure not to divide 0 by 0
  if(max_value == 0){ max_value = 1 }

  division_v.forEach(function(e, index){
    if (e !=0)
      strengths[index] = max_value/4;
  })

  if(coloring == 'linear'){
    return strengths.map(function(e){return e/max_value })
  }else{
    return strengths.map(function(e){return e/max_value })
    // return strengths.map(function(e){return Math.log(e+1)/Math.log(max_value+1)})          
  }
}

function update_division_v(division_v, e){
  // Polygons and Polygon groups have slightly different options
  // options = e.target.options.style || e.target._options
  options = e.target.options.style || e.target._options

  // Assign array of source tower's communication counts with other towers to source_array
  source_index = division_index[options.id]

  // Update according to whether it was selected
  division_v._data[source_index] = division_v._data[source_index] == 0 ? 1 : 0;
  return division_v;
}

function is_all_zeroes(myArray){
  return myArray.every(function(e){return e == 0})
}

function normalize(val, vec){
  minV = Math.min.apply(Math, vec);
  maxV = Math.max.apply(Math, vec);

  return (val - minV) / maxV
}


// coloring is log or linear scale
function get_strength(matrix, index, max_value, coloring){
  if(coloring == 'linear'){
    return (matrix[index][index]+1)/(max_value+1); 
  }else{
    return Math.log(matrix[index][index]+1)/Math.log(max_value+1);        
  }
}

function get_diagonal(matrix){
  var vector = []

  matrix.forEach(function(e, index){
    vector[index] = matrix[index][index]
  })
  return vector
}

function get_max_diagonal(arry){
  var max_value = 0;
  if(!!arry){
    console.log('get_max_diagonal is all good')
    arry.map(function(e, index){
      if(arry[index][index] >= max_value){ max_value = arry[index][index] }
    })

  }else{
    console.log("Problem with get_max_diagonal. Investigate!")

  }
    return max_value;
}

function get_normalized_linear_diagonal(matrix){
  var result;
  vector    = get_diagonal(matrix);
  max_value = get_max_diagonal(matrix);
  vector.forEach(function(e, index){
    result  = vector[index]/max_value;
  })
  return result
}
