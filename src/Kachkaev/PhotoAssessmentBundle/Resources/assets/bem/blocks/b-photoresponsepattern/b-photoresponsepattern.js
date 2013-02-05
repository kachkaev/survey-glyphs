(function(){

var CANVAS_PADDING = [10, 20, 5, 4]; // top right bottom left

var NODE_SIZE = 14;

var ANIMATION_LENGTH = 750;

// Mapping answers with strings to be displayed in the interface
var LANG_HINT_ANSWERS = {
       '_default': [[1, 'yes'], [0, 'no'], [-1, 'hard to say'], [null, 'N/A']],
       'qTimeOfDay': [[0, 'day'], [1, 'twilight'], [2, 'night'], [-1, 'hard to say'], [null, 'N/A']]
};

var LANG_HINT_QUESTIONS = {
         'qIsRealPhoto': 'real photo',
         'qIsOutdoors': 'outdoors',
         'qTimeOfDay': 'daytime',
         'qSubjectTemporal': 'subject temporal',
         'qSubjectPeople': 'people',
         'qIsByPedestrian': 'by pedestrian',
         'qIsSpaceAttractive': 'attractive'
    };

var LANG_HINT_RESPONSE = ' response selected';
var LANG_HINT_RESPONSES = ' responses selected';
var LANG_HINT_WITH = ' with ';
var LANG_HINT_QAJOINT = ' = ';


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


	    // =====================================
	    // Objects with UI
	    // =====================================

        // Hint
        w.$hint = $('<div/>').addClass('b-photoresponsepattern__hint').appendTo(w.$element);
        
		// SVG 
		w.d3SvgCanvas = d3.select(w.$element.get(0))
		    .append("svg:svg")
    		.attr('width', w.$element.width())
    		.attr('height', w.$element.height());
		w.d3SvgCanvas.append("g")
		    .attr('class', 'grid');
        w.d3SvgCanvas.append("g")
            .attr('class', 'photoResponses');
        w.d3SvgCanvas.append("g")
            .attr('class', 'photoResponseEdges');
        w.d3SvgCanvas.append("g")
            .attr('class', 'photoResponseNodes');

		w.$svgCanvas = w.$element.find('svg');
		
		// =====================================
        // Event handling
        // =====================================

		// Highlight responses when mouse is over them + generate hint 
		w.$element.on('bphotoresponsepatterncontexthover', function(event, eventData) {
		    var d3PhotoResponse = w.d3SvgCanvas.select('g.photoResponses').selectAll('path');
		    var photoResponseIds = eventData.photoResponseIds;
		    
		    var hintTextChunks = [];
		    
		    // If at least something is hovered
		    if (_.isArray(photoResponseIds) && photoResponseIds.length) {
		        // Mark lines as selected
		        d3PhotoResponse.each(function(d) {
		                var s = d3.select(this);
		                s.classed('selected', photoResponseIds.indexOf(d.id) !== -1); 
		            });
		        
		        // Generate hint
		        //// xxx responses
		        hintTextChunks.push(photoResponseIds.length);
		        hintTextChunks.push(photoResponseIds.length == 1 ? LANG_HINT_RESPONSE : LANG_HINT_RESPONSES);
		        //// "with question: answer"
		        if (eventData.questionId !== undefined && eventData.answerId !== undefined) {
		            var question = w.options.questions[eventData.questionId];
                    hintTextChunks.push(LANG_HINT_WITH);
		            hintTextChunks.push(LANG_HINT_QUESTIONS[question]);
		            hintTextChunks.push(LANG_HINT_QAJOINT);
		            var langHintAnswers = LANG_HINT_ANSWERS[question] || LANG_HINT_ANSWERS['_default'];
		            var answer = pat.getAnswerSeq(question)[eventData.answerId];
		            hintTextChunks.push(_.find(langHintAnswers, function(pair){ return pair[0] == answer;})[1]);
		        }
		    } else {
		        d3PhotoResponse.classed('selected', false);
		    }
		    
		    //console.log('hint', eventData, hintTextChunks.join(''));
		    w.$hint.text(hintTextChunks.join(''));
		    
		});
		
		w._self._updatePhotoResponsesMap();
		w._self._redraw();
		
	},
	
	_redraw: function() {
	    var w = this.w;
	    
	    var d3photoResponses = w.d3SvgCanvas.select('g.photoResponses');
	    var d3photoResponseEdges = w.d3SvgCanvas.select('g.photoResponseEdges');
	    var d3photoResponseNodes = w.d3SvgCanvas.select('g.photoResponseNodes');
       
	    d3photoResponses.attr('width', function()  { return w.d3SvgCanvas.attr('width')  - CANVAS_PADDING[1] - CANVAS_PADDING[3];});
	    d3photoResponses.attr('height', function() { return w.d3SvgCanvas.attr('height') - CANVAS_PADDING[0] - CANVAS_PADDING[2];});
	    d3photoResponses.attr('transform', function() {return 'translate(' + CANVAS_PADDING[3] + "," + CANVAS_PADDING[0] + ')';});
	    d3photoResponseEdges.attr('transform', d3photoResponses.attr('transform'));
	    d3photoResponseNodes.attr('transform', d3photoResponses.attr('transform'));

	    // Scaling
	    // x - always the same
	    //console.log(photoResponses.size(), photoResponses);
	    
	    var x = d3.scale.linear()
        	    .range([0, d3photoResponses.attr('width')])
	            .domain([0, pat.config.answerSequencesLength]);
	    
	    // y - domain depends on time scaling
	    var y = d3.scale.linear()
	            .range([0, d3photoResponses.attr('height')])
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
	    

        // =====================================
        // Draw grid
        // =====================================

        
        // =====================================
        // Draw response lines
        // =====================================
        
        var makeInteractive = function(selection) {
            selection.on("mouseover", function(d, i){
                var triggerObj = {
                        photoResponseIds: d.ids,
                        photoResponses: _.map(d.ids, function(id) {return w.photoResponsesMap[id];})
                    };
                if (_.isNumber(d.questionId)) {
                    triggerObj.questionId = d.questionId;
                };
                if (_.isNumber(d.answerId)) {
                    triggerObj.answerId = d.answerId;
                };
                w._self._trigger("contexthover", null, triggerObj);
            })
            .on("mouseout", function(d, i){
                w._self._trigger("contexthover", null, {
                    photoResponseIds: [],
                    photoResponses: []
                });
            })
            .on("click", function(d, i){
                w._self._trigger("contextclick", null, {
                    photoResponseIds: d.ids,
                    photoResponses: _.map(d.ids, function(id) {return w.photoResponsesMap[id];})
                });
            });
        };

        var updateResponseLine = function(selection) {
            return selection.attr("d", function(d) {
                var pts = [];
                _.each(w.options.questions, function(question) {
                    var answerSeq = pat.getAnswerSeq(question);
                    pts.push([
                              _.indexOf(answerSeq, d[question]),
                              _.indexOf(w.options.questions, question) * (w.options.timeScaling ? Math.max(0, d.duration) : 1)
                          ]);
                });
                return line(pts);
            });

        };
        
        // Create / update / remove lines
        var d3responseLine = d3photoResponses.selectAll('path').data(w.options.photoResponses, function(d) {
            if (w.options.photoResponseEqualityParameter)
                return d[w.options.photoResponseEqualityParameter];
        });

        // Update (except enter)
        d3responseLine
            .transition().duration(ANIMATION_LENGTH)
            .call(updateResponseLine);

        // Enter
        d3responseLine.enter()
           .append("svg:path")
           .attr("class", "answer")
           .on("click", function(d, i){
               w._self._trigger("contextclick", null, {
                   photoResponseIds: [d.id],
                   photoResponses: [d]
               });
           })
        .each(function() {
            var s = d3.select(this);
            var o = d3.select(this).style('opacity');
            s.style('opacity', 0)
                .transition().duration(ANIMATION_LENGTH)
                .style('opacity', o)
                .call(updateResponseLine);
        });
	    
	    // Exit
        d3responseLine.exit()
           .transition().duration(ANIMATION_LENGTH)
           .style("opacity",0)
           .remove();
       
        // There is nothing else to do if time scaling is on
        if (w.options.timeScaling) {
            d3photoResponseNodes.style('visibility', 'hidden');
            d3photoResponseEdges.style('visibility', 'hidden');
            return;
        } else {
            setTimeout(function() {
                d3photoResponseNodes.style('visibility', 'visible');
                d3photoResponseEdges.style('visibility', 'visible');
            }, ANIMATION_LENGTH);
        }

        // Prepare data for edges and nodes
        var responseMatrix = [];       
        for (var i = w.options.questions.length - 1; i >= 0; --i) {
            var q = [];
            for (var j = pat.config.answerSequencesLength - 1; j >= 0; --j) {
                q.push([]);
            }
            responseMatrix.push(q);
        }
        _.each(w.options.photoResponses, function(photoResponse) {
            for (var i = w.options.questions.length - 1; i >= 0; --i) {
                var question = w.options.questions[i];
                var indexOfAnswer = _.indexOf(pat.getAnswerSeq(question), photoResponse[question]);
                responseMatrix[i][indexOfAnswer].push(photoResponse.id);
            };
        });
       

        // =====================================
        // Draw edges
        // =====================================

        // Prepare data
        var responseEdges = [];
        for (var i = w.options.questions.length - 1; i >= 1; --i) {
            for (var j = pat.config.answerSequencesLength - 1; j >= 0; --j) {
                if (!responseMatrix[i][j].length) {
                    continue;
                }
                for (var k = pat.config.answerSequencesLength - 1; k >= 0; --k) {
                    if (!responseMatrix[i-1][k].length) {
                        continue;
                    }
                    
                    var commonIds = _.intersection(responseMatrix[i][j], responseMatrix[i-1][k]);
                    if (commonIds.length) {
                        responseEdges.push({
                            questionId1: i-1,
                            answerId1: k,
                            questionId2: i,
                            answerId2: j,
                            ids: commonIds
                        });
                     }
                 }
            }
        }
        // Sort edges by a number of responses (edges with smaller number have mouse events priority)
        responseEdges = _.sortBy(responseEdges, function(edge) {return - edge.ids.length;});
        
        // Create / update / remove lines
        var d3responseEdge = d3photoResponseEdges.selectAll('line').data(responseEdges, function(d) {
            return JSON.stringify(d);
        });
 
        // Enter
        d3responseEdge.enter()
            .append("svg:line")
            .call(makeInteractive)
            .each(function(d) {
               d3.select(this)
                   .attr({
                       'x1': x(d.answerId1),
                       'y1': y(d.questionId1),
                       'x2': x(d.answerId2),
                       'y2': y(d.questionId2),
                       'class': 'edge'
                   });
           });

        // Exit
        d3responseEdge.exit()
            .remove();


        // =====================================
        // Draw nodes
        // =====================================

        // Prepare data
        var responseNodes = [];
        for (var i = w.options.questions.length - 1; i >= 0; --i) {
             for (var j = pat.config.answerSequencesLength - 1; j >= 0; --j) {
                if (!responseMatrix[i][j].length) {
                    continue;
                }
                responseNodes.push({
                   questionId:i,
                    answerId: j,
                   ids: responseMatrix[i][j]
                });
            }
        }

       
        // Create / update / remove rects
        var d3responseNode = d3photoResponseNodes.selectAll('rect').data(responseNodes, function(d) {
            return JSON.stringify(d);
        });
 
        // Enter
        d3responseNode.enter()
           .append("svg:rect")
           .call(makeInteractive)
           .each(function(d) {
               d3.select(this)
                   .attr({
                       'x': x(d.answerId) - NODE_SIZE/2,
                       'y': y(d.questionId) - NODE_SIZE/2,
                       'width': NODE_SIZE,
                       'height': NODE_SIZE,
                       'class': 'node'
                   });
           });

        /// Exit
        d3responseNode.exit()
          .remove();

	},
	
    _setOption: function (key, value) {
        var w = this.w;
        
        switch (key) {
            case 'maxTime':
                if (value == w.options.maxTime) {
                    return;
                }
                break;
            case 'timeScaling':
                if (value == w.options.timeScaling) {
                    return;
                }
                break;
            case 'photoResponses':
                $.Widget.prototype._setOption.apply( this, arguments );
                w._self._updatePhotoResponsesMap();
                this._redraw();
                return;
        }
        $.Widget.prototype._setOption.apply( this, arguments );
        this._redraw();
    },
    
    _updatePhotoResponsesMap: function() {
        var w = this.w;

        w.photoResponsesMap = {};
        _.each(w.options.photoResponses, function(photoResponse) {
            w.photoResponsesMap[photoResponse.id] = photoResponse;
        });
    }
});
}());