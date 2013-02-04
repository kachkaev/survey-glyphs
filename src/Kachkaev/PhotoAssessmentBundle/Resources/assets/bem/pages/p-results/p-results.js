(function() {
    
var LOCALSTORAGE_PREFIX = 'interface.p-results.';
var LOCALSTORAGE_PARAMETER_LISTHEIGHT = LOCALSTORAGE_PREFIX + 'listheight';
var LOCALSTORAGE_PARAMETER_USERID     = LOCALSTORAGE_PREFIX + 'userid';
var LOCALSTORAGE_PARAMETER_PHOTOID    = LOCALSTORAGE_PREFIX + 'photoid';
var LIST_DEFAULT_HEIGHT = 300;

var USER_SPECTRUM_MAX = 20;
var PHOTO_SPECTRUM_MAX = 5;
var DEFAULT_MAX_TIME = 60;

var PHOTO_RESPONSE_ALL = -42; // used as key for all response counts
var PHOTO_RESPONSE_UNANSWERED = 0;
var PHOTO_RESPONSE_INCOMPLETE = 1;
var PHOTO_RESPONSE_COMPLETE = 2;
var PHOTO_RESPONSE_PHOTO_PROBLEM = 0x10;

var MARK_AS_READ_DELAY = 2000;

// TODO replace with D3 palletess
// Info lists colouring
var COLORSCHEME_USER = {
        0: ['ebf7fa', new Rainbow().setNumberRange(0, USER_SPECTRUM_MAX).setSpectrum('c0e0e8', '7ab1bf', '428696')],
        1: ['faeeee', new Rainbow().setNumberRange(0, USER_SPECTRUM_MAX).setSpectrum('F7D9D9', 'd88282')]
};

var COLORSCHEME_PHOTO = {
        0: ['ebfaef', new Rainbow().setNumberRange(0, PHOTO_SPECTRUM_MAX).setSpectrum('c0e8c2', '7abf8a', '429756')],
        1: ['faeeee', new Rainbow().setNumberRange(0, PHOTO_SPECTRUM_MAX).setSpectrum('F7D9D9', 'd88282')]
};

// List of parameters in PhotoResponse that are answers to questions
// (projected on y axis in b-photoresponsepattern)
var questions = [
    "qIsRealPhoto",
    "qIsOutdoors",
    "qTimeOfDay",
    "qSubjectTemporal",
    "qSubjectPeople",
    "qIsByPedestrian",
    "qIsSpaceAttractive"
];

$(function(){
    if (!$(document.body).hasClass("p-results"))
        return;
    
    // fix chrome + jquery position margin: 0 auto bug
    pat.fixWebkitJqueryPositionBug();
    
    // Read defaults from localstorage
    var defaultListHeight = localStorage.getItem(LOCALSTORAGE_PARAMETER_LISTHEIGHT) || LIST_DEFAULT_HEIGHT;
    
    var defaultUserId = localStorage.getItem(LOCALSTORAGE_PARAMETER_USERID);
    if (!data.users[defaultUserId]) {
        defaultUserId = null;
    }
    var defaultPhotoId = localStorage.getItem(LOCALSTORAGE_PARAMETER_PHOTOID);
    if (!data.photos[defaultPhotoId]) {
        defaultPhotoId = null;
    }


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
    
    // Update users' "unread" property
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
    // Helpers
    // =====================================

    // Finds the color in the pallete matching n and returns it
    var numberToColor = function(pallete, n) {
        if (!n)
            return '#' + pallete[0];
        return '#' + pallete[1].colorAt(n);
    };

    
    // Sends a new value of status for a photo / user / photoresponse to the server
    var setStatusFunction = function($infoList, data, status) {
        $.ajax({
            url: apiBaseURL + 'set_' + data.type + '_status',
            data: {s: backdoorSecret, id: data.id, status: status},
            type: "POST",
            success: function(ajaxData) {
                data.status = ajaxData.response.new_value;
                if (data.type == 'user')
                    data.isUnread = false;
                $infoList.bInfoList('updateItems', [data.id]);
            },
            error: function() {
                console.log('Failed updating status', data);
            }
        });
    };
    
    // Toggles status function
    var toggleStatusFunction = function(event) {
        var $this = $(this);
        var data = $this.data('data');
        setStatusFunction($this.parents('.b-infolist'), data, data.status == 0 ? 1 : 0);
    };
    
    // =====================================
    // Objects with no UI
    // =====================================

    // Photo info providers
    var photoInfoProviders = {
            flickr: new pat.photoInfoProvider.FlickrPhotoInfoProvider(),
            geograph: new pat.photoInfoProvider.GeographPhotoInfoProvider(),
            panoramio: new pat.photoInfoProvider.PanoramioPhotoInfoProvider()
        };

    // =====================================
    // Objects with UI
    // =====================================

    // Info lists
    //// Users
    var $bUserInfoList = $('.b-infolist_user')
        .height(defaultListHeight)
        .bInfoList({
            items: data.users,
            dblclickAction: toggleStatusFunction,
            sortModes: ['id', 'completed', 'problems', 'unread'],
            customizeItem: function($item, id, data) {
                if (data.photoResponseCounts[PHOTO_RESPONSE_ALL] == 0)
                    return false;
                $item.css('backgroundColor', numberToColor(COLORSCHEME_USER[data.status], data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE]));
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
    
    //// Photos
    var $bPhotoInfoList = $('.b-infolist_photo')
        .height(localStorage.getItem(LOCALSTORAGE_PARAMETER_LISTHEIGHT) || LIST_DEFAULT_HEIGHT)
        .bInfoList({
            items: data.photos,
            dblclickAction: toggleStatusFunction,
            customizeItem: function($item, id, data) {
                $item.css('backgroundColor', numberToColor(COLORSCHEME_PHOTO[data.status], data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE]));
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
    
    // Titles above captions
    var $bListCaptionUser = $('.p-results__listcaption__user');
    var $bListCaptionPhoto = $('.p-results__listcaption__photo');
    

    // Patterns
    //// Users
    var $bPhotoResponsePatternUser = $('.b-photoresponsepattern_user').bphotoresponsepattern({
        questions: questions,
        photoResponseEqualityParameter: 'photoId',
        maxTime: DEFAULT_MAX_TIME,
    });
    //// Photos
    var $bPhotoResponsePatternPhoto = $('.b-photoresponsepattern_photo').bphotoresponsepattern({
        questions: questions,
        photoResponseEqualityParameter: 'userId',
        maxTime: DEFAULT_MAX_TIME,
    });

    //// Box with photo
    var $bPhoto = $('.b-survey-photo').bsurveyphoto();
    
    
    // =====================================
    // Object Events
    // =====================================

    // When current item is changed in the user info list
    $bUserInfoList.on('binfolistchangeitem', function(event, ui) {
        var userId = ui.id;
        
        // Save user id to localstorage
        localStorage.setItem(LOCALSTORAGE_PARAMETER_USERID, userId);

        // Update user caption
        $bListCaptionUser.text(userId ? 'User ' + userId : '');
        
        // Hide patterns if nothing is selected
        if (userId === null) {
            $bPhotoResponsePatternUser.bphotoresponsepattern('option', 'photoResponses', []);
            return
        }

        var user = ui.itemData;

        // Show patterns when something is selected
        $bPhotoResponsePatternUser.bphotoresponsepattern('option', 'photoResponses', user.photoResponses);
        
        // Mark user as "read" after some time if current selected item does not get change quickly
        var userStatus = user.status;
        if (user.isUnread) {
            setTimeout(function() {
                if ($bUserInfoList.bInfoList('option','currentId') == userId && userStatus == user.status) {
                    setStatusFunction($bUserInfoList, user, user.status);
                }
            }, MARK_AS_READ_DELAY);
        }
    });
    
    // When current item is changed in the photo info list
    $bPhotoInfoList.on('binfolistchangeitem', function(event, ui) {
        var photoId = ui.id;

        // Save photo id to localstorage
        localStorage.setItem(LOCALSTORAGE_PARAMETER_PHOTOID, photoId);

        // Update photo caption
        $bListCaptionPhoto.text(photoId ? 'Photo ' + photoId : '');

        // Hide photo and patterns if nothing is selected
        if (photoId === null) {
            $bPhotoResponsePatternPhoto.bphotoresponsepattern('option', 'photoResponses', []);
            $bPhoto.bsurveyphoto('showNothing');
            return;    
        }

        // Show patterns and load photos when something is selected
        var photo = data.photos[photoId];
        $bPhotoResponsePatternPhoto.bphotoresponsepattern('option', 'photoResponses', photo.photoResponses);
        $bPhoto.bsurveyphoto('showLoading');
        photoInfoProviders[photo.source].load(photo, function(info) {
            $bPhoto.bsurveyphoto('showPhotoInfo', info);
        });
    });

    // When both info lists are resized
    var $bothInfoLists = $bUserInfoList.add($bPhotoInfoList);
    $bothInfoLists.on('resize', function(event, ui) {
        // Save the new value of info lists as a localstorage value
        localStorage.setItem(LOCALSTORAGE_PARAMETER_LISTHEIGHT, ui.size.height);
        $bothInfoLists.height(ui.size.height);
        
    });
    
    // When a line in user pattern is hovered
    $bPhotoResponsePatternUser.on('bphotoresponsepatterncontexthover', function(event, ui) {
        $bPhotoInfoList.bInfoList('setHighlightedItemIds', _.map(ui.photoResponses, function(pr) {return pr.photoId;}));
    });

    // When a line in photo pattern is hovered
    $bPhotoResponsePatternPhoto.on('bphotoresponsepatterncontexthover', function(event, ui) {
        $bUserInfoList.bInfoList('setHighlightedItemIds', _.map(ui.photoResponses, function(pr) {return pr.userId;}));
    });

    // When a line in user pattern is clicked 
    $bPhotoResponsePatternPhoto.on('bphotoresponsepatterncontextclick', function(event, ui) {
        $bUserInfoList.bInfoList('setCurrentItemId', ui.photoResponses[0].userId);
    });
    // When a line in photo pattern is clicked 
    $bPhotoResponsePatternUser.on('bphotoresponsepatterncontextclick', function(event, ui) {
        $bPhotoInfoList.bInfoList('setCurrentItemId', ui.photoResponses[0].photoId);
    });

    var $bothPhotoresponsePatterns = $bPhotoResponsePatternUser.add($bPhotoResponsePatternPhoto);
    

    // =====================================
    // Global keys
    // =====================================

    $(document.body).bind("keydown", function(event) {
        var key = event.keyCode || event.which;
        
        switch (key) {
        case 27:
            $bUserInfoList.bInfoList('setCurrentItemId', null);
            $bPhotoInfoList.bInfoList('setCurrentItemId', null);
            return false;
            
        // t for toggling time/question scaling
        case 84:
            if (!event.altKey && !event.metaKey && !event.ctrlKey) {
                $bothPhotoresponsePatterns.bphotoresponsepattern('option', 'timeScaling', !$bothPhotoresponsePatterns.bphotoresponsepattern('option', 'timeScaling'));
                return false;
            } else {
                return;
            }
            
        case KEY_BACKSPACE:
            return false;
            
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
    
    $bUserInfoList .bInfoList('setCurrentItemId', defaultUserId);
    $bPhotoInfoList.bInfoList('setCurrentItemId', defaultPhotoId);
});
}());