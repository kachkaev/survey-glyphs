namespace('pat.config');

pat.config.apiBaseURL = (document.URL.indexOf('p_app_dev.php') != -1) ? '/p_app_dev.php/api/' : '/api/';

pat.config.answerSequencesLength = 7;
pat.config.answerSequences = {};
// pat.config.gridMode = 'standard';
pat.config.gridMode = 'purpose-oriented';

if (pat.config.gridMode == 'standard') {
    pat.config.answerSequences['_default'] = [
              0,    // no
              -42,
              -1,   // hard to say
              -43,
              1,    // yes
              -44,
              null  // n/a
          ];
    
     // Special case: time of day
     pat.config.answerSequences['qTimeOfDay'] = [
             2,    // night
             1,    // twilight
             -1,   // hard to say
             -42,
             0,    // day
             -43,
             null  // n/a
         ];
     pat.config.questions = [
                             'qIsRealPhoto',
                             'qIsOutdoors',
                             'qTimeOfDay',
                             'qSubjectTemporal',
                             'qSubjectPeople',
                             'qIsByPedestrian',
                             'qIsSpaceAttractive'
                         ];

} else {
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
                            'qIsRealPhoto',
                            'qSubjectPeople',
                            'qIsOutdoors',
                            'qTimeOfDay',
                            'qSubjectTemporal',
                            'qIsByPedestrian',
                            'qIsSpaceAttractive'
                        ];

}

pat.config.answerNA = null;

pat.config.answers = {
        'qIsRealPhoto':       [-1, 0, 1],
        'qSubjectPeople':     [-1, 0, 1],
        'qIsOutdoors':        [-1, 0, 1],
        'qTimeOfDay':         [-1, 0, 1, 2],
        'qSubjectTemporal':   [-1, 0, 1],
        'qIsByPedestrian':    [-1, 0, 1],
        'qIsSpaceAttractive': [-1, 0, 1]
    };

pat.config.dependentQuestionDisabling = {
        qIsRealPhoto: {
            '0': ['qIsOutdoors', 'qTimeOfDay', 'qTimeOfYear', 'qSubjectTemporal', 'qSubjectPeople', 'qIsLocationCorrect', 'qIsByPedestrian', 'qIsSpaceAttractive']
        },
        qIsOutdoors: {
            '0': ['qDuringEvent', 'qTimeOfDay', 'qTimeOfYear', 'qSubjectTemporal', 'qIsLocationCorrect', 'qIsByPedestrian', 'qIsSpaceAttractive']
        }
    };

pat.getAnswerSeq = function(question) {
    return pat.config.answerSequences[question] || pat.config.answerSequences['_default'];
};
//pat.config.flatLinesInTimeScaling = true;
//pat.config.applyPaddingToTimeBaseline = false;

pat.config.lang = {};

pat.config.lang.hintQuestions = {
        'qIsRealPhoto': 'real photo',
        'qIsOutdoors': 'outdoors',
        'qTimeOfDay': 'daytime',
        'qSubjectTemporal': 'subject temporal',
        'qSubjectPeople': 'people',
        'qIsByPedestrian': 'by pedestrian',
        'qIsSpaceAttractive': 'attractive'
   };

/* color brewer set 2 7 */
pat.config.faceAlgorithmNames = ['opencvfront', 'opencvfrontalt', 'opencvfrontalt2', 'opencvfrontalttree', 'opencvprofile'];
pat.config.faceAlgorithmColors = ['#66C2A5', '#FC8D62','#8DA0CB', '#E78AC3', '#A6D854', '#FFD92F', '#E5C494'];