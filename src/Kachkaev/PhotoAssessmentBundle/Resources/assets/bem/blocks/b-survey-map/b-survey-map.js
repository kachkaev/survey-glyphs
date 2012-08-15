/**
 * Survey map is UI element accessible as a jQuery UI widget
 * 
 * Position is null or an array with 2 elements: [lon, lat]
 * 
 * Set given position: $bsurveymap('option', 'given_pos', value);
 * Get given position: $bsurveymap('option', 'given_pos');
 *  
 * Set altered position: $bsurveymap('option', 'altered_pos', value);
 * Get altered position: $bsurveymap('option', 'altered_pos');
 * 
 * Events: marker dragged
 * changealter_pos
 * TODO
 */
$.widget('ui.bsurveymap', {

	options: {
		given_pos: null,
		altered_pos: null
	},

	_init: function() {
		var w = {
				_self: this,
				element: this.element,
			};
		this.w = w;
		
	    var myOptions = {
            zoom : 18,
            center : new google.maps.LatLng(0,0),
            mapTypeId : google.maps.MapTypeId.SATELLITE,
            zoomControl: true,
            zoomControlOptions: {
              style: google.maps.ZoomControlStyle.SMALL
            },
            styles:
                [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers:
                        [
                            {
                                visibility: "off"
                            }
                        ]
                    }
                ]
        };

	    var map = new google.maps.Map(this.element.get(0),
	            myOptions);
	    w.map = map;
	    
	    // Removing tabstop within the map
	    google.maps.event.addListenerOnce(map, 'idle', function(){
	    	w.element.find('a').attr('tabindex', -1);
	    });
	    
	    // Markers
	    //// Icons
	    var iconMainOK = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|1cb658",
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconMainAltered = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|fffb70",
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconMainWrong = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|ff7b68",
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconHelper = new google.maps.MarkerImage("/static/i/b-survey-map__circle.png",
    	        new google.maps.Size(10, 10),
    	        new google.maps.Point(3, 3),
    	        new google.maps.Point(5, 5));
	    //// Main marker points to altered position or given position, if altered is null or the same.
	    var mainMarker = new google.maps.Marker({
	    	icon: iconMainOK,
	    	position: null,
	    	map: map,
	    	draggable: true,
	    	zIndex: 2,
	    });
	    //// Helper marker is only visible when altered position is not equal to given one.
	    var helperMarker = new google.maps.Marker({
	    	icon: iconHelper,
	        position: null,
	        map: map,
	        zIndex: 1,
	      });
	    w.helperMarker = helperMarker;
	    w.mainMarker = mainMarker;
	    
	    // Helper conversion functions
	    var posToLatLon = function(pos) {
	    	if (_.isArray(pos) && pos.length == 2)
	    		return new google.maps.LatLng(pos[1], pos[0]);
    		if (pos == null)
    			return null;
    		else
    			return pos;
	    };
	    var posToArray = function (pos) {
	    	if (pos == null)
	    		return null;
	    	return [pos.lng(), pos.lat()]; 
	    };
	    w.posToLatLon = posToLatLon;
	    w.posToArray = posToArray;
	    	    
	    /**
	     * Moves and shows/hides markers according to options
	     */
    	var updateMarkers = function(needMapCentering) {
    		var pGiven = posToLatLon(w._self.options.given_pos);
    		var pAltered = posToLatLon(w._self.options.altered_pos);
    		var pCenter = null;
    		if (pGiven == null) {
    			mainMarker.setVisible(false);
    			helperMarker.setVisible(false);
    		} else if (pAltered == null || pGiven.equals(pAltered)) {
    			mainMarker.setVisible(true);
    			mainMarker.setPosition(pGiven);
    			mainMarker.setIcon(pAltered == null ? iconMainWrong : iconMainOK);
    			helperMarker.setVisible(true);
    			helperMarker.setPosition(pGiven);
    			pCenter = pGiven;
    		} else {
    			mainMarker.setVisible(true);
    			mainMarker.setPosition(pAltered);
    			mainMarker.setIcon(iconMainAltered);
    			helperMarker.setVisible(true);
    			helperMarker.setPosition(pGiven);
    			pCenter = pAltered;
    		}
    		
    		if (needMapCentering && pCenter && (_.isUndefined(map.getBounds()) || !map.getBounds().contains(pCenter))) {
    			map.panTo(pCenter);
    			//w.map.setCenter(pCenter);
    		}
	    };
	    this.w.updateMarkers = updateMarkers;
	    
		//// Adding dragging event listeners
	    google.maps.event.addListener(mainMarker, 'dragstart', function() {
	    	mainMarker.setIcon(iconMainAltered);
	    });
	    
	    google.maps.event.addListener(mainMarker, 'drag', function() {
	    	w._self._setAlteredPos(posToArray(mainMarker.getPosition()), false);
	    });
	    
	    google.maps.event.addListener(mainMarker, 'dragend', function() {
	    	w._self._setAlteredPos(posToArray(mainMarker.getPosition()), false);
	    });
	    
	    // Adding click events
	    google.maps.event.addListener(mainMarker, 'dblclick', function() {
	    	w._self._setAlteredPos(w._self.options.altered_pos == null ? w._self.options.given_pos : null, true);
	    });
	    google.maps.event.addListener(helperMarker, 'dblclick', function() {
	    	w._self._setAlteredPos(w._self.options.altered_pos == null ? w._self.options.given_pos : null, true);
	    });

	},
	
	_setAlteredPos: function (value, needMapCentering) {

		if (_.isEqual(this.options.altered_pos, value)) {
			return;
		}
		$.Widget.prototype._setOption.apply( this, ["altered_pos", value] );
		this._trigger("changealtered_pos");
		this.w.updateMarkers(needMapCentering);
	},
	
	_setOption: function (key, value) {
		switch (key) {
			case 'altered_pos':
				this._setAlteredPos(value, true);
				return;
			case 'given_pos':
				$.Widget.prototype._setOption.apply( this, arguments );
		    	this.w.updateMarkers(true);
		    	return;
			default:
				return;
		}
		$.Widget.prototype._setOption.apply( this, arguments );
	},
	
	posIsAccurate: function() {
		return _.isEqual(this.options.altered_pos, this.options.given_pos) && this.options.given_pos != null;
	}

});
