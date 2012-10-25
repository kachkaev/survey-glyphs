/**
 * Takes photo info and displays it
 * 
 * Show photo: $elem.bsurveyphoto('showPhotoInfo', info);
 * Show loading: $elem.bsurveyphoto('showLoading');
 * Show loading: $elem.bsurveyphoto('showNothing');
 */
$.widget('ui.bsurveyphoto', {

	_init: function() {
		var preloaderImg = '/static/i/b-survey-photo__loader.gif';
		var defaultHeight = 400;
		
		var w = {
				_self: this,
				$element: this.element
			};
		this.w = w;
		
		w.lastInfoHeight = defaultHeight;
		
		w.$info = $('<a class="b-survey-photo__info" target="_blank"/>');
		w.$infoPhoto = $('<img class="b-survey-photo__photo" />').appendTo(w.$info);
		w.$infoTitle = $('<span class="b-survey-photo__title" />');//.appendTo(w.$info);
		w.$infoTimestampanduser = $('<span class="b-survey-photo__timestampanduser" />').appendTo(w.$info);
		w.$infoLogo = $('<span class="b-survey-photo__logo" />');//.appendTo(w.$info);
		
		w.$loading = $('<div class="b-survey-photo__loading"/>').append($('<img/>', {src: preloaderImg}));
		$.preload([preloaderImg]);
		
		w.$error = $('<div class="b-survey-photo__error"/>').text('Error loading photograph. It seems like it was just deleted or got hidden.');
		
	},

	showNothing: function() {
		this.w.$element.empty();
	},

	showLoading: function() {
		var w = this.w;
		
		w.$element.empty();
		w.$element.append(w.$loading);
	},
	
	showPhotoInfo: function(info) {
		var w = this.w;
		if (info.status === 0) {
			w.$infoPhoto.attr('src', '');
			w.$infoPhoto.attr('src', info.imgSrc);
			w.$infoTitle.text('').text(info.title);
			w.$infoTimestampanduser.text('').text(/*(info.timestamp ? info.timestamp + " " : "") + */"© " + info.user + ' (' + _.capitalize(info.source) + ')');
			w.$info.attr('href', info.permalink);
			w.$infoLogo.removeClass("flickr panoramio geograph picasa").addClass(info.source);
			w.$element.empty();
			w.$element.append(w.$info);
			w.lastInfoHeight = w.$info.height();
		} else {
			w.$element.empty();
			w.$element.append(w.$error);
			console.log("Faulty photo: ", info);
		};
	},
	
	isShowingError: function() {
		return this.w.$error.parent().length != 0;
	}
});