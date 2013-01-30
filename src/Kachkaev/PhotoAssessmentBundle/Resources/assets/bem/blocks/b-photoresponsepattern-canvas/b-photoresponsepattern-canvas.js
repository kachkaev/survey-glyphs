(function(){

var canvasPadding = [30, 20, 5, 20]; // top right bottom left

var durationBarHalfWidth = 5;

var defaultLineStyle = {
        strokeStyle: "rgba(0,0,0,0.1)",
        strokeWidth: 4,
        rounded: true
      };

$.widget('ui.bphotoresponsepatterncanvas', {

	_init: function() {
	    this.options = _.extend({
	        answers: [],
	        questions: [],
	        photoResponses: [],
	        timeScaling: false,
	        maxTime: 20
	    }, this.options);
	    
		var w = {
				_self: this,
				$element: this.element,
				options: this.options
			};
		this.w = w;
		
		w.$canvas = $('<canvas/>')
    		.attr('width', w.$element.width())
    		.attr('height', w.$element.height())
		    .width(w.$element.width())
		    .height(w.$element.height());
		w._self._redraw();
		w.$canvas.appendTo(w.$element);
	},

	_drawMarker: function(pt, type) {
	    switch (type) {
	     default:
	         var drawObj = _.extend({}, defaultLineStyle);
    	     drawObj.x1 = pt[0] - durationBarHalfWidth;
    	     drawObj.x2 = pt[0] + durationBarHalfWidth;
    	     drawObj.y1 = pt[1];
    	     drawObj.y2 = pt[1];
    	     
    	     w.$canvas.drawLine(drawObj);
	    }
	},
	
	_redraw: function() {
	    var w = this.w;
	    
	    w.$canvas.clearCanvas();

	    if (!w.options.answers.length || !w.options.questions.length) {
	        return;
	    }
	    
	    // Responses
	    _.each(w.options.photoResponses, function(photoResponse) {
	        // Get points of answers
	        var pts = [];
	        _.each(w.options.questions, function(question) {
	            pts.push(w._self._qaToCoords(photoResponse, question));
	        });
	        
           if (w.options.timeScaling) {
                w._self._drawMarker(pts[0]);
            };

	        // The drawLine() object
	        var drawObj = _.extend({}, defaultLineStyle);
	        //Add the points from the array to the object
	        for (var p=0; p<pts.length; p+=1) {
	          drawObj['x'+(p+1)] = pts[p][0];
	          drawObj['y'+(p+1)] = pts[p][1];
	        }

	        // Draw the line
	        w.$canvas.drawLine(drawObj);
	        
	        if (w.options.timeScaling) {
	            w._self._drawMarker(pts.pop());
	        };
	    });
	},
	
    _setOption: function (key, value) {
        w = this.w;
        
        switch (key) {
            case 'maxTime':
                if (value == w.options.maxTime) {
                    return;
                }
                break;
//            default:
//                return;
        }
        $.Widget.prototype._setOption.apply( this, arguments );
        this._redraw();
    },
	
    _answerToX: function(answer) {
        var w = this.w;

        var answersLength = w.options.answers.length;
        var dx = (answersLength === 1) ? 1 : (w.$canvas.width() - canvasPadding[1] - canvasPadding[3]) / (answersLength - 1);
        return _.indexOf(w.options.answers, answer) * dx + canvasPadding[3];
    },
    
    _questionToY: function(question, duration) {
        var w = this.w;
        
        if (w.options.timeScaling) {
            // TODO See why duration is sometimes negative (≈50 cases out of 2000)
            if (duration < 0)
                duration = 0;
            var dy = (w.$canvas.height() - canvasPadding[0] - canvasPadding[2]) / w.options.maxTime * duration / w.options.questions.length;
            return !w.options.maxTime ? canvasPadding[0] : (canvasPadding[0] + _.indexOf(w.options.questions, question) * dy);
        } else {
            var questionsLength = w.options.questions.length;
            var dy = (questionsLength === 1) ? 1 : (w.$canvas.height() - canvasPadding[0] - canvasPadding[2]) / (questionsLength - 1);
            return _.indexOf(w.options.questions, question) * dy + canvasPadding[0];
        }
    },
    
    _qaToCoords: function(photoResponse, question) {
       return [this._answerToX(photoResponse[question]), this._questionToY(question, photoResponse.duration)];
	}
});
}());