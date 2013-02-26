namespace('pat.math');

pat.math.arraySum = function(arr) {
    var sum = 0;
    for (var i = arr.length - 1; i >= 0; --i) {
        sum += arr[i];
    }
    return sum;
};