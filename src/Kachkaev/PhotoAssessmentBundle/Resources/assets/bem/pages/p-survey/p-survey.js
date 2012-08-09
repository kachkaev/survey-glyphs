$(function(){

	var apiURL = "/api/";
	
	$bQuestionnaire = $('.b-survey-questionnaire');
	
	/* ===================================
	 * Loading photo queue
	 */
	var loadQueue = function(source) {
		// It is assumed that the user is logged in and has his own queue of photos to answer questions about
		
		// Requesting all photos of the queue
		
		// Sorting the queue
		
		// Displaying the queue
		
		// Taking the first photograph
		var id = 0;
		loadphoto(source, id);
	};

	/* ===================================
	 * Loading photo data
	 */
	var loadPhoto = function(source, id) {
		//Loading photo metadata
		
		// Loading existing answers
		//var url = "photo_survey/";
		
		var answer = {
				"qIsRealPhoto": true,
				"qIsOutdoors": null,
				"qDuringEvent": null,
				"qTimeOfDay": 2,
				"qSubjectPerson" : true,
				"qSubjectMovingObject" : false,
				"qIsLocationCorrect" : false,
				"qDescribesSpace": true,
				"qSpaceAttractive" : false,
		};
		
		$bQuestionnaire.get(0).loadData(answer);
	};
	loadPhoto('flickr', 123);
});