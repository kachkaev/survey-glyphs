(function() {
    
var listsHeightLocalstorageParameter = 'interface.b-results-infolist.height';
var listsHeightDefaults = 300;

$(function(){
	if (!$(document.body).hasClass("p-results"))
		return;
	
	// =====================================
	// Objects with UI
	// =====================================

	// Info lists heights
	
	//// Info lists
	var listsHeight = localStorage.getItem(listsHeightLocalstorageParameter) || listsHeightDefaults;
	var $userInfoList = $('.b-infolist_user').height(listsHeight).bInfoList({
	        items: data.users,
	        customizeItem: function($item, id, data) {
	            $item.removeClass('b-infolist__item_status_0 b-infolist__item_status_1');
	            $item.addClass('b-infolist__item_status_' + data.status);
	        }
        });
	var $photoInfoList = $('.b-infolist_photo').height(listsHeight).bInfoList({
        items: data.photos,
        customizeItem: function($item, id, data) {
            //$item.removeClass
        }
    });
	var $bothInfoLists = $userInfoList.add($photoInfoList);
	$bothInfoLists.on('resize', function(event, ui) {
	    localStorage.setItem(listsHeightLocalstorageParameter, ui.size.height);
	    $bothInfoLists.height(ui.size.height);
	    
	});

	//// Box with photo
	var $photo = $('.b-survey-photo').bsurveyphoto();
	
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
//	var preloadNextPhoto = function() {
//		var nextIncompleteId = surveyQueue.getNextIncompleteId();
//		if (nextIncompleteId !== null) {
//			var nextPhotoResponseInQueue = surveyQueue.get(nextIncompleteId);
//			photoInfoProviders[nextPhotoResponseInQueue.photo.source].load(nextPhotoResponseInQueue.photo, function(info) {
//				if (info.imgSrc)
//					$.preload(info.imgSrc);
//			});
//		}
//	};

	// Goes to the next photo
	// -------------------------------------
//	var gotoNextPhoto = function() {
//		if (surveyQueue.getUnansweredOrIncompleteCount() <= 2) {
//			$bSurveyDashboard.bsurveydashboard("setCurrentItemId", surveyQueue.getFirstIncompleteId(true));
//			surveyQueue.extendQueue();
//		} else {
//			$bSurveyDashboard.bsurveydashboard("setCurrentItemId", surveyQueue.getFirstIncompleteId(true));
//		}
//	};
//	surveyQueue.extended.add(function(){
//		preloadNextPhoto();
//	});

	
	// Saves answers
	// -------------------------------------
	var saveAnswers = function() {
		if (!$bQuestionnaire.bsurveyquestionnaire('option', 'disabled') || $bPhoto.bsurveyphoto('isShowingError')) {
			var photoResponse = $bQuestionnaire.bsurveyquestionnaire('getAnswers');
			if ($bPhoto.bsurveyphoto('isShowingError')) {
				photoResponse.status = pat.PhotoResponseStatus.PHOTO_PROBLEM;
			} else {
				if ($bQuestionnaire.bsurveyquestionnaire('isComplete'))
					photoResponse.status = pat.PhotoResponseStatus.COMPLETE;
				else {
					photoResponse.status = $bQuestionnaire.bsurveyquestionnaire('isUnanswered') ? pat.PhotoResponseStatus.UNANSWERED : pat.PhotoResponseStatus.INCOMPLETE;
				}
			};
			surveyQueue.setPhotoResponseFor(surveyQueue.getCurrentId(), photoResponse);
		}
	};
	
	// Submits questionnaire
	// -------------------------------------
	var submitQuestionnaire = function() {
		gotoNextPhoto();
	};

	// Submits questionnaire only if complete or forced
	// -------------------------------------
	var submitQuestionnaireIfCompleteOrError = function(event) {
		if ($bQuestionnaire.bsurveyquestionnaire('option', 'disabled') && !$bPhoto.bsurveyphoto('isShowingError'))
			return;
		if (/*event.shiftKey || */ $bPhoto.bsurveyphoto('isShowingError') || $bQuestionnaire.bsurveyquestionnaire('isComplete'))
			submitQuestionnaire();
		else {
			//str = "Questinnaire is incomplete. Hold shift pressed to force submitting it.";
			$questionnaireHint.stop(true, true).text(lang.str['hint.questionnaire_incomplete']).fadeIn(0).delay(2000).fadeOut(2000);
			$bQuestionnaire.bsurveyquestionnaire('blinkFirstMissingAnswer');
		}
	};
	

	// Loads photo response
	// -------------------------------------
	var showPhotoResponse = function(photoResponse) {
		//Loading photo metadata
		
		// Loading existing answers
		//var url = "photo_survey/";
		
		$bQuestionnaire.bsurveyquestionnaire('setAnswers', {});
		$bQuestionnaire.bsurveyquestionnaire('option', 'disabled', true);
		$bPhoto.bsurveyphoto('showLoading');
		
		photoInfoProviders[photoResponse.photo.source].load(photoResponse.photo, function(info) {
			$bPhoto.bsurveyphoto('showPhotoInfo', info);
			var answers = $.extend({}, photoResponse);
			answers.givenLon = info.lon;
			answers.givenLat = info.lat;
			$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers);
			if (!$bPhoto.bsurveyphoto('isShowingError')) {
				if (answers.status == pat.PhotoResponseStatus.PHOTO_PROBLEM) {
					answers.status = pat.PhotoResponseStatus.UNANSWERED;
				}
				$bQuestionnaire.bsurveyquestionnaire('option', 'disabled', false);
				$bQuestionnaire.bsurveyquestionnaire('focus');
			} else {
				var tempId = answers.id;
				$(document).oneTime(5000, function() {
					if (surveyQueue.getCurrentId() == tempId)
						submitQuestionnaire();
				});
			}
		});
		
		preloadNextPhoto();
	};

	// =====================================
	// Bindings
	// =====================================
	
	
	// "Next" button press
	// -------------------------------------
//	$iButtonNext.bind('click', function(event) {
//		submitQuestionnaireIfCompleteOrError(event);
//		return false;
//	});
//	
//	// Global keys
//	// -------------------------------------
//	$(document.body).bind("keydown", function(event) {
//		var key = event.keyCode || event.which;
//		switch (key) {
//		case KEY_ENTER:
//			submitQuestionnaireIfCompleteOrError(event);
//			return false;
//		case KEY_BACKSPACE:
//			return false;
////			photoSurveyIdHistoryNewCandidate = null;
////			if (photoSurveyIdHistory.length) {
////				saveAnswers();
////				var newId = photoSurveyIdHistory.shift();
////				surveyQueue.setCurrentId(newId);
////			};
////			return false;
//		case KEY_PLUS:
//		case KEY_EQUALS:
//		case KEY_EQUALS2:
//			$bQuestionnaire.bsurveyquestionnaire('zoomMapIn');
//			return false;
//		case KEY_MINUS:
//		case KEY_DASH:
//		case KEY_DASH2:
//		case KEY_UNDERSCORE:
//			$bQuestionnaire.bsurveyquestionnaire('zoomMapOut');
//			return false;
//		}
//	});
	

	// =====================================
	// Starting it all up!
	// =====================================
	//surveyQueue.fetchQueue();

});
}());