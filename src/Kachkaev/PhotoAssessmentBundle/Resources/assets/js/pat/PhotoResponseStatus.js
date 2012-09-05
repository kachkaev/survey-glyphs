namespace('pat');

pat.PhotoResponseStatus = {};
pat.PhotoResponseStatus.UNANSWERED = 0;
pat.PhotoResponseStatus.INCOMPLETE = 1;
pat.PhotoResponseStatus.COMPLETE = 2;

pat.PhotoResponseStatus.valueToString = function (status, lowerCase) {
	var result = null;
	$.each(pat.PhotoResponseStatus, function(k, v) {
		if (v === status) {
			result = lowerCase ? k.toLowerCase() : k;
			return false;
		};
	});
	return result;
};