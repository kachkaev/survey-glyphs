(function(){

var CANVAS_PADDING = [10, 20, -20, 4]; // top right bottom left
//var CANVAS_PADDING = [10, 20, 5, 12]; // top right bottom left

var NODE_SIZE = 14;

var ANIMATION_LENGTH = 750;
var ANIMATION_EASING = 'in-out';

// Mapping answers with strings to be displayed in the interface
var LANG_HINT_ANSWERS = {
       '_default': [[1, 'yes'], [0, 'no'], [-1, 'hard to say'], [null, 'N/A']],
       'qTimeOfDay': [[0, 'day'], [1, 'hard to say / twilight'], [2, 'night'], [-1, 'hard to say / twilight'], [null, 'N/A']]
};

var LANG_HINT_RESPONSE = ' selected';
var LANG_HINT_RESPONSES = ' selected';
var LANG_HINT_WITH = ' with ';
var LANG_HINT_QAJOINT = ' = ';
var LANG_HINT_WITH_DURATION = ' with duration = ';
var LANG_HINT_SECS = ' s';
var LANG_HINT_WITH_UNKNOWN_DURATION = ' with unknown duration';

$.widget('ui.bphotomap', {

    options: {
        answers: [],
        questions: [],
        timeScaling: false,
        shadeNull: true,
        maxTime: 20,
        photoResponseEqualityParameter: null,
        photoResponses: []
    },
    
    _init: function() {
        
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
            .append('svg:svg')
            .attr('width', w.$element.width())
            .attr('height', w.$element.height());
        // rect
        var x = d3.scale.linear()
        w.d3SvgCanvas.append('rect')
            .attr('class', 'nullShading')
            .attr("x", 134.5)
            .attr("y", 0)
            .attr("width", 40)
            .attr("height", w.$element.height());

        
        // groups
        w.d3SvgCanvas.append('g')
            .attr('class', 'grid');
        w.d3SvgCanvas.append('g')
            .attr('class', 'photoResponses');
        w.d3SvgCanvas.append('g')
            .attr('class', 'photoResponseEdges');
        w.d3SvgCanvas.append('g')
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
                //// 'with question: answer'
                if (eventData.questionId !== undefined && eventData.answerId !== undefined) {
                    var question = w.options.questions[eventData.questionId];
                    hintTextChunks.push(LANG_HINT_WITH);
                    hintTextChunks.push(pat.config.lang.hintQuestions[question]);
                    hintTextChunks.push(LANG_HINT_QAJOINT);
                    var langHintAnswers = LANG_HINT_ANSWERS[question] || LANG_HINT_ANSWERS['_default'];
                    var answer = pat.getAnswerSeq(question)[eventData.answerId];
                    hintTextChunks.push(_.find(langHintAnswers, function(pair){ return pair[0] == answer;})[1]);
                }
                
                //// with duration = x s || with unknown duration
                if (photoResponseIds.length == 1 && w.options.timeScaling) {
                    var duration = eventData.photoResponses[0].duration;
                    if (duration >= 0) {
                        hintTextChunks.push(LANG_HINT_WITH_DURATION);
                        hintTextChunks.push(eventData.photoResponses[0].duration);
                        hintTextChunks.push(LANG_HINT_SECS);
                    } else {
                        hintTextChunks.push(LANG_HINT_WITH_UNKNOWN_DURATION);
                    }
                }
                    
            } else {
                d3PhotoResponse.classed('selected', false);
            }
            
            //console.log('hint', eventData, hintTextChunks.join(''));
            w._self._updateHint(hintTextChunks.join(''));
        });
        
        w._self._updatePhotoResponsesMap();
        w._self._redraw();
        w._self._updateHint();
        
    },
    
    _redraw: function() {
        var w = this.w;
        
        var d3grid = w.d3SvgCanvas.select('g.grid');
        var d3NullShading = w.d3SvgCanvas.select('rect.nullShading');
        var d3photoResponses = w.d3SvgCanvas.select('g.photoResponses');
        var d3photoResponseEdges = w.d3SvgCanvas.select('g.photoResponseEdges');
        var d3photoResponseNodes = w.d3SvgCanvas.select('g.photoResponseNodes');
       
        var nullShadingOpacity = w.options.shadeNull * 1 * (w.options.photoResponses !== null && w.options.photoResponses.length > 0);
        d3NullShading
            .transition().duration(ANIMATION_LENGTH)
            .style('opacity', nullShadingOpacity);
        
        d3photoResponses.attr('width', function()  { return w.d3SvgCanvas.attr('width')  - CANVAS_PADDING[1] - CANVAS_PADDING[3];});
        d3photoResponses.attr('height', function() { return w.d3SvgCanvas.attr('height') - CANVAS_PADDING[0] - CANVAS_PADDING[2];});
        d3photoResponses.attr('transform', function() {return 'translate(' + CANVAS_PADDING[3] + ',' + CANVAS_PADDING[0] + ')';});
        d3photoResponseEdges.attr('transform', d3photoResponses.attr('transform'));
        d3photoResponseNodes.attr('transform', d3photoResponses.attr('transform'));
        d3grid.attr('transform', d3photoResponses.attr('transform'));

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
            .interpolate('linear'); 
        

        // =====================================
        // Draw grid
        // =====================================
        // Baseline
        var gridElems = [];
        if (w.options.timeScaling && pat.config.flatLinesInTimeScaling) {
            gridElems.push(['h', 0, 'baseline']);
        }
        var d3gridElem = d3grid.selectAll('line').data(gridElems, function(d) {
            return JSON.stringify(d);
        });
 
        d3gridElem.enter()
            .append('svg:line')
         .each(function(d) {
             var s = d3.select(this);
             s.transition().duration(0).ease(ANIMATION_EASING);
             s.style('opacity', null);
             if (d[0] == 'h') {
                 s.attr({
                     'x1': x(0),
                     'x2': x(pat.config.answerSequencesLength - 1),
                     'y1': d[1],
                     'y2': d[1],
                     'class': d[2]
                 });
             } else {
                 s.attr({
                     'x2': d[1],
                     'x1': d[1],
                     'y1': y(0),
                     'y2': y(w.options.questions.length - 1),
                     'class': d[2]
                 });
             }
             var o = s.style('opacity');
             s.style('opacity', 0)
                 .transition().duration(ANIMATION_LENGTH)
                 .ease(ANIMATION_EASING)
                 .style('opacity', o);
         });
         
         // Exit
         d3gridElem.exit()
            .transition().duration(ANIMATION_LENGTH)
            .ease(ANIMATION_EASING)
            .style('opacity',0)
            .remove();
        
        // =====================================
        // Draw response lines
        // =====================================
        
        var makeInteractive = function(selection) {
            selection.on('mouseover', function(d, i){
                var triggerObj = null;
                if (_.isArray(d.ids)) { // edges or nodes
                    triggerObj = {
                            photoResponseIds: d.ids,
                            photoResponses: _.map(d.ids, function(id) {return w.photoResponsesMap[id];})
                    };
                } else { // lines themselves
                    triggerObj = {
                            photoResponseIds: [d.id],
                            photoResponses: [d]
                    };
                }
                if (_.isNumber(d.questionId)) {
                    triggerObj.questionId = d.questionId;
                };
                if (_.isNumber(d.answerId)) {
                    triggerObj.answerId = d.answerId;
                };
                w._self._trigger('contexthover', null, triggerObj);
            })
            .on('mouseout', function(d, i){
                w._self._trigger('contexthover', null, {
                    photoResponseIds: [],
                    photoResponses: []
                });
            })
            .on('click', function(d, i){
                var triggerObj = null;
                if (_.isArray(d.ids)) { // edges or nodes
                    w._self._trigger('contextclick', null, {
                        photoResponseIds: d.ids,
                        photoResponses: _.map(d.ids, function(id) {return w.photoResponsesMap[id];})
                    });
                } else { // lines themselves
                    triggerObj = {
                            photoResponseIds: [d.id],
                            photoResponses: [d]
                    };
                }
                w._self._trigger('contextclick', null, triggerObj);

            });
        };

        var updateResponseLine = function(selection) {
            return selection.attr('d', function(d) {
                var pts = [];
                if (w.options.timeScaling && pat.config.flatLinesInTimeScaling) {
                    var y = (w.options.questions.length - 1) * Math.min(w.options.maxTime, Math.max(0, d.duration));
                    for (var i = 0; i < 7; ++i) {
                        pts.push([i, y]);
                    }
                } else {
                    _.each(w.options.questions, function(question) {
                        var answerSeq = pat.getAnswerSeq(question);
                        pts.push([
                                  _.indexOf(answerSeq, d[question]),
                                  _.indexOf(w.options.questions, question) * (w.options.timeScaling ? Math.max(0, d.duration) : 1)
                                  ]);
                    });
                }
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
            .each(function(){
                var s = d3.select(this);
                var currentO = s.style('opacity');
                s.style('opacity', null);
                var neededO = s.style('opacity');
                s.style('opacity', currentO);
                s.transition().duration(ANIMATION_LENGTH)
                    .ease(ANIMATION_EASING)
                    .style('opacity', neededO)
                    .call(updateResponseLine);

            });

        // Enter
        d3responseLine.enter()
           .append('svg:path')
           .attr('class', 'answer')
           .call(makeInteractive)
        .each(function() {
            var s = d3.select(this);
            s.transition().duration(0);
            s.style('opacity', null);
            var o = s.style('opacity');
            s.style('opacity', 0)
                .transition().duration(ANIMATION_LENGTH)
                .ease(ANIMATION_EASING)
                .style('opacity', o)
                .call(updateResponseLine);
        });
        
        // Exit
        d3responseLine.exit()
           .transition().duration(ANIMATION_LENGTH)
           .ease(ANIMATION_EASING)
           .style('opacity',0)
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
            .append('svg:line')
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
           .append('svg:rect')
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
                this._updateHint(null, true);
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
    },
    
    _updateHint: function(text, reconstructDefault) {
        var w = this.w;
        
        // Update default hint text if needed
        // x completed / y photo problems
        if (reconstructDefault) {
            if (!w.options.photoResponses || !w.options.photoResponses.length) {
                w.defaultHintText = '';
            } else {
                var completeCount = 0;
                var photoProblemCount = 0;
                _.each(w.options.photoResponses, function(pr) {
                    switch(pr.status) {
                    case pat.PhotoResponseStatus.COMPLETE:
                        ++completeCount;
                        break;
                    case pat.PhotoResponseStatus.PHOTO_PROBLEM:
                        ++photoProblemCount;
                        break;
                    }
                });
                
                var defaultHintSlices = [];
                defaultHintSlices.push(completeCount, ' completed');
                if (photoProblemCount) {
                    defaultHintSlices.push(' / ', photoProblemCount, ' photo problem');
                    if (photoProblemCount > 1) {
                        defaultHintSlices.push('s');
                    }
                };
                w.defaultHintText = defaultHintSlices.join('');
            }
        }
        w.$hint.text(text || w.defaultHintText);
    }
});
}());