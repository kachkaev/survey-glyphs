namespace('pat.math');

pat.math.entropy = function(measurments) {
    var N = pat.math.arraySum(measurments);
    var E = 0;
    for (var i = measurments.length - 1; i >= 0; --i) {
        var miByN = measurments[i]/N;
        if (miByN != 0) {
            E += miByN * Math.log(miByN);
        }
    }
    var Emax = Math.log(measurments.length);
    return E / Emax;
};