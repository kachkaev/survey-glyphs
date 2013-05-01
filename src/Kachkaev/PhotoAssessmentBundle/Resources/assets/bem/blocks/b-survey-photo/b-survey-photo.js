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
		w.$infoFaces = $('<span class="b-survey-photo__faces" />').appendTo(w.$info);
		
		w.$loading = $('<div class="b-survey-photo__loading"/>').append($('<img/>', {src: preloaderImg}));
		$.preload([preloaderImg]);
		
		w.$error = $('<div class="b-survey-photo__error"/>').text('Error loading photograph. It seems like it was just deleted or got hidden.');
		
		setInterval(function(){
		        w._self._resizeFacesIfNeeded();
		    }, 500);
	},

    _resizeFacesIfNeeded: function() {
        var w = this.w;
        
        var maxDimension = Math.max(w.$infoPhoto.innerWidth(), w.$infoPhoto.innerHeight());
        if (maxDimension != w.$infoFaces.width()) {
            w.$infoFaces.width(maxDimension);
            w.$infoFaces.height(maxDimension); 
        }
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
			if (info.faces500) {
			    w.$infoFaces.hide();
			    w.$infoFaces.empty();
                var faces500 = info.faces500.split('|');
                for(var i = faces500.length - 1; i >=0; --i) {
                    var currentAlgorithmEncodedFacesAsStr = faces500[i];
                    if (!currentAlgorithmEncodedFacesAsStr || currentAlgorithmEncodedFacesAsStr == 'x') {
                        continue;
                    }
                    var currentAlgorithmEncodedFaces = currentAlgorithmEncodedFacesAsStr.match(/.{2}/g);
                    for (var faceCount = currentAlgorithmEncodedFaces.length/4 - 1; faceCount >= 0; --faceCount) {
                        var faceCenterX = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 0], 16) / 255;
                        var faceCenterY = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 1], 16) / 255;
                        var faceWidth   = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 2], 16) / 255;
                        var faceHeight  = parseInt(currentAlgorithmEncodedFaces[faceCount * 4 + 3], 16) / 255;
                        w.$infoFaces.append($('<div class="b-survey-photo__face"/>')
                                .attr('title', pat.config.faceAlgorithmNames[i])
                                .css({
                            'border-color': pat.config.faceAlgorithmColors[i],
                            'left': (faceCenterX - faceWidth /2) * 100 + '%',
                            'top':  (faceCenterY - faceHeight/2) * 100 + '%',
                            'width': faceWidth * 100 + '%',
                            'height': faceHeight * 100 + '%'
                        }));
                    }
                };
                w.$infoFaces.show();
			} else {
			    w.$infoFaces.hide();
			}
			
		} else {
			w.$element.empty();
			w.$element.append(w.$error);
		};
	},
	
	isShowingError: function() {
		return this.w.$error.parent().length != 0;
	}
});