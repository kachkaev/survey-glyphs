(function(){

var canvasPadding = [30, 20, 5, 20]; // top right bottom left

var durationBarHalfWidth = 5;

var defaultLineStyle = {
        strokeStyle: "rgba(0,0,0,0.1)",
        strokeWidth: 4,
        rounded: true
      };

$.widget('ui.bphotoresponsepattern', {

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
		
		
        w.d3line = d3.svg.line()
            .x(function(d){return d.x;})
            .y(function(d){return d.y;})
            .interpolate("linear"); 
        
        //		w.$svgCanvas = $('<svg/>')
//    		.attr('width', w.$element.width())
//    		.attr('height', w.$element.height())
//		    .width(w.$element.width())
//		    .height(w.$element.height());
		w.d3SvgCanvas = d3.select(w.$element.get(0))
		    .append("svg:svg")
    		.attr('width', w.$element.width())
    		.attr('height', w.$element.height());
		w.d3SvgCanvas.append("g")
		    .attr('class', 'photoResponses');
		
		w.$svgCanvas = w.$element.find('svg');
		w._self._redraw();
	},

	_drawMarker: function(pt, type) {
	    switch (type) {
	     default:
	         var drawObj = _.extend({}, defaultLineStyle);
    	     drawObj.x1 = pt[0] - durationBarHalfWidth;
    	     drawObj.x2 = pt[0] + durationBarHalfWidth;
    	     drawObj.y1 = pt[1];
    	     drawObj.y2 = pt[1];
    	     
    	     //w.$svgCanvas.drawLine(drawObj);
	    }
	},
	
	_redraw: function() {
	    var w = this.w;
	    
	    d3responseLine = w.d3SvgCanvas.select('g.photoResponses').selectAll('path').data(w.options.photoResponses);
	    
	    // Update
	    d3responseLine
            .attr("d", function(d) {
                var pts = [];
                _.each(w.options.questions, function(question) {
                    pts.push(w._self._qaToCoords(d, question));
                });
                return w.d3line(pts);
            });
	    
	    // Enter
	    d3responseLine.enter()
           .append("svg:path")
           .attr("d", function(d) {
               var pts = [];
               _.each(w.options.questions, function(question) {
                   pts.push(w._self._qaToCoords(d, question));
               });
               return w.d3line(pts);
           })
           .attr("class", "answer")
           .on("click", function(d, i){
               w._self._trigger("contextclick", null, {photoResponses: [d]});
           });
       
	   // Exit
       d3responseLine.exit()
           .remove();
	    return;
	    
	    w.d3SvgCanvas.data(w.options.photoResponses);

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
            
            
            w.d3SvgCanvas.append("svg:path")
                .attr("d", d3line2(pts))
                .attr("class", "answer")
                .on("click", function(d, i){console.log(this, d, i);})
                //.on("mouseover", function(d, i){console.log(this);})
                //.data(photoResponse);
//                .style("stroke-width", 2)
//                .style("stroke", "steelblue")
//                .style("fill", "none");

	        // The drawLine() object
//	        var drawObj = _.extend({}, defaultLineStyle);
//	        //Add the points from the array to the object
//	        for (var p=0; p<pts.length; p+=1) {
//	          drawObj['x'+(p+1)] = pts[p][0];
//	          drawObj['y'+(p+1)] = pts[p][1];
//	        }

	        // Draw the line
	        //w.$svgCanvas.drawLine(drawObj);
	        
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
        var dx = (answersLength === 1) ? 1 : (w.$svgCanvas.width() - canvasPadding[1] - canvasPadding[3]) / (answersLength - 1);
        return _.indexOf(w.options.answers, answer) * dx + canvasPadding[3];
    },
    
    _questionToY: function(question, duration) {
        var w = this.w;
        
        if (w.options.timeScaling) {
            // TODO See why duration is sometimes negative (≈50 cases out of 2000)
            if (duration < 0)
                duration = 0;
            var dy = (w.$svgCanvas.height() - canvasPadding[0] - canvasPadding[2]) / w.options.maxTime * duration / w.options.questions.length;
            return !w.options.maxTime ? canvasPadding[0] : (canvasPadding[0] + _.indexOf(w.options.questions, question) * dy);
        } else {
            var questionsLength = w.options.questions.length;
            var dy = (questionsLength === 1) ? 1 : (w.$svgCanvas.height() - canvasPadding[0] - canvasPadding[2]) / (questionsLength - 1);
            return _.indexOf(w.options.questions, question) * dy + canvasPadding[0];
        }
    },
    
    _qaToCoords: function(photoResponse, question) {
       return {x: this._answerToX(photoResponse[question]), y: this._questionToY(question, photoResponse.duration)};
	}
});
}());