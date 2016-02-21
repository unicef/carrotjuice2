function mu_v(x){
  return(0.8692-0.1599*x+0.01116*Math.pow(x,2)-3.408*Math.pow(10,(-4))*Math.pow(x,3)+3.809*Math.pow(10,(-6))*Math.pow(x,4))
}

r_const = 1.987

function kelvin(x){
  return(x + 273.15)
}


function s_v(x){
  
  t = kelvin(x)
  
  return(((3.3589*Math.pow(10,(-3))*t/298)*Math.exp((1500/r_const)*(1/298-1/t)))/
           (1+Math.exp((6.203*Math.pow(10,21))/r_const*(1/(-2.176*Math.pow(10,30)))-1/t)))
}

function z_x(x){
  // return(Math.exp(-mu_v(x)*s_v(x))/Math.pow((mu_v(x),2)))
  return(Math.exp(-mu_v(x)*s_v(x))/(Math.pow(mu_v(x),2)))
}