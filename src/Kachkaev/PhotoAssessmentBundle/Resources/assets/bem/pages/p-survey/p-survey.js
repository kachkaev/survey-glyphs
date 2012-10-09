$(function(){

	// =====================================
	// Objects with UI
	// =====================================
	//// Dashboard
	var $bSurveyDashboard = $('.b-survey-dashboard').bsurveydashboard();
	//// Questionnarie
	var $bQuestionnaire = $('.b-survey-questionnaire').bsurveyquestionnaire();
	//// Box with photo
	var $bPhoto = $('.b-survey-photo').bsurveyphoto();
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
			panoramio: new pat.photoInfoProvider.PanoramioPhotoInfoProvider()
		};
	//// History of opened photo responses
	var photoSurveyIdHistory = [];
	var photoSurveyIdHistoryNewCandidate = null;
	// =====================================
	// Functions
	// =====================================

	// Goes to the next photo
	// -------------------------------------
	var gotoNextPhoto = function() {
		if (surveyQueue.getUnansweredCount() == 0) {
			if (confirm('Thanks a lot for your help! Would you like to see some more photographs?')) {
				surveyQueue.extendQueue();
			}
		} else {
			surveyQueue.setCurrentId(surveyQueue.getNextIncompleteId());
		}
	};
	surveyQueue.extended.add(function(){
		surveyQueue.setCurrentId(surveyQueue.getNextId());
	});

	
	// Loads photo response
	// -------------------------------------
	var showPhotoResponse = function(photoResponse) {
		//Loading photo metadata
		
		// Loading existing answers
		//var url = "photo_survey/";
		
		//$bQuestionnaire.bsurveyquestionnaire('option', 'disabled', 'true');
		$bPhoto.bsurveyphoto('showLoading');
		
		photoInfoProviders[photoResponse.photo.source].load(photoResponse.photo, function(info) {
			$bPhoto.bsurveyphoto('showPhotoInfo', info);
			var answers = $.extend({}, photoResponse);
			answers.givenLon = info.lon;
			answers.givenLat = info.lat;
			$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers);
			//$bQuestionnaire.bsurveyquestionnaire('option', 'disabled', 'false');
		});

		// Preloading info for next photo
		var nextPhotoResponseInQueue = surveyQueue.get(surveyQueue.getNextIncompleteId());
		photoInfoProviders[nextPhotoResponseInQueue.photo.source].load(nextPhotoResponseInQueue.photo, function(info) {
			if (info.imgSrc)
				$.preload(info.imgSrc);
		});
	};

	// Saves answers
	// -------------------------------------
	var saveAnswers = function() {
		var photoResponse = $bQuestionnaire.bsurveyquestionnaire('getAnswers');
		if ($bPhoto.bsurveyphoto('isShowingError')) {
			photoResponse.status = pat.PhotoResponseStatus.PHOTO_PROBLEM;
		} else {
			photoResponse.status = $bQuestionnaire.bsurveyquestionnaire('isComplete') ? pat.PhotoResponseStatus.COMPLETE : pat.PhotoResponseStatus.INCOMPLETE;
		};
		surveyQueue.setPhotoResponseFor(surveyQueue.getCurrentId(), photoResponse);
	};
	
	// Submits questionnaire
	// -------------------------------------
	var submitQuestionnaire = function() {
		saveAnswers();
		gotoNextPhoto();
	};

	// Submits questionnaire only if complete or forced
	// -------------------------------------
	var submitQuestionnaireIfCompleteOrForced = function(event) {
		if (event.shiftKey || $bQuestionnaire.bsurveyquestionnaire('isComplete'))
			submitQuestionnaire();
		else {
			str = "Questinnaire is incomplete. Hold shift pressed to force submitting it.";
			$questionnaireHint.stop(true, true).text(str).fadeIn(0).delay(2000).fadeOut(2000);
			$bQuestionnaire.bsurveyquestionnaire('blinkFirstMissingAnswer');
		}
	};
	
	// =====================================
	// Bindings
	// =====================================
	
	// Queue
	// -------------------------------------
	//// Updating dashboard when queue is updated
	surveyQueue.updated.add(function(queue, listOfIDs) {
		$bSurveyDashboard.bsurveydashboard("updateItems", queue, listOfIDs);
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
		//TODO Show proper error message
		console.log("Oh no, API returned an error!");
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
	$bSurveyDashboard.bind("bsurveydashboardchangeitem", function(event, id) {
//		saveAnswers();
		surveyQueue.setCurrentId(id);
	});
	
	// "Next" button press
	// -------------------------------------
	$iButtonNext.bind('click', function(event) {
		submitQuestionnaireIfCompleteOrForced(event);
		return false;
	});
	
	// Global keys
	// -------------------------------------
	$(document.body).bind("keydown", function(event) {
		var key = event.keyCode || event.which;
		switch (key) {
		case KEY_ENTER:
			submitQuestionnaireIfCompleteOrForced(event);
			return false;
		case KEY_BACKSPACE:
			photoSurveyIdHistoryNewCandidate = null;
			if (photoSurveyIdHistory.length) {
				saveAnswers();
				var newId = photoSurveyIdHistory.shift();
				surveyQueue.setCurrentId(newId);
			};
			return false;
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