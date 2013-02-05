namespace('pat.config');

pat.config.apiBaseURL = (document.URL.indexOf('p_app_dev.php') != -1) ? "/p_app_dev.php/api/" : "/api/";

pat.config.answerSequencesLength = 7;
pat.config.answerSequences = {};
pat.config.answerSequences['_default'] = [
         1,    // yes
         -42,
         -1,   // hard to say
         -43,
         0,    // no
         -44,
         null  // n/a
     ];

// Reversed questions
pat.config.answerSequences['qSubjectTemporal'] = [
        0,    // no
        -42,
        -1,   // hard to say
        -43,
        1,    // yes
        -44,
        null  // n/a
    ];
pat.config.answerSequences['qSubjectPeople'] = pat.config.answerSequences['qSubjectTemporal'];

// Special case: time of day
pat.config.answerSequences['qTimeOfDay'] = [
        0,    // day
        1,    // twilight
        -1,   // hard to say
        -42,
        2,    // night
        -43,
        null  // n/a
    ];

pat.config.questions = [
         "qIsRealPhoto",
         "qIsOutdoors",
         "qTimeOfDay",
         "qSubjectTemporal",
         "qSubjectPeople",
         "qIsByPedestrian",
         "qIsSpaceAttractive"
     ];

pat.getAnswerSeq = function(question) {
    return pat.config.answerSequences[question] || pat.config.answerSequences['_default'];
};