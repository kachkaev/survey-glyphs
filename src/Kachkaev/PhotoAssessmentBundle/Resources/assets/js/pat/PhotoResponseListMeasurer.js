namespace('pat');

pat.PhotoResponseListMeasurer = {};

/**
 * Returns average (mean) duration of responses
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getAvgDuration = function(photoResponses, options) {
    var consideredResponsesCount = 0;
    var sum = 0;
    for (var i = photoResponses.length - 1, pr = photoResponses[i]; i >=0; --i, pr = photoResponses[i]) {
        if (pr.duration > 0) {
            sum += pr.duration;
            ++consideredResponsesCount;
        }
    }
    return consideredResponsesCount ? sum / consideredResponsesCount : 0;
};

/**
 * Returns median duration of responses
 * @type pat.PhotoResponseListMeasurer
 */
pat.PhotoResponseListMeasurer.getMedDuration = function(photoResponses, options) {
    var durations = [];
    for (var i = photoResponses.length - 1, pr = photoResponses[i]; i >=0; --i, pr = photoResponses[i]) {
        if (pr.duration > 0) {
            durations.push(pr.duration);
        }
    };
    return d3.median(durations);
};

/**
 * Returns average suitability of responses
 * If option.questionIndex is passed, the measurement is done only by a single question
 * 
 * (average "distance" to the "most suitable" case, which is represented by a straight line aligned to the left)
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getAvgSuitability = function(photoResponses, options) {
    var matrix = this._getAnswerIndexMatrix(photoResponses, false, options);
    if (matrix[0].length == 0) {
        return 100500; // photos with no responses are the least suitable are represented by a big number
    } else {
        var result = 0;
        if (options && options.questionIndex) {
            result = d3.mean(matrix[options.questionIndex]);
        } else {
            for (var i = pat.config.questions.length - 1; i >= 0; --i) {
                result += d3.mean(matrix[i]);
            }
        }
        return result;
    }
};

/**
 * Returns median suitability of responses
 * If option.questionIndex is passed, the measurement is done only by a single question
 *
 * (average "distance" to the "most suitable" case, which is represented by a straight line aligned to the left)
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getMedSuitability = function(photoResponses, options) {
    var matrix = this._getAnswerIndexMatrix(photoResponses, false, options);
    if (matrix[0].length == 0) {
        return 100500; // photos with no responses are the least suitable are represented by a big number
    } else {
        var result = 0;
        if (options && options.questionIndex) {
            //console.log(options.questionIndex, matrix[options.questionIndex], matrix);
            result = d3.median(matrix[options.questionIndex]);
        } else {
            for (var i = pat.config.questions.length - 1; i >= 0; --i) {
                result += d3.median(matrix[i]);
            }
        }

        return result;
    }
};

/**
 * Returns agreement which is represented by fleiss kappa value
 * If option.questionIndex is passed, the measurement is done only by a single question
 *
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getAgreement = function(photoResponses, options) {
    var matrix = this._getAnswerIndexMatrix(photoResponses, true, options);
    var fleissKappaValue = fleissKappa(matrix);
    //console.log(matrix, fleissKappaValue);
    return -fleissKappaValue;
};

/**
 * Depending on arrangeByClasses returns
 * - a matrix of answer indexes of the responses (question count * response count)
 *   this form of a matrix is used for calculating median, mean, standard deviation
 * - a matrix of answer indexes classes with numbers of answers in each class (question count * answer sequences length)
 *   this form of a matrix is used in the Fleiss' Kappa algorithm
 * @type pat.PhotoResponseListMeasurer
 * @return {Array}
 */
pat.PhotoResponseListMeasurer._getAnswerIndexMatrix = function(photoResponses, arrangeByClasses, options) {
    
    var matrix = [];
    for (var i = pat.config.questions.length - 1; i >= 0; --i) {
        var matrixElem = [];
        if (arrangeByClasses) {
            for (var j = pat.config.answerSequencesLength - 1; j >=0; --j) {
                matrixElem.push(0);
            }
        }
        matrix.push(matrixElem);
    }
    
    for (var j = photoResponses.length - 1, pr = photoResponses[j]; j >=0; --j, pr = photoResponses[j]) {
        for (var i = pat.config.questions.length - 1; i >= 0; --i) {
            var question = pat.config.questions[i];
            var answerIndex = _.indexOf(pat.getAnswerSeq(question), pr[question]);
            if (arrangeByClasses) {
                ++matrix[i][answerIndex];
            } else {
                matrix[i].push(answerIndex);
            }
        };
    }
    return matrix;
};