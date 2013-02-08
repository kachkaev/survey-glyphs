function fleissKappa(matrix) {
    var subjects = matrix.length;              // subjects
    var categories = matrix[0].length;         // categories
    var raters = d3.sum(matrix[0]);            // raters
 
    for(var q = 1; q < matrix.length; q++){
 
        if(matrix[q].length != categories){
            exit(0);
            throw new Error('Number of categories must be equal');
        }
 
        if(d3.sum(matrix[q])!=raters){
            throw new Error('Number of raters must be equal');
        }
 
    }
 
    var pj = [];
    var pi = [];
 
    for(var j = subjects - 1; j >= 0; --j){
        pi.push(0);
    }
 
    for(var i = categories - 1; i >=0; --i){
 
        tpj = 0;
 
        for(var j = subjects - 1; j >= 0; --j){
            tpj += matrix[j][i];
            pi[j] +=  matrix[j][i]*matrix[j][i];
        }
 
        pj[i] = tpj/(raters*subjects);
    }
 
    for(var j = 0; j < subjects; j++){
        pi[j] = pi[j]-raters;
        pi[j] = pi[j]*(1/(raters*(raters-1)));
    }
 
    var pcarret = d3.sum(pi)/subjects;
    var pecarret = 0;
 
    for(var i = pj.length - 1; i >=0; --i){
        pecarret += pj[i]*pj[i];
    }
 
    kappa = (pcarret-pecarret)/(1-pecarret);
 
    return kappa;
};