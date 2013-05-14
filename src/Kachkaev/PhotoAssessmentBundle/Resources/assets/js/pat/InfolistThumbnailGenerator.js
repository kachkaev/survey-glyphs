(function(){
namespace('pat');

var INTERVAL_WAITING = 200;
var INTERVAL_DRAWING = 10;

var MAX_TIME = 30;

pat.InfolistThumbnailGenerator = function(options) {
    var obj = this;
    
    this.options = _.extend({
        width: 17,
        height: 17,
        canvasPadding: [2, 2, 2, 2],
        canvasPaddingForFaces: [1, 1, 1, 1],
        canvasPaddingForFaces: [0, 0, 0, 0],
        threads: 30,
        backgroundColor: null,

        defaultLineStyle: {
                strokeStyle: "rgba(0,0,0,0.15)",
                strokeWidth: 1,
                rounded: true
            },
        
        defaultBaselineStyle: {
            strokeStyle: "#c0d4f3",
            strokeWidth: 2,
            rounded: true
        }
    }, options);
    
    var threads = [];
    for (var i = this.options.threads - 1; i >= 0; --i) {
        // [0] is busy, [1] canvas 
        threads.push([false, $('<canvas/>').attr('width', this.options.width, 'height', this.options.height)]);
    }
    
    this.faceAlgorithmNames = _.keys(pat.config.faceAlgorithms);
    this.faceAlgorithmOptions = _.values(pat.config.faceAlgorithms);
    

    this.queue = [];

    var drawingIntervalId = null;
    setInterval(function() {
        if (!obj.queue.length || drawingIntervalId) {
            return;
        }
        drawingIntervalId = setInterval(function() {
            for (var i = threads.length - 1; i >= 0; --i) {
                if (!obj.queue.length) // nothing left to render
                    break;
                
                var thread = threads[i];
                //console.log(i, thread);
                if (thread[0] == true) // thread is busy
                    continue;
                
                thread[0] = true; // mark thread as busy
                setTimeout(function() {
                    obj._render(thread, obj.queue.shift());
                }, 1);
            }
            
            if (!obj.queue.length) {
                clearInterval(drawingIntervalId);
                drawingIntervalId = null;
            }
        }, INTERVAL_DRAWING);
    }, INTERVAL_WAITING);
};

pat.InfolistThumbnailGenerator.TYPE_NONE = 0;
pat.InfolistThumbnailGenerator.TYPE_RESPONSES = 1;
pat.InfolistThumbnailGenerator.TYPE_FACES = 2;

/**
 * Add job to the rendering queue
 * @param data
 * @param options
 * @param fallback function to be executed when the rendering has finished
 */
pat.InfolistThumbnailGenerator.prototype.appendToQueue = function(data, options, fallback) {
    this.queue.push([data, options || {}, fallback]);
};
pat.InfolistThumbnailGenerator.prototype.prependToQueue = function(data, options, fallback) {
    this.queue.unshift([data, options || {}, fallback]);
};

pat.InfolistThumbnailGenerator.prototype.resortQueue = function(priorityFunction) {
    this.queue = _.sortBy(this.queue, priorityFunction);
};

/**
 * Renders a given queue element with a given thread
 */
pat.InfolistThumbnailGenerator.prototype._render = function(thread, queueElement) {
    var obj = this;
    
    thread[0] = true;
    thread[1].clearCanvas();
    if (this.options.backgroundColor) {
        thread[1].drawRect({
           fillStyle: this.options.backgroundColor,
           x: 0, y: 0,
           width: this.options.width, height: this.options.height,
           fromCenter: false
        });
    }

    var optionType = queueElement[1] ? queueElement[1].type : pat.InfolistThumbnailGenerator.TYPE_NONE;

    // Drawing photo responses
    if (optionType == pat.InfolistThumbnailGenerator.TYPE_RESPONSES) {
        
        var optionTimeScaling = queueElement[1] ? queueElement[1].timeScaling : false;
        
        // Draw the baseline
        if (optionTimeScaling && pat.config.flatLinesInTimeScaling) {
            var baselineObj = _.extend({
                x1: pat.config.applyPaddingToTimeBaseline ? obj.options.canvasPadding[3] : 0, y1: 0,
                x2: pat.config.applyPaddingToTimeBaseline ? obj.options.width - obj.options.canvasPadding[1] : obj.options.width, y2: 0
            }, obj.options.defaultBaselineStyle);
            thread[1].drawLine(baselineObj);
        }
        
        // Responses
        _.each(queueElement[0].photoResponses, function(photoResponse, i) {
            // The drawLine() object
            var drawObj = _.extend({}, obj.options.defaultLineStyle);
    
            // Drawing flat lines in time scaling
            if (optionTimeScaling && pat.config.flatLinesInTimeScaling) {
                
                // Calculate y of the line
                var y = obj._questionToY(pat.config.questions[pat.config.questions.length - 1], true, photoResponse.duration);
                if (y > obj.options.height - obj.options.canvasPadding[2]) {
                    y = obj.options.height - obj.options.canvasPadding[2];
                }
                drawObj['x1'] = obj.options.canvasPadding[3];
                drawObj['x2'] = obj.options.width - obj.options.canvasPadding[1];
                drawObj['y1'] = y;
                drawObj['y2'] = y;
            // Drawing zigzags
            } else {
                // Get points of answers
                var pts = [];
                    
                _.each(pat.config.questions, function(question) {
                    pts.push(obj._qaToCoords(photoResponse, question, optionTimeScaling));
                });
                
                //Add the points from the array to the object
                for (var p=0; p<pts.length; p+=1) {
                  drawObj['x'+(p+1)] = pts[p][0];
                  drawObj['y'+(p+1)] = pts[p][1];
                }
            }
            
            // Draw the line
            thread[1].drawLine(drawObj);
        });
        
    // Drawing face rectangles
    } else if (optionType == pat.InfolistThumbnailGenerator.TYPE_FACES) {
        var currentPadding = this.options.canvasPaddingForFaces;
        
        var optionSize = queueElement[1] ? queueElement[1].size : 0;
        var facesBundle = pat.config.visibleFaceBundle;
        if (optionSize) {
            facesBundle = 'faces' + optionSize;
        }

        thread[1].drawRect({
            fillStyle: "rgba(0, 0, 0, 0.05)",
            x: obj._normalToX(0, false, currentPadding), y: obj._normalToY(0, false, currentPadding),
            width: obj._normalToX(1, true, currentPadding),
            height: obj._normalToY(1, true, currentPadding),
            fromCenter: false
          });

        var faces = queueElement[0][facesBundle];
        if (faces) {
            for(var i = 0; faces[i] != undefined; ++i) {
                var currentAlgorithmFaces = faces[i];
                if (!obj.faceAlgorithmOptions[i].visible) {
                    continue;
                }
                for (var j = currentAlgorithmFaces.length - 1; j >= 0; --j) {
                    var currentFaceCoordinate = currentAlgorithmFaces[j];
                    
                    thread[1].drawRect({
                        strokeStyle: obj.faceAlgorithmOptions[i].colorThumbnail,
                        strokeWidth: 1,
                        fillStyle: obj.faceAlgorithmOptions[i].colorThumbnail,
                        x: obj._normalToX(currentFaceCoordinate[0], false, currentPadding), y: obj._normalToY(currentFaceCoordinate[1], false, currentPadding),
                        width: obj._normalToX(currentFaceCoordinate[2], true, currentPadding),
                        height: obj._normalToY(currentFaceCoordinate[3], true, currentPadding),
                        fromCenter: true
                    });
                }
            }
        }
    }
    
    var img = thread[1].get(0).toDataURL("image/png"); 
    
    // Call fallback function when finished
    if (_.isFunction(queueElement[2])) {
        queueElement[2].call(this, img);
    }
    
    // Mark thread as free
    thread[0] = false;
};
  
/* Data to Screen conversion */
pat.InfolistThumbnailGenerator.prototype._answerToX = function(answer, question) {
    var dx = (pat.config.answerSequencesLength === 1) ? 1 : (this.options.width - this.options.canvasPadding[1] - this.options.canvasPadding[3]) / (pat.config.answerSequencesLength - 1);
    return _.indexOf(pat.getAnswerSeq(question), answer) * dx + this.options.canvasPadding[3];
};
    
pat.InfolistThumbnailGenerator.prototype._questionToY = function(question, timeScaling, duration) {
    var dy = (pat.config.questions.length === 1) ? 1 : (this.options.height - this.options.canvasPadding[0] - this.options.canvasPadding[2]) / (pat.config.questions.length - 1);
    if (timeScaling) {
        if (duration > 0) {
            dy *= duration / MAX_TIME;
        } else {
            dy = 0;
        }
    }
    return _.indexOf(pat.config.questions, question) * dy + this.options.canvasPadding[0];
};

pat.InfolistThumbnailGenerator.prototype._qaToCoords = function(photoResponse, question, timeScaling) {
   return [this._answerToX(photoResponse[question], question), this._questionToY(question, timeScaling, photoResponse.duration)];
};
})();


pat.InfolistThumbnailGenerator.prototype._normalToX = function(value, lengthOnly, padding) {
    return (lengthOnly ? 0 : padding[1]) + (this.options.width - padding[1] - padding[3]) * value;
};
    
pat.InfolistThumbnailGenerator.prototype._normalToY = function(value, lengthOnly, padding) {
    return (lengthOnly ? 0 : padding[0]) + (this.options.height - padding[0] - padding[2]) * value;
};
