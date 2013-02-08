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
 * If option.questionId is passed, the measurement is done only by a single question
 * 
 * (average "distance" to the "most suitable" case, which is represented by a straight line aligned to the left)
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getAvgSuitability = function(photoResponses, options) {
    var matrix = this._getAnswerIdMatrix(photoResponses, options);
    if (matrix[0].length == 0) {
        return 100500; // photos with no responses are the least suitable are represented by a big number
    } else {
        var result = 0;
        if (options && options.questionId) {
            result = d3.mean(options.questionId);
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
 * Secondary ordering is done by average (mean)
 * If option.questionId is passed, the measurement is done only by a single question
 *
 * (average "distance" to the "most suitable" case, which is represented by a straight line aligned to the left)
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getMedSuitability = function(photoResponses, options) {
    var matrix = this._getAnswerIdMatrix(photoResponses, options);
    if (matrix[0].length == 0) {
        return 100500; // photos with no responses are the least suitable are represented by a big number
    } else {
        var result = 0;
        if (options && options.questionId) {
            result = d3.median(matrix[options.questionId]) * 1024 + d3.mean(matrix[options.questionId]);
        } else {
            for (var i = pat.config.questions.length - 1; i >= 0; --i) {
                result += d3.median(matrix[i]) * 1024 + d3.mean(matrix[i]);
            }
        }

        return result;
    }
};

/**
 * 
 * @type pat.PhotoResponseListMeasurer
 * @return {Array}
 */
pat.PhotoResponseListMeasurer._getAnswerIdMatrix = function(photoResponses, options) {
    var matrix = [];
    for (var i = pat.config.questions.length - 1; i >= 0; --i) {
        matrix.push([]);
    }
    for (var j = photoResponses.length - 1, pr = photoResponses[j]; j >=0; --j, pr = photoResponses[j]) {
        for (var i = pat.config.questions.length - 1; i >= 0; --i) {
            var question = pat.config.questions[i];
            matrix[i].push(_.indexOf(pat.getAnswerSeq(question), pr[question]));
        };
    }
    return matrix;
};