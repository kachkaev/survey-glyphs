namespace('pat');

pat.PhotoResponseListMeasurer = {};

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
 * Returns average duration of responses
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getAvgDuration = function(photoResponses, options) {
    var completeResponsesCount = 0;
    var sum = 0;
    for (var i = photoResponses.length - 1, pr = photoResponses[i]; i >=0; --i, pr = photoResponses[i]) {
        if (pr.duration > 0) {
            sum += pr.duration;
            ++completeResponsesCount;
        }
    }
    return completeResponsesCount ? sum / completeResponsesCount : 0;
};

/**
 * Returns average suitability of responses
 * (average "distance" to the left
 * @type pat.PhotoResponseListMeasurer
 * @return {Number}
 */
pat.PhotoResponseListMeasurer.getAvgSuitability = function(photoResponses, options) {
    var completeResponsesCount = 0;
    var sums = [];
    for (var i = pat.config.questions.length - 1; i >= 0; --i) {
        sums.push(0);
    }
    for (var j = photoResponses.length - 1, pr = photoResponses[j]; j >=0; --j, pr = photoResponses[j]) {
        if (pr.status == pat.PhotoResponseStatus.COMPLETE) {
            ++completeResponsesCount;
            for (var i = pat.config.questions.length - 1; i >= 0; --i) {
                var question = pat.config.questions[i];
                sums[i] += _.indexOf(pat.getAnswerSeq(question), pr[question]);
            };
        }
    }
    if (completeResponsesCount == 0) {
        return 100500; // photos with no responses are the least suitable (have a big number)
    } else {
        var result = 0;
        for (var i = pat.config.questions.length - 1; i >= 0; --i) {
            result += sums[i] / completeResponsesCount;
        }
        return result;
    }
};