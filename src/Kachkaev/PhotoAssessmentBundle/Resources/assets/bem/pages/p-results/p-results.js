(function() {
    
var LOCALSTORAGE_PREFIX = 'interface.p-results.';
var LOCALSTORAGE_STATE = LOCALSTORAGE_PREFIX + 'state';
var LIST_DEFAULT_HEIGHT = 300;

var USER_SPECTRUM_MAX = 50;
var PHOTO_SPECTRUM_MAX = 10;
var DEFAULT_MAX_TIME = 60;

var PHOTO_RESPONSE_ALL = -42; // used as key for all response counts
var PHOTO_RESPONSE_UNANSWERED = 0;
var PHOTO_RESPONSE_INCOMPLETE = 1;
var PHOTO_RESPONSE_COMPLETE = 2;
var PHOTO_RESPONSE_PHOTO_PROBLEM = 0x10;

var MARK_AS_READ_DELAY = 2000;

// TODO replace with D3 palettes
// Info lists colouring
var SMALL_NUMBER = 0.00000001;

var COLORSCHEME_USER_COMPLETED = {
        0: d3.scale.linear()
            .domain([0, SMALL_NUMBER, USER_SPECTRUM_MAX])
            .range(['#ebf7fa', '#c0e0e8', '#428696']),
        1: d3.scale.linear()
            .domain([0, SMALL_NUMBER, USER_SPECTRUM_MAX])
            .range(['#fbe3e2', '#F7D9D9', '#cf827c'])
};
var COLORSCHEME_PHOTO_COMPLETED = {
        0: d3.scale.linear()
            .domain([0, SMALL_NUMBER, PHOTO_SPECTRUM_MAX/2, PHOTO_SPECTRUM_MAX])
            .range(['#ebfaef', '#c0e8c2', '#7abf8a', '#429756']),
        1: d3.scale.linear()
            .domain([0, SMALL_NUMBER, PHOTO_SPECTRUM_MAX])
            .range(['#fbe3e2', '#F7D9D9', '#d88282'])
};
var COLORSCHEME_PHOTO_LUMINANCE = {
        0: d3.scale.linear()
            .domain([0, SMALL_NUMBER, 0.1, 5])
            .range(['#eee', 'hsl(265, 31%, 35%)', 'hsl(0, 0, 65%)', 'rgb(255,255,204)'])
            .clamp(true)
            ,
        1: d3.scale.linear()
            .domain([0, 1])
            .range(['#F7D9D9', '#F7D9D9'])
            .clamp(true)
};
var COLORSCHEME_PHOTO_SOURCE = {
        'flickr': '#FBB4AE',
        'panoramio': '#B3CDE3',
        'geograph': '#CCEBC5'
};

var c1 = '#ffffff';
var c2 = '#01665E';

var COLORSCHEME_PHOTO_TIME = {
        0: d3.scale.linear()
            .domain([-100500, 0, 60*3, 60*9, 60*12, 60*15, 60*21, 60*24]) // Minutes
            .range(['#eee', c2, c2, c1, c1, c1, c2, c2])
            .clamp(true)
            ,
        1: d3.scale.linear()
            .domain([0, 60*3, 60*9, 60*12, 60*15, 60*21, 60*24]) // Minutes
            .range(['#300', '#300', '#f99', '#f99', '#f99', '#300', '#300'])
            .clamp(true)
};

var COLORSCHEME_PHOTO_FACES = {
        0: d3.scale.linear()
            .domain([0, 1])
            .range(['#fff', '#9EBCDA'])
            .clamp(true)
            ,
        1: d3.scale.linear()
            .domain([0, 1])
            .range(['#f00', '#000'])
            .clamp(true)
};

$(function(){
    if (!$(document.body).hasClass("p-results"))
        return;
    
    // fix chrome + jquery position margin: 0 auto bug
    pat.fixWebkitJqueryPositionBug();
    
    var stateContainer = {
            state: null
    };
    
    
    // =====================================
    // Read state from localstorage or restore it from defaults
    // =====================================

    var defaultState = {
        infolistHeight: LIST_DEFAULT_HEIGHT,
        
        userSortOrder: 'id',
        photoSortOrder: 'id',
        
        disableThumbnails: true,
        timeScaling: false,
        maxTime: DEFAULT_MAX_TIME,
        userId: null,
        photoId: null,
        infolistViewModeThumbnailType: pat.InfolistThumbnailGenerator.TYPE_RESPONSES,
        infolistViewModeShowProblems: true,
        infolistViewModeShowUnchecked: true,
        infolistViewModeBackgroundVariable: 0
    };
    
    if (localStorage[LOCALSTORAGE_STATE]) {
        try {
            stateContainer.state = _.extend({}, defaultState, JSON.parse(localStorage[LOCALSTORAGE_STATE]));
        } catch (e) {
        }
    }
    if (!stateContainer.state) {
        stateContainer.state = _.clone(defaultState);
    }
    
    if (!data.users[stateContainer.state.userId]) {
        stateContainer.state.userId = null;
    }
    
    if (!data.photos[stateContainer.state.photoId]) {
        stateContainer.state.photoId = null;
    }
    
    stateContainer.stateManager = new ObjectPropertyStateManager(stateContainer, 'state', LOCALSTORAGE_STATE);
    stateContainer.stateManager.capture();
    
    var updateState = function(newState) {
        stateContainer.state = _.extend({}, stateContainer.state, newState);
        stateContainer.stateManager.capture();
    };
    
    // =====================================
    // “Fix” some answers
    // =====================================
    // If there is a question answer restricting another question,
    // make sure that dependent questions are all answered as N/A
    _.each(data.photoResponses, function(photoResponse) {
        // DEBUG
//        if (photoResponse.duration < 1) {
//            photoResponse.duration = Math.floor(10 + Math.random()*10);
//        }
        _.each(pat.config.questions, function(question) {
           if (pat.config.dependentQuestionDisabling[question]) {
               var answerAsString = '' + photoResponse[question];
               var questionsToDisable = pat.config.dependentQuestionDisabling[question][answerAsString];
               _.each(questionsToDisable, function(questionsToDisable) {
                   photoResponse[questionsToDisable] = null;
               });
           };
           if (photoResponse[question] !== null) {
               photoResponse[question] = parseInt(photoResponse[question]);
           }
       });
    });

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
    
    var faceBundleNames = ['faces500'];
    _.each(data.photos, function(photo) {
        photo.type = 'photo';
        photo.photoResponseCounts = {};
        photo.photoResponseCounts[PHOTO_RESPONSE_ALL] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_UNANSWERED] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_INCOMPLETE] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] = 0;
        photo.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] = 0;
        photo.photoResponses = [];
        
        // Parse face rects in photos
        for (var i = faceBundleNames.length - 1; (faceBundleName = faceBundleNames[i]) && i >= 0; --i) {
            var unparsedFacesAsArray = photo[faceBundleName].split('|');
            var parsedFaces = {count: 0};
            
            for(var j = unparsedFacesAsArray.length - 1; j >= 0; --j) {
                var currentAlgorithmEncodedFacesAsStr = unparsedFacesAsArray[j];
                parsedFaces[j] = [];
                if (!currentAlgorithmEncodedFacesAsStr || currentAlgorithmEncodedFacesAsStr == 'x') {
                    continue;
                }
                var currentAlgorithmEncodedFaces = currentAlgorithmEncodedFacesAsStr.match(/.{2}/g);
                for (var faceCount = currentAlgorithmEncodedFaces.length/4 - 1; faceCount >= 0; --faceCount) {
                    var faceCenterX = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 0], 16) / 255;
                    var faceCenterY = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 1], 16) / 255;
                    var faceWidth   = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 2], 16) / 255;
                    var faceHeight  = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 3], 16) / 255;
                    parsedFaces[j].push([faceCenterX, faceCenterY, faceWidth, faceHeight]);
                    parsedFaces.count++;
                }
            }
            
            photo[faceBundleName] = parsedFaces;
        }
    });
    
    _.each(data.photoResponses, function(photoResponse) {
        photoResponse.type = 'photoResponse';

        var user = data.users[photoResponse['userId']];
        var photo = data.photos[photoResponse['photoId']]; 
       
        if (!user || !photo)
           return;
       
        // Responses for rejected photos are not shown and counted for the users
        if (photoResponse.status != PHOTO_RESPONSE_COMPLETE || photo.status == 0) {
            user.photoResponses.push(photoResponse);
            user.photoResponseCounts[PHOTO_RESPONSE_ALL] += 1;
            user.photoResponseCounts[photoResponse.status] += 1;
        }
       
        // Responses by banned users are not shown and counted for the photos
        if (photoResponse.status != PHOTO_RESPONSE_COMPLETE || user.status == 0) {
            photo.photoResponses.push(photoResponse);
            photo.photoResponseCounts[PHOTO_RESPONSE_ALL] += 1;
            photo.photoResponseCounts[photoResponse.status] += 1;
        }
       
        // Answers string → int
        // TODO check why we've got strings, not ints
        _.each(pat.config.questions, function(question) {
           if (photoResponse[question] !== null) {
               photoResponse[question] = parseInt(photoResponse[question]);
           }
       });
    });
    
    // Update users' "unchecked" property
    _.each(data.users, function(user) {
        var statusCheckedAt = user.statusCheckedAt; 
        if (!user.statusCheckedAt) {
            user.isUnchecked = true;
            return;
        }
        user.isUnchecked = false;
        _.each(user.photoResponses, function(photoResponse) {
            if (photoResponse.submittedAt > statusCheckedAt) {
                user.isUnchecked = true;
                return false;
            }
        });
    });

    
    // =====================================
    // Helpers
    // =====================================

    // Sends a new value of status for a photo / user / photoresponse to the server
    var setStatusFunction = function($infoList, data, status) {
        $.ajax({
            url: pat.config.apiBaseURL + 'set_' + data.type + '_status',
            data: {s: backdoorSecret, id: data.id, status: status},
            type: "POST",
            success: function(ajaxData) {
                data.status = ajaxData.response.new_value;
                if (data.type == 'user')
                    data.isUnchecked = false;
                $infoList.binfolist('updateItems', [data.id]);
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
    
    //// Photos
    var $bPhotoInfoList = $('.b-infolist_photo')
        .height(stateContainer.state.infolistHeight)
        .binfolist({
            items: _.toArray(data.photos),
            dblclickAction: toggleStatusFunction,
            maxSortLevels: 6,
            sortModes: [
                        'id',
                        'completed',
                        'problems',
                        'status',
                        'duration-avg',
                        'duration-med',
                        'agreement',
                        'entropy',
                        'suitability-avg',
                        
                        'suitability-q0-avg',
                        'suitability-q1-avg',
                        'suitability-q2-avg',
                        'suitability-q3-avg',
                        'suitability-q4-avg',
                        'suitability-q5-avg',
                        'suitability-q6-avg',

                        'suitability-med',
                        'suitability-q0-med',
                        'suitability-q1-med',
                        'suitability-q2-med',
                        'suitability-q3-med',
                        'suitability-q4-med',
                        'suitability-q5-med',
                        'suitability-q6-med',
                        'source',
                        'time-of-day',
                        'time-from-noon',
                        'luminance'

                    ],
            sortOrder: stateContainer.state.photoSortOrder,
            viewModeThumbnailType: stateContainer.state.infolistViewModeThumbnailType,
            viewModeShowProblems: stateContainer.state.infolistViewModeShowProblems,
            viewModeShowUnchecked: stateContainer.state.infolistViewModeShowUnchecked,
            viewModeBackgroundVariable: stateContainer.state.infolistViewModeBackgroundVariable,
            customizeItem: function($item, id, data, options) {
                if (options.viewModeBackgroundVariable == 1) {
                    $item.css('backgroundColor', COLORSCHEME_PHOTO_COMPLETED[data.status](data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE]));
                } else if (options.viewModeBackgroundVariable == 2) {
                    $item.css('backgroundColor', COLORSCHEME_PHOTO_LUMINANCE[data.status](data.luminance));
                } else if (options.viewModeBackgroundVariable == 3) {
                    $item.css('backgroundColor', COLORSCHEME_PHOTO_SOURCE[data.source]);
                } else if (options.viewModeBackgroundVariable == 4) {
                    var timeTaken = data.dateTaken % 86400 / 60;
                    if (data.source == 'geograph')
                        timeTaken = -100500;
                    $item.css('backgroundColor', COLORSCHEME_PHOTO_TIME[data.status](timeTaken));
                } else if (options.viewModeBackgroundVariable == 5) {
                    $item.css('backgroundColor', COLORSCHEME_PHOTO_FACES[data.status](Math.max(0,data.faces500.length - 9)));
                }
                $item.removeClass('status_0 status_1');
                $item.addClass('status_' + data.status);
                $item.toggleClass('photo_problem', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 0);
                $item.toggleClass('photo_problem_severe', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1);
    
                var hint = 'Photo ' + id + ' (' + _.capitalize(data.source) + '): ' + data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] + ' completed';
                if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM]) {
                    hint += ' / ' + data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] + ' photo problem';
                    if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1) {
                        hint += 's';
                    }
                };
                $item.data('hint', hint);
            }
        });
    
    //// Users
    var $bUserInfoList = $('.b-infolist_user')
        .height(stateContainer.state.infolistHeight)
        .binfolist({
            items: _.toArray(data.users),
            dblclickAction: toggleStatusFunction,
            sortModes: [
                        'id',
                        'completed',
                        'problems',
                        'status',
                        'unchecked',
                        'duration-avg',
                        'duration-med',
                        'agreement',
                        'entropy'
                    ],

            sortOrder: stateContainer.state.userSortOrder,
            viewModeThumbnailType: stateContainer.state.infolistViewModeThumbnailType,
            viewModeShowProblems: stateContainer.state.infolistViewModeShowProblems,
            viewModeShowUnchecked: stateContainer.state.infolistViewModeShowUnchecked,
            viewModeBackgroundVariable: stateContainer.state.infolistViewModeBackgroundVariable,
            customizeItem: function($item, id, data, options) {
                if (data.photoResponseCounts[PHOTO_RESPONSE_ALL] == 0)
                    return false;
                if (options.viewModeBackgroundVariable == 1) {
                    $item.css('backgroundColor', COLORSCHEME_USER_COMPLETED[data.status](data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE]));
                }
                $item.removeClass('status_0 status_1');
                $item.addClass('status_' + data.status);
                $item.toggleClass('photo_problem', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 0);
                $item.toggleClass('photo_problem_severe', data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1);
                $item.toggleClass('unchecked', data.isUnchecked);
                
                var hint = 'User ' + id + ': ' + data.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] + ' completed';
                if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM]) {
                    hint += ' / ' + data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] + ' photo problem';
                    if (data.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] > 1) {
                        hint += 's';
                    }
                        
                };
                $item.data('hint', hint);
            }
        });

    
    // Titles above captions
    var $bListCaptionUser = $('.p-results__listcaption__user');
    var $bListCaptionPhoto = $('.p-results__listcaption__photo');
    

    // Patterns
    //// Users
    var $bPhotoResponsePatternUser = $('.b-photoresponsepattern_user').bphotoresponsepattern({
        questions: pat.config.questions,
        photoResponseEqualityParameter: 'photoId',
        timeScaling: stateContainer.state.timeScaling,
        maxTime: stateContainer.state.maxTime
    });
    //// Photos
    var $bPhotoResponsePatternPhoto = $('.b-photoresponsepattern_photo').bphotoresponsepattern({
        questions: pat.config.questions,
        photoResponseEqualityParameter: 'userId',
        timeScaling: stateContainer.state.timeScaling,
        maxTime: stateContainer.state.maxTime
    });

    //// Box with photo
    var $bPhoto = $('.b-survey-photo').bsurveyphoto();
    
    
    // =====================================
    // Object Events
    // =====================================

    // When selected item is changed in the user info list
    $bUserInfoList.on('binfolistchangeselecteditemid', function(event, ui) {
        var userId = ui.newValue;
        
        // Update user caption
        $bListCaptionUser.text(userId ? 'User ' + userId : '');
        
        // Hide patterns if nothing is selected
        if (userId === null) {
            $bPhotoResponsePatternUser.bphotoresponsepattern('option', 'photoResponses', []);
            return
        }

        var user = data.users[userId];

        // Show patterns when something is selected
        $bPhotoResponsePatternUser.bphotoresponsepattern('option', 'photoResponses', user.photoResponses);
        
        // Mark user as "read" after some time if selected item does not get change quickly
        var userStatus = user.status;
        if (user.isUnchecked) {
            setTimeout(function() {
                if ($bUserInfoList.binfolist('option','selectedItemId') == userId && userStatus == user.status) {
                    setStatusFunction($bUserInfoList, user, user.status);
                }
            }, MARK_AS_READ_DELAY);
        }
        
        updateState({userId: userId});
    });
    
    // When selected item is changed in the photo info list
    $bPhotoInfoList.on('binfolistchangeselecteditemid', function(event, ui) {
        var photoId = ui.newValue;

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
        
        updateState({photoId: photoId});
    });

    // When sorting has hanged in the user info list
    $bUserInfoList.on('binfolistresortitems', function(event, ui) {
        updateState({userSortOrder: ui.sortOrder});
    });
    
    // When sorting has hanged in the photo info list
    $bPhotoInfoList.on('binfolistresortitems', function(event, ui) {
        updateState({photoSortOrder: ui.sortOrder});
    });

    // When both info lists are resized
    var $bothInfoLists = $bUserInfoList.add($bPhotoInfoList);
    $bothInfoLists.on('resize', function(event, ui) {
        $bothInfoLists.binfolist('option', 'height', ui.size.height);
    });

    $bothInfoLists.on('resizestop', function(event, ui) {
        // Save the new value of info lists as a localstorage value
        updateState({infolistHeight: ui.size.height});
    });
    

    // When an item in user list is hovered
    $bUserInfoList.on('binfolisthoveroveritem', function(event, ui) {
        $bPhotoInfoList.binfolist('option', 'highlightedItemsIds', ui.itemData ? _.map(ui.itemData.photoResponses, function(pr) {return pr.photoId;}) : null);
    });
    
    // When an item in photo list is hovered
    $bPhotoInfoList.on('binfolisthoveroveritem', function(event, ui) {
        $bUserInfoList.binfolist('option', 'highlightedItemsIds', ui.itemData ? _.map(ui.itemData.photoResponses, function(pr) {return pr.userId;}) : null);
    });

    // When a line in user pattern is hovered
    $bPhotoResponsePatternUser.on('bphotoresponsepatterncontexthover', function(event, ui) {
        $bPhotoInfoList.binfolist('option', 'highlightedItemsIds', _.map(ui.photoResponses, function(pr) {return pr.photoId;}));
    });

    // When a line in photo pattern is hovered
    $bPhotoResponsePatternPhoto.on('bphotoresponsepatterncontexthover', function(event, ui) {
        $bUserInfoList.binfolist('option', 'highlightedItemsIds', _.map(ui.photoResponses, function(pr) {return pr.userId;}));
    });

    // When a line in user pattern is clicked
    $bPhotoResponsePatternUser.on('bphotoresponsepatterncontextclick', function(event, ui) {
        // Look at selected id and select an id following it in the list of responses
        var selectedId = $bPhotoInfoList.binfolist('option', 'selectedItemId');
        var ids = _.sortBy(_.map(ui.photoResponses, function(o){return o.photoId;}), function(n){ return n + 0;});
        var selectedIdIndex = _.indexOf(ids, selectedId);
        updateState({photoId: selectedIdIndex == -1 ? ids[0] : ids[(selectedIdIndex + 1) % ids.length]});
    });

    // When a line in photo pattern is clicked 
    $bPhotoResponsePatternPhoto.on('bphotoresponsepatterncontextclick', function(event, ui) {
        // Look at selected id and select an id following it in the list of responses
        var selectedId = $bUserInfoList.binfolist('option', 'selectedId');
        var ids = _.sortBy(_.map(ui.photoResponses, function(o){return o.userId;}), function(n){ return n + 0;});
        var selectedIdIndex = _.indexOf(ids, selectedId);
        updateState({userId: selectedIdIndex == -1 ? ids[0] : ids[(selectedIdIndex + 1) % ids.length]});
    });

    var $bothPhotoresponsePatterns = $bPhotoResponsePatternUser.add($bPhotoResponsePatternPhoto);
    

    // =====================================
    // Global keys
    // =====================================

    $(document.body).bind("keydown", function(event) {
        var key = event.keyCode || event.which;
        //console.log('key pressed', key);
        
        switch (key) {

        // t for toggling thumbnails (previews)
        case 49:
        case 50:
            if (!event.altKey && !event.metaKey && !event.ctrlKey) {
                updateState({infolistViewModeBackgroundVariable: 0, infolistViewModeThumbnailType: (key == 49) ? pat.InfolistThumbnailGenerator.TYPE_RESPONSES : pat.InfolistThumbnailGenerator.TYPE_FACES});
                return false;
            } else {
                return;
            }

        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
            if (!event.altKey && !event.metaKey && !event.ctrlKey) {
                updateState({infolistViewModeBackgroundVariable: key - 50, infolistViewModeThumbnailType: pat.InfolistThumbnailGenerator.TYPE_NONE});
                return false;
            } else {
                return;
            }

        // ESC to unselect 
        case 27:
            updateState({userId: null, photoId: null});
            return false;
            
        // p for toggling photo problems in lists
        case 80:
            if (!event.altKey && !event.metaKey && !event.ctrlKey) {
                updateState({infolistViewModeShowProblems: !stateContainer.state.infolistViewModeShowProblems});
                return false;
            } else {
                return;
            }

        // u for toggling unchecked state in lists
        case 85:
            if (!event.altKey && !event.metaKey && !event.ctrlKey) {
                updateState({infolistViewModeShowUnchecked: !stateContainer.state.infolistViewModeShowUnchecked});
                return false;
            } else {
                return;
            }

        // r to reset interface
        case 82:
            if (!event.altKey && !event.metaKey && !event.ctrlKey) {
                var newState = _.clone(defaultState);
                if (!event.shiftKey) {
                    newState.infolistHeight = stateContainer.state.infolistHeight;
                }
                updateState(newState);
                return false;
            } else {
                return;
            }
            
        // d for toggling duration scaling
        case 68:
            if (!event.altKey && !event.metaKey && !event.ctrlKey) {
                updateState({timeScaling: !stateContainer.state.timeScaling});
                return false;
            } else {
                return;
            }
            
        case KEY_BACKSPACE:
            return false;
            
        // space to reset time
        case 32:
            updateState({maxTime: DEFAULT_MAX_TIME});
            return false;
            
        case KEY_PLUS:
        case KEY_EQUALS:
        case KEY_EQUALS2:
            if (event.metaKey || event.ctrlKey || event.shiftKey) {
                return;
            }
            updateState({maxTime: stateContainer.state.maxTime * 1.25});
            return false;
        case KEY_MINUS:
        case KEY_DASH:
        case KEY_DASH2:
        case KEY_UNDERSCORE:
            if (event.metaKey || event.ctrlKey || event.shiftKey) {
                return;
            }
            updateState({maxTime: stateContainer.state.maxTime * 0.8});
            return false;
            
        case 219:
            stateContainer.stateManager.undo();
            return false;
        case 221:
            stateContainer.stateManager.redo();
            return false;
        }
    });
    
    var onStateUpdated = function() {
        console.log('onStateUpdated', stateContainer.state);
        
        $bPhotoInfoList .binfolist('option', {
            selectedItemId: stateContainer.state.photoId,
            sortOrder: stateContainer.state.photoSortOrder,
            
            height: stateContainer.state.infolistHeight,
            viewModeThumbnailType: stateContainer.state.infolistViewModeThumbnailType,
            viewModeShowProblems: stateContainer.state.infolistViewModeShowProblems,
            viewModeShowUnchecked: stateContainer.state.infolistViewModeShowUnchecked,
            viewModeTimeScaling: stateContainer.state.timeScaling,
            viewModeBackgroundVariable: stateContainer.state.infolistViewModeBackgroundVariable
        });

        $bUserInfoList .binfolist('option', {
            selectedItemId: stateContainer.state.userId,
            sortOrder: stateContainer.state.userSortOrder,
            
            height: stateContainer.state.infolistHeight,
            viewModeThumbnailType: stateContainer.state.infolistViewModeThumbnailType,
            viewModeShowProblems: stateContainer.state.infolistViewModeShowProblems,
            viewModeShowUnchecked: stateContainer.state.infolistViewModeShowUnchecked,
            viewModeTimeScaling: stateContainer.state.timeScaling,
            viewModeBackgroundVariable: stateContainer.state.infolistViewModeBackgroundVariable
        });
        
        $bothPhotoresponsePatterns.bphotoresponsepattern('option', {
            'timeScaling': stateContainer.state.timeScaling,
            'maxTime': stateContainer.state.maxTime
        });
        localStorage[LOCALSTORAGE_STATE] = JSON.stringify(stateContainer.state);
    };
    
    stateContainer.stateManager.queueChanged.add(onStateUpdated);
    onStateUpdated();
});
})();
