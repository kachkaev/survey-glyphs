var arraySum = function(arr) {
    var sum = 0;
    for (var i = arr.length - 1; i >= 0; --i) {
        sum += arr[i];
    }
    return sum;
};

function fleissKappa(matrix, checkMatrix) {
    var N = matrix.length;              // subjects
    var k = matrix[0].length;           // categories
    var n = arraySum(matrix[0]);        // raters
 
    // checking data matrix
    if (checkMatrix) {
        for(var i = matrix.length - 1; i >= 1 ; --i){
            
            if(matrix[i].length != k){
                exit(0);
                throw new Error('Number of categories must be equal');
            }
            
            if(arraySum(matrix[i])!=n){
                throw new Error('Number of raters must be equal');
            }
        }
    }
    if (n <= 0) {
        throw new Error('Number of raters should be more than 0');
    }
 
    
    // computing p[]
    var p = [];
    for(var j = k - 1; j >= 0; --j){
        p.push(0);
    }
 
    for(var j = k - 1; j >=0; --j){
        var tmp = 0;
        for(var i = N - 1; i >= 0; --i){
            tmp += matrix[i][j];
        }
        p[j] = tmp / (n*N);
    }
 
    // computing P[]
    var P = [];
    for(var i = N - 1; i >= 0; --i){
        P.push(0);
    }

    for(var i = N - 1; i >= 0; --i)
    {
        var tmp = 0;
        for(var j = k - 1; j >= 0; --j) {
            tmp += matrix[i][j] * matrix[i][j];
        }
        P[i] = (tmp - n) / (n * (n - 1)) ;
    };
    
    // Computing Pbar
    var Pbar = arraySum(P) / N;

    // Computing PbarE
    var PbarE = 0;
    for(var j = k - 1; j >= 0; --j){
        PbarE += p[j] * p[j];
    }

    // FIXME return result instead of Pbar
    return Pbar;
    
    result = (Pbar - PbarE) / (1 - PbarE);
    
    console.log({
            matrix: matrix,
            n: n,
            N: N,
            k: k,
            p: p,
            P: P,
            Pbar: Pbar,
            PbarE: PbarE,
            result: result
        }, result);
    return result;
};