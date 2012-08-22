/*
 * see http://blogger.ziesemer.com/2008/05/javascript-namespace-function.html
 * Slightly modified it (changed argument sequence)
 */
var namespace = function(name, container, separator){
  var ns = name.split(separator || '.'),
    o = container || window,
    i,
    len;
  for(i = 0, len = ns.length; i < len; i++){
    o = o[ns[i]] = o[ns[i]] || {};
  }
  return o;
};