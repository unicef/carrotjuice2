function dewPointTemperature(temp, rh){
  return 243.04*(Math.log(rh/100)+((17.625*temp)/(243.04+temp)))/(17.625-Math.log(rh/100)-((17.625*temp)/(243.04+temp)))
}

function vaporPressure(temp, rh){
  td = dewPointTemperature(temp, rh)
  return 6.11 * Math.pow(
    10.0, 
    (
      (7.5*td) /(237.3+td)
    )
  )
}

function relativeHumidityFactor(temp, rh){
  vp = vaporPressure(temp, rh)
  if((vp > 10) && (vp < 30 )){
    return 1.2 - 0.2 * vp
  }else if(vp >= 30){
    return 0.5
  }else{
    console.log('error in calculating relative humidity factor ' + temp + " " + rh + " " + vp)
  }
}