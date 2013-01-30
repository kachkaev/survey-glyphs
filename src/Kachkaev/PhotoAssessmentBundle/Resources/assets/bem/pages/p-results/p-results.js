(function() {
    
var listsHeightLocalstorageParameter = 'interface.b-results-infolist.height';
var listsHeightDefaults = 300;

var USER_SPECTRUM_MAX = 20;
var PHOTO_SPECTRUM_MAX = 5;
var DEFAULT_MAX_TIME = 60;

var PHOTO_RESPONSE_ALL = -42; // used as key for all response counts
var PHOTO_RESPONSE_UNANSWERED = 0;
var PHOTO_RESPONSE_INCOMPLETE = 1;
var PHOTO_RESPONSE_COMPLETE = 2;
var PHOTO_RESPONSE_PHOTO_PROBLEM = 0x10;

var MARK_AS_READ_DELAY = 2000;


var questions = [
    "qIsRealPhoto",
    "qIsOutdoors",
    "qTimeOfDay",
    "qSubjectTemporal",
    "qSubjectPeople",
    "qIsByPedestrian",
    "qIsSpaceAttractive"
];

var answers = [
       null,
       -42,
       0,
       1,
       2,
       3,
       -42.2,
       -1
   ];

$(function(){
    if (!$(document.body).hasClass("p-results"))
        return;
    
    // fix chrome + jquery position margin: 0 auto bug
    pat.fixWebkitJqueryPositionBug();

    // =====================================
    // Supplement data with stats
    // =====================================

    _.each(data.users, function(user) {
        user.type = 'user';
        user.photoResponseCounts = {};
        user.photoResponseCounts[PHOTO_RESPONSE_ALL] = 0;
        user.photoResponseCounts[PHOTO_RESPONSE_UNANSWERED] = 0;
        user.photoResponseCounts[PHOTO_RESPONSE_INCOMPLETE] = 0;
        user.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] = 0;
        user.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] = 0;
        user.photoResponses = [];
    });
    _.each(data.photos, function(photo) {
        photo.type = 'photo';
        photo.photoResponseCounts = {};
        photo.photoResponseCounts[PHOTO_RESPONSE_ALL] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_UNANSWERED] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_INCOMPLETE] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] = 0;
        photo.photoResponses = [];
    });
    _.each(data.photoResponses, function(photoResponse) {
        photoResponse.type = 'photoResponse';

        var user = data.users[photoResponse['userId']];
        var photo = data.photos[photoResponse['photoId']]; 
       
        if (!user || !photo)
           return;
       
        user.photoResponses.push(photoResponse);
        user.photoResponseCounts[PHOTO_RESPONSE_ALL] += 1;
        user.photoResponseCounts[photoResponse.status] += 1;
       
        photo.photoResponses.push(photoResponse);
        photo.photoResponseCounts[PHOTO_RESPONSE_ALL] += 1;
        photo.photoResponseCounts[photoResponse.status] += 1;
       
        // Answers string → int
        // TODO check why we've got strings, not ints
        _.each(questions, function(question) {
           if (photoResponse[question] !== null) {
               photoResponse[question] = parseInt(photoResponse[question]);
           }
       });
    });
    
    // Update users' unread property
    _.each(data.users, function(user) {
        var statusCheckedAt = user.statusCheckedAt; 
        if (!user.statusCheckedAt) {
            user.isUnread = true;
            return;
        }
        user.isUnread = false;
        _.each(user.photoResponses, function(photoResponse) {
            if (photoResponse.submittedAt > statusCheckedAt) {
                user.isUnread = true;
                return false;
            }
        });
    });

    // =====================================
    // Objects with UI
    // =====================================

    // Info lists colouring
    var colourSchemeUser = {
            0: ['ebf7fa', new Rainbow().setNumberRange(0, USER_SPECTRUM_MAX).setSpectrum('c0e0e8', '7ab1bf', '428696')],
            1: ['faeeee', new Rainbow().setNumberRange(0, USER_SPECTRUM_MAX).setSpectrum('F7D9D9', 'd88282')]
    };
    
    var colourSchemePhoto = {
            0: ['ebfaef', new Rainbow().setNumberRange(0, PHOTO_SPECTRUM_MAX).setSpectrum('c0e8c2', '7abf8a', '429756')],
            1: ['faeeee', new Rainbow().setNumberRange(0, PHOTO_SPECTRUM_MAX).setSpectrum('F7D9D9', 'd88282')]
    };
    
    var setStatusFunction = function($infoList, data, status) {
        $.ajax({
            url: apiBaseURL + 'set_' + data.type + '_status',
            data: {s: backdoorSecret, id: data.id, status: status},
            type: "POST",
            success: function(ajaxData) {
                data.status = ajaxData.response.new_value;
                data.isUnread = false;
                $infoList.bInfoList('updateItems', [data.id]);
            },
            error: function() {
                console.log('Failed updating status', data);
            }
        });
    };
    
    var toggleStatusFunction = function(event) {
        var $this = $(this);
        var data = $this.data('data');
        setStatusFunction($this.parents('.b-infolist'), data, data.status == 0 ? 1 : 0);
    };
    
    var numberToColor = function(pallete, n) {
        if (!n)
            return '#' + pallete[0];
        return '#' + pallete[1].colorAt(n);
    };
    
    //// Info lists
    ///// Users
    var listsHeight = localStorage.getItem(listsHeightLocalstorageParameter) || listsHeightDefaults;
    var $bUserInfoList = $('.b-infolist_user').height(listsHeight).bInfoList({
        items: data.users,
        dblclickAction: toggleStatusFunction,
        sortModes: ['id', 'completed', 'problems', 'unread'],
        customizeItem: function($item, id, data) {
            if (data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] < 2)
                return false;
            $item.css('backgroundColor', numberToColor(colourSchemeUser[data.status], data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE]));
            $item.toggleClass('photo_problem', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 0);
            $item.toggleClass('photo_problem_severe', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1);
            $item.toggleClass('unread', data.isUnread);
            
            var title = 'User ' + id + ': ' + data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] + ' completed';
            if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM]) {
                title += ' / ' + data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] + ' photo problem';
                if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1) {
                    title += 's';
                }
                    
            };
            $item.attr('title', title);
        },
        });
    
    ////// Photos
    var $bPhotoInfoList = $('.b-infolist_photo').height(listsHeight).bInfoList({
        items: data.photos,
        dblclickAction: toggleStatusFunction,
        customizeItem: function($item, id, data) {
            $item.css('backgroundColor', numberToColor(colourSchemePhoto[data.status], data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE]));
            $item.toggleClass('photo_problem', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 0);
            $item.toggleClass('photo_problem_severe', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1);

            var title = 'Photo ' + id + ': ' + data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] + ' completed';
            if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM]) {
                title += ' / ' + data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] + ' photo problem';
                if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1) {
                    title += 's';
                }
            };
            $item.attr('title', title);
        }
    });
    //// Events shared by both info lists
    var $bothInfoLists = $bUserInfoList.add($bPhotoInfoList);
    
    ///// Resize
    $bothInfoLists.on('resize', function(event, ui) {
        localStorage.setItem(listsHeightLocalstorageParameter, ui.size.height);
        $bothInfoLists.height(ui.size.height);
        
    });
    
    ///// mouseChanged
    $bUserInfoList.on('binfolistchangeitem', function(event, ui) {
        var userId = ui.id;
        var userData = ui.itemData;
        var userStatus = userData.status;
        if (userData.isUnread) {
            setTimeout(function() {
                if ($bUserInfoList.bInfoList('option','currentId') == userId && userStatus == userData.status) {
                    setStatusFunction($bUserInfoList, userData, userData.status);
                }
            }, MARK_AS_READ_DELAY);
        }
    });


    //// Patterns
    var $bPhotoResponsePatternUser = $('.b-photoresponsepattern_user').bphotoresponsepattern({
        questions: questions,
        answers: answers,
        maxTime: DEFAULT_MAX_TIME,
    });
    var $bPhotoResponsePatternPhoto = $('.b-photoresponsepattern_photo').bphotoresponsepattern({
        questions: questions,
        answers: answers,
        maxTime: DEFAULT_MAX_TIME
    });
    var $bothPhotoresponsePatterns = $bPhotoResponsePatternUser.add($bPhotoResponsePatternPhoto);

    //// Box with photo
    var $bPhoto = $('.b-survey-photo').bsurveyphoto();
    
    // =====================================
    // Objects with no UI
    // =====================================
    //// info providers
    var photoInfoProviders = {
            flickr: new pat.photoInfoProvider.FlickrPhotoInfoProvider(),
            geograph: new pat.photoInfoProvider.GeographPhotoInfoProvider(),
            panoramio: new pat.photoInfoProvider.PanoramioPhotoInfoProvider()
        };
    // =====================================
    // Functions
    // =====================================

    // Preloads info for next photo
    // -------------------------------------
//    var preloadNextPhoto = function() {
//        var nextIncompleteId = surveyQueue.getNextIncompleteId();
//        if (nextIncompleteId !== null) {
//            var nextPhotoResponseInQueue = surveyQueue.get(nextIncompleteId);
//            photoInfoProviders[nextPhotoResponseInQueue.photo.source].load(nextPhotoResponseInQueue.photo, function(info) {
//                if (info.imgSrc)
//                    $.preload(info.imgSrc);
//            });
//        }
//    };

    // Goes to the next photo
    // -------------------------------------
//    var gotoNextPhoto = function() {
//        if (surveyQueue.getUnansweredOrIncompleteCount() <= 2) {
//            $bSurveyDashboard.bsurveydashboard("setCurrentItemId", surveyQueue.getFirstIncompleteId(true));
//            surveyQueue.extendQueue();
//        } else {
//            $bSurveyDashboard.bsurveydashboard("setCurrentItemId", surveyQueue.getFirstIncompleteId(true));
//        }
//    };
//    surveyQueue.extended.add(function(){
//        preloadNextPhoto();
//    });

    
    // Saves answers
//    // -------------------------------------
//    var saveAnswers = function() {
//        if (!$bQuestionnaire.bsurveyquestionnaire('option', 'disabled') || $bPhoto.bsurveyphoto('isShowingError')) {
//            var photoResponse = $bQuestionnaire.bsurveyquestionnaire('getAnswers');
//            if ($bPhoto.bsurveyphoto('isShowingError')) {
//                photoResponse.status = pat.PhotoResponseStatus.PHOTO_PROBLEM;
//            } else {
//                if ($bQuestionnaire.bsurveyquestionnaire('isComplete'))
//                    photoResponse.status = pat.PhotoResponseStatus.COMPLETE;
//                else {
//                    photoResponse.status = $bQuestionnaire.bsurveyquestionnaire('isUnanswered') ? pat.PhotoResponseStatus.UNANSWERED : pat.PhotoResponseStatus.INCOMPLETE;
//                }
//            };
//            surveyQueue.setPhotoResponseFor(surveyQueue.getCurrentId(), photoResponse);
//        }
//    };
//    
//    // Submits questionnaire
//    // -------------------------------------
//    var submitQuestionnaire = function() {
//        gotoNextPhoto();
//    };
//
//    // Submits questionnaire only if complete or forced
//    // -------------------------------------
//    var submitQuestionnaireIfCompleteOrError = function(event) {
//        if ($bQuestionnaire.bsurveyquestionnaire('option', 'disabled') && !$bPhoto.bsurveyphoto('isShowingError'))
//            return;
//        if (/*event.shiftKey || */ $bPhoto.bsurveyphoto('isShowingError') || $bQuestionnaire.bsurveyquestionnaire('isComplete'))
//            submitQuestionnaire();
//        else {
//            //str = "Questinnaire is incomplete. Hold shift pressed to force submitting it.";
//            $questionnaireHint.stop(true, true).text(lang.str['hint.questionnaire_incomplete']).fadeIn(0).delay(2000).fadeOut(2000);
//            $bQuestionnaire.bsurveyquestionnaire('blinkFirstMissingAnswer');
//        }
//    };
    
    // =====================================
    // Bindings
    // =====================================
    $bUserInfoList.on('binfolistchangeitem', function(event, ui) {
        var userId = ui.id;
        if (userId === null) {
            $bPhotoResponsePatternUser.bphotoresponsepattern('option', 'photoResponses', []);
            return
        }
        var user = data.users[userId];

        $bPhotoResponsePatternUser.bphotoresponsepattern('option', 'photoResponses', user.photoResponses);
    });
    
    $bPhotoInfoList.on('binfolistchangeitem', function(event, ui) {
        var photoId = ui.id;
        if (photoId === null) {
            $bPhoto.bsurveyphoto('showNothing');
            $bPhotoResponsePatternPhoto.bphotoresponsepattern('option', 'photoResponses', []);
            return;    
        }
        var photo = data.photos[photoId];
        
        $bPhotoResponsePatternPhoto.bphotoresponsepattern('option', 'photoResponses', photo.photoResponses);

        $bPhoto.bsurveyphoto('showLoading');
        
        photoInfoProviders[photo.source].load(photo, function(info) {
            $bPhoto.bsurveyphoto('showPhotoInfo', info);
        });
    });

    // Global keys
    // -------------------------------------
    $(document.body).bind("keydown", function(event) {
        var key = event.keyCode || event.which;
        
        switch (key) {
        case 27:
            $bUserInfoList.bInfoList('setCurrentItemId', null);
            $bPhotoInfoList.bInfoList('setCurrentItemId', null);
            return false;
            
        // t for toggling time/question scaling
        case 84:
            $bothPhotoresponsePatterns.bphotoresponsepattern('option', 'timeScaling', !$bothPhotoresponsePatterns.bphotoresponsepattern('option', 'timeScaling'));
            return false;
            
        case KEY_BACKSPACE:
            return false;
////            photoSurveyIdHistoryNewCandidate = null;
////            if (photoSurveyIdHistory.length) {
////                saveAnswers();
////                var newId = photoSurveyIdHistory.shift();
////                surveyQueue.setCurrentId(newId);
////            };
////            return false;
            
        // space to reset time
        case 32:
            $bothPhotoresponsePatterns.bphotoresponsepattern('option', 'maxTime', 20);
            return false;
            
        case KEY_PLUS:
        case KEY_EQUALS:
        case KEY_EQUALS2:
            $bothPhotoresponsePatterns.bphotoresponsepattern('option', 'maxTime', $bothPhotoresponsePatterns.bphotoresponsepattern('option', 'maxTime') * 1.25);
            return false;
        case KEY_MINUS:
        case KEY_DASH:
        case KEY_DASH2:
        case KEY_UNDERSCORE:
            $bothPhotoresponsePatterns.bphotoresponsepattern('option', 'maxTime', $bothPhotoresponsePatterns.bphotoresponsepattern('option', 'maxTime') * 0.8);
            return false;
        }
    });
    

    // =====================================
    // Starting it all up!
    // =====================================
    //surveyQueue.fetchQueue();

});
}());