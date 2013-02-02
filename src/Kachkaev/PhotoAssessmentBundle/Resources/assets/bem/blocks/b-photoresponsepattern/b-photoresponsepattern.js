(function(){

var canvasPadding = [10, 20, 5, 20]; // top right bottom left

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
	        timeScaling: false,
	        maxTime: 20,
	        photoResponseEqualityParameter: null
	    }, this.options);
	    
	    if (!this.options.photoResponses) {
	        this.options.photoResponses = [];
	    };
	    
		var w = {
				_self: this,
				$element: this.element,
				options: this.options
			};
		this.w = w;
		
		w.d3SvgCanvas = d3.select(w.$element.get(0))
		    .append("svg:svg")
    		.attr('width', w.$element.width())
    		.attr('height', w.$element.height());
		w.d3SvgCanvas.append("g")
		    .attr('class', 'grid');
        w.d3SvgCanvas.append("g")
            .attr('class', 'photoResponses');

		w.$svgCanvas = w.$element.find('svg');
		w._self._redraw();
	},
	
	_redraw: function() {
	    var w = this.w;
	    
	    photoResponses = w.d3SvgCanvas.select('g.photoResponses');
	    
	    photoResponses.attr('width', function()  { return w.d3SvgCanvas.attr('width')  - canvasPadding[1] - canvasPadding[3];});
	    photoResponses.attr('height', function() { return w.d3SvgCanvas.attr('height') - canvasPadding[0] - canvasPadding[2];});
	    photoResponses.attr('transform', function() {return 'translate(' + canvasPadding[1] + "," + canvasPadding[0] + ')';});

	    // Scaling
	    // x - always the same
	    //console.log(photoResponses.size(), photoResponses);
	    
	    var x = d3.scale.linear()
        	    .range([0, photoResponses.attr('width')])
	            .domain([0, w.options.answers.length]);
	    
	    // y - domain depends on time scaling
	    var y = d3.scale.linear()
	            .range([0, photoResponses.attr('height')])
        	    .domain([0, 1]);
        if (w.options.timeScaling) {
            y.domain([0, w.options.maxTime * w.options.questions.length]);
        } else {
            y.domain([0, w.options.questions.length]);
        }
        
	    
	    // SVG Line generator
        var line = d3.svg.line()
            .x(function(d){return x(d[0]);})
            .y(function(d){return y(d[1]);})
            .interpolate("linear"); 
	    
        var updateResponseLine = function(selection) {
            return selection.attr("d", function(d) {
                var pts = [];
                _.each(w.options.questions, function(question) {
                    pts.push([
                              _.indexOf(w.options.answers, d[question]),
                              _.indexOf(w.options.questions, question) * (w.options.timeScaling ? Math.max(0, d.duration) : 1)
                          ]);
                });
                return line(pts);
            });

        };
        
        // Create / update / remove lines
        var d3responseLine = photoResponses.selectAll('path').data(w.options.photoResponses, function(d) {
            if (w.options.photoResponseEqualityParameter)
                return d[w.options.photoResponseEqualityParameter];
        });

        // Update (except enter)
        d3responseLine
            .transition()
            .call(updateResponseLine);

        // Enter
        d3responseLine.enter()
           .append("svg:path")
           .attr("class", "answer")
           .on("click", function(d, i){
               w._self._trigger("contextclick", null, {photoResponses: [d]});
           })
        .each(function() {
            var s = d3.select(this);
            var o = d3.select(this).style('opacity');
            s.style('opacity', 0)
                .transition()
                .style('opacity', o)
                .call(updateResponseLine);
        });
	    
	   // Exit
       d3responseLine.exit()
           .transition()
           .style("opacity",0)
           .remove();
	},
	
    _setOption: function (key, value) {
        w = this.w;
        
        switch (key) {
            case 'maxTime':
                if (value == w.options.maxTime) {
                    return;
                }
                break;
            //case 'photoResponses':
//            default:
//                return;
        }
        $.Widget.prototype._setOption.apply( this, arguments );
        this._redraw();
    },
});
}());