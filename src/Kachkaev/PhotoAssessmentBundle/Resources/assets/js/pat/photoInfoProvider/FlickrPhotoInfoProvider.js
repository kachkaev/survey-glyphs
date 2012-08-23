namespace('pat.photoInfoProvider');

pat.photoInfoProvider.FlickrPhotoInfoProvider = function() {
	var apiKey = "cdb83b3afb639b56eb447ec7e23c20a3";
	this._apiURL = "http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key="
			+ apiKey
			+ "&format=json&nojsoncallback=1"
			+ "&photo_id=";
};

pat.photoInfoProvider.FlickrPhotoInfoProvider.prototype = new pat.photoInfoProvider.AbstractPhotoInfoProvider();

pat.photoInfoProvider.FlickrPhotoInfoProvider.prototype._doGetInfo = function(id) {
	
	var info = {};
	var response = {};
	
	$.ajax({
		url: this._apiURL + id,
		async: false,
		success: function(data) {
			response = $.parseJSON(data);
		},
	});

	if (response.photo) {
		// See http://www.flickr.com/services/api/misc.urls.html
		//   & http://www.flickr.com/services/api/explore/flickr.photos.getInfo
		info.permalink = response.photo.urls.url[0]._content;
		info.title = response.photo.title._content;
		info.user = response.photo.owner.username;
		info.status = 0;
		info.timestamp = response.photo.dates.taken;
		info.imgSrc = "http://farm" +
				response.photo.farm + ".staticflickr.com/" +
				response.photo.server + "/" + 
				response.photo.id + "_" + response.photo.secret + "_z.jpg";
	} else {
		info.status = 1;
	}
	//console.log(response);
	console.log(info);
    return info;
};