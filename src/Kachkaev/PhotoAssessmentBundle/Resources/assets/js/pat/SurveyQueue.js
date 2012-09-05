/*

fetchQueue(callback)
//extendQueue(callback)

getQueue()

id: {
	id: replyId 
	status: 0 - unanswered 1 - complete 2 - incomplete 
	answers: {
			....
			}
	photo: {
		id:
		source:
		photoId:
		userId:
		status:
	}
}

getCurrentId()
setCurrentId(id)

getNextPhoto()

getAnswersFor(id)
getPhotoInfoFor(id)

getUnansweredCount()
getIncompleteCount()
getCount()



Events (signals):
updated (queue)
updatedWithError


*/


namespace('pat');

pat.SurveyQueue = function() {
	this._queue = {};
	
	this.updated = new signals.Signal();
	this.updatedWithError = new signals.Signal();
};

var apiBaseURL = "/app_dev.php/api/";
pat.SurveyQueue._apiURLs = {
		get_queue: apiBaseURL+"get_queue",
		submit_response: apiBaseURL+"submit_response",
};

pat.SurveyQueue.prototype.fetchQueue = function() {
	var obj = this;
	
	var parseQueue = function(data) {
		var oldQueue = null;
		var newQueue = null;
		try {
			oldQueue = this._queue;
			newQueue = data.response;
		} catch (e) {
			console.log(e);
			obj.updatedWithError.dispatch();
		};
		if (!_.isEqual(oldQueue, newQueue)) {
			obj._queue = newQueue;
			obj.updated.dispatch(newQueue);
		};
	};
	
	$.ajax({
		url: pat.SurveyQueue._apiURLs['get_queue'],
		type: "POST",
		success: function(data) {
			parseQueue(data);
		},
		error: function() {
			obj.updatedWithError.dispatch();
		},
	});
};

pat.SurveyQueue.prototype.getQueue = function() {
	return this._queue;
};