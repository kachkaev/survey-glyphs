namespace('pat.photoInfoProvider');

pat.photoInfoProvider.GeographPhotoInfoProvider = function() {
	this._baseURL = "/content/geograph/";
};

pat.photoInfoProvider.GeographPhotoInfoProvider.prototype = new pat.photoInfoProvider.AbstractPhotoInfoProvider();

pat.photoInfoProvider.GeographPhotoInfoProvider.prototype._doLoad = function(params, callback) {
	var info = {
			source: "geograph",
			id: params.photoId,
			user: params.userName,
			permalink: "http://www.geograph.org.uk/photo/" + params.photoId,
			status: 0,
			imgSrc: this._baseURL + params.photoId + ".jpg",
			lon: params.lon,
			lat: params.lat
	};
	
	if (_.isFunction(callback))
		callback.call(this, info);
};