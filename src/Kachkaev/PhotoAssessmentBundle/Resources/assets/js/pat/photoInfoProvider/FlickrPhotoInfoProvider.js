namespace('pat.photoInfoProvider');

pat.photoInfoProvider.FlickrPhotoInfoProvider = function() {
	var apiKey = "cdb83b3afb639b56eb447ec7e23c20a3";
	this._apiURL = "http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key="
			+ apiKey
			+ "&format=json&nojsoncallback=1"
			+ "&photo_id=";
};

pat.photoInfoProvider.FlickrPhotoInfoProvider.prototype = new pat.photoInfoProvider.AbstractPhotoInfoProvider();

pat.photoInfoProvider.FlickrPhotoInfoProvider.prototype._doLoad = function(params, callback) {
	
	var responseToInfo = function(response) {
		var info = {
				source: "flickr"
		};
		if (response && response.photo) {
			// See http://www.flickr.com/services/api/misc.urls.html
			//   & http://www.flickr.com/services/api/explore/flickr.photos.getInfo
			info.permalink = response.photo.urls.url[0]._content;
			info.title = response.photo.title._content;
			info.user = response.photo.owner.username;
			info.status = 0;
			info.timestamp = response.photo.dates.taken;
			if (response.photo.location) {
				info.lon = response.photo.location.longitude;
				info.lat = response.photo.location.latitude;
			}
			info.imgSrc = "http://farm" +
					response.photo.farm + ".staticflickr.com/" +
					response.photo.server + "/" + 
					response.photo.id + "_" + response.photo.secret + "_z.jpg";
		} else {
			info.photoId = params.photoId;
			info.userId = params.userId;
			info.status = 1;
		}
		if (_.isFunction(callback))
			setTimeout(function() { callback.call(this, info); }, 2000);
//			callback.call(this, info);
	};
	
	$.ajax({
		url: this._apiURL + params.photoId,
		success: function(data) {
			responseToInfo(_.isString(data) ? $.parseJSON(data) : data);
		},
		error: function() {
			responseToInfo();
		},
	});
};