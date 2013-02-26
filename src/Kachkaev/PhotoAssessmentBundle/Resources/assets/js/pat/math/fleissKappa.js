namespace('pat.math');

pat.math.fleissKappa = function(matrix, needToCheckMatrix) {
    var N = matrix.length;              // subjects
    var k = matrix[0].length;           // categories
    var n = pat.math.arraySum(matrix[0]);        // raters
 
    // checking data matrix
    if (needToCheckMatrix) {
        for(var i = matrix.length - 1; i >= 1 ; --i){
            
            if(matrix[i].length != k){
                exit(0);
                throw new Error('Number of categories must be equal');
            }
            
            if(pat.math.arraySum(matrix[i])!=n){
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
    var Pbar = pat.math.arraySum(P) / N;

    // Computing PbarE
    var PbarE = 0;
    for(var j = k - 1; j >= 0; --j){
        PbarE += p[j] * p[j];
    }

    // FIXME return result instead of Pbar
    //return Pbar;
    
    if (PbarE == 1) {
        result = 1;
        //console.log('spec. case')
    } else {
        result = (Pbar - PbarE) / (1 - PbarE);
    }
    return result;
    
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