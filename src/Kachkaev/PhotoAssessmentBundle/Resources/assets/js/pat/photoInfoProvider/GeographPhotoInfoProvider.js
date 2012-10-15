namespace('pat.photoInfoProvider');

pat.photoInfoProvider.GeographPhotoInfoProvider = function() {
	this._baseURL = "/content/geograph/";
};

pat.photoInfoProvider.GeographPhotoInfoProvider.prototype = new pat.photoInfoProvider.AbstractPhotoInfoProvider();

pat.photoInfoProvider.GeographPhotoInfoProvider.prototype._doLoad = function(params, callback) {
	var info = {
			source: "geograph",
			id: params.id,
			user: params.userName,
			permalink: "http://www.geograph.org.uk/photo/" + params.id,
			status: 0,
			imgSrc: this._baseURL + params.id + ".jpg",
	};
	
	if (_.isFunction(callback))
		callback.call(this, info);
};