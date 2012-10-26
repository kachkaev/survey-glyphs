$(function(){
	if (!$(document.body).hasClass("p-survey"))
		return;
	// =====================================
	// Objects with UI
	// =====================================
	//// Dashboard
	var $bSurveyDashboard = $('.b-survey-dashboard').bsurveydashboard();
	//// Questionnarie
	var $bQuestionnaire = $('.b-survey-questionnaire').bsurveyquestionnaire();
	$bQuestionnaire.bsurveyquestionnaire('option', 'disabled', true);
	//// Box with photo
	var $bPhoto = $('.b-survey-photo').bsurveyphoto();
	// Controls
	var $bSurveyControls = $('.b-survey-controls').show();
	//// "Next"
	var $iButtonNext = $('.i-button-next');
	
	//// hint near the "Next" button
	var $questionnaireHint = $('.b-survey-controls__hint');
	$questionnaireHint.css('marginRight', $('.b-survey-controls__buttons').width());
	
	// =====================================
	// Objects with no UI
	// =====================================
	//// queue
	var surveyQueue = new pat.SurveyQueue();
	//// info providers
	var photoInfoProviders = {
			flickr: new pat.photoInfoProvider.FlickrPhotoInfoProvider(),
			geograph: new pat.photoInfoProvider.GeographPhotoInfoProvider(),
			panoramio: new pat.photoInfoProvider.PanoramioPhotoInfoProvider()
		};
	//// History of opened photo responses
	var photoSurveyIdHistory = [];
	var photoSurveyIdHistoryNewCandidate = null;
	// =====================================
	// Functions
	// =====================================

	// Preloads info for next photo
	// -------------------------------------
	var preloadNextPhoto = function() {
		var nextIncompleteId = surveyQueue.getNextIncompleteId();
		if (nextIncompleteId !== null) {
			var nextPhotoResponseInQueue = surveyQueue.get(nextIncompleteId);
			photoInfoProviders[nextPhotoResponseInQueue.photo.source].load(nextPhotoResponseInQueue.photo, function(info) {
				if (info.imgSrc)
					$.preload(info.imgSrc);
			});
		}
	};

	// Goes to the next photo
	// -------------------------------------
	var gotoNextPhoto = function() {
		if (surveyQueue.getUnansweredOrIncompleteCount() <= 2) {
			$bSurveyDashboard.bsurveydashboard("setCurrentItemId", surveyQueue.getFirstIncompleteId(true));
			surveyQueue.extendQueue();
		} else {
			$bSurveyDashboard.bsurveydashboard("setCurrentItemId", surveyQueue.getFirstIncompleteId(true));
		}
	};
	surveyQueue.extended.add(function(){
		preloadNextPhoto();
	});

	
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
				if (photoResponse.status == pat.PhotoResponseStatus.PHOTO_PROBLEM) {
					photoResponse.status = pat.PhotoResponseStatus.UNANSWERED;
				}
				$bQuestionnaire.bsurveyquestionnaire('option', 'disabled', false);
				$bQuestionnaire.bsurveyquestionnaire('focus');
			} else {
				var tempId = photoResponse.id;
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
	
	// Queue
	// -------------------------------------
	//// Updating dashboard when queue is updated
	surveyQueue.updated.add(function(queue, listOfIDs) {
		$bSurveyDashboard.bsurveydashboard("updateItems", queue, surveyQueue.getCurrentId());
	});
	
	//// Selecting first incomplete element on first load
	var onFirstQueueUpdate = null;
	onFirstQueueUpdate = function () {
		gotoNextPhoto();
		surveyQueue.updated.remove(onFirstQueueUpdate);
	};
	surveyQueue.updated.add(onFirstQueueUpdate);
	
	///// Error handling: API failure
	surveyQueue.updatedWithError.add(function() {
		if (confirm(lang.str["message.error_api"])) {
			document.location.reload();
		}
	});
	
	//// Changing current selected item in dashboard when currentId is changed in the queue
	surveyQueue.changedCurrentId.add(function(newId) {
		if (!_.isNull(photoSurveyIdHistoryNewCandidate))
			photoSurveyIdHistory.unshift(photoSurveyIdHistoryNewCandidate);
		photoSurveyIdHistoryNewCandidate = newId;
		$bSurveyDashboard.bsurveydashboard("setCurrentItemId", newId);
		showPhotoResponse(surveyQueue.get(newId));
	});

	// Dashboard affects on the current id in the queue
	// -------------------------------------
	$bSurveyDashboard.bind("bsurveydashboardchangeitem", function(event, ids) {
		if (ids["idFrom"] !== null)
			saveAnswers();
		surveyQueue.setCurrentId(ids["idTo"]);
	});
	
	// "Next" button press
	// -------------------------------------
	$iButtonNext.bind('click', function(event) {
		submitQuestionnaireIfCompleteOrError(event);
		return false;
	});
	
	// Global keys
	// -------------------------------------
	$(document.body).bind("keydown", function(event) {
		var key = event.keyCode || event.which;
		switch (key) {
		case KEY_ENTER:
			submitQuestionnaireIfCompleteOrError(event);
			return false;
		case KEY_BACKSPACE:
			return false;
//			photoSurveyIdHistoryNewCandidate = null;
//			if (photoSurveyIdHistory.length) {
//				saveAnswers();
//				var newId = photoSurveyIdHistory.shift();
//				surveyQueue.setCurrentId(newId);
//			};
//			return false;
		case KEY_PLUS:
		case KEY_EQUALS:
		case KEY_EQUALS2:
			$bQuestionnaire.bsurveyquestionnaire('zoomMapIn');
			return false;
		case KEY_MINUS:
		case KEY_DASH:
		case KEY_DASH2:
		case KEY_UNDERSCORE:
			$bQuestionnaire.bsurveyquestionnaire('zoomMapOut');
			return false;
		}
	});
	

	// =====================================
	// Starting it all up!
	// =====================================
	surveyQueue.fetchQueue();

});