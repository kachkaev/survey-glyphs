(function(){
namespace('pat');

var INTERVAL_WAITING = 200;
var INTERVAL_DRAWING = 10;
    

pat.PatternThumbnailGenerator = function(options) {
    var obj = this;
    
    this.options = _.extend({
        width: 15,
        height: 15,
        canvasPadding: [1, 1, 1, 1],
        threads: 30,
        defaultLineStyle: {
                strokeStyle: "rgba(0,0,0,0.15)",
                strokeWidth: 1,
                rounded: true
            }
    }, options);
    
    var threads = [];
    for (var i = this.options.threads - 1; i >= 0; --i) {
        // [0] is busy, [1] canvas 
        threads.push([false, $('<canvas/>').attr('width', this.options.width, 'height', this.options.height)]);
    }
    
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
            //console.log('aaaaa', obj.queue.length);
        }, INTERVAL_DRAWING);
        //console.log('bbb');
    }, INTERVAL_WAITING);
};

/**
 * Add job to the rendering queue
 * @param photoResponses
 * @param options
 * @param fallback function to be executed when the rendering has finished
 */
pat.PatternThumbnailGenerator.prototype.addToQueue = function(photoResponses, options, fallback) {
    this.queue.push([photoResponses, options, fallback]);
};

/**
 * Renders given queue element with a given thread
 */
pat.PatternThumbnailGenerator.prototype._render = function(thread, queueElement) {
    var obj = this;
    
    thread[0] = true;
    thread[1].clearCanvas();

    // Responses
    _.each(queueElement[0], function(photoResponse, i) {
        //if (i > 1) return;
        // Get points of answers
        var pts = [];
        _.each(pat.config.questions, function(question) {
            pts.push(obj._qaToCoords(photoResponse, question));
        });
        
        // The drawLine() object
        var drawObj = _.extend({}, obj.options.defaultLineStyle);
        //Add the points from the array to the object
        for (var p=0; p<pts.length; p+=1) {
          drawObj['x'+(p+1)] = pts[p][0];
          drawObj['y'+(p+1)] = pts[p][1];
        }

        // Draw the line
        thread[1].drawLine(drawObj);
    });
    
    var img = thread[1].get(0).toDataURL("image/png"); 
    
    // Call fallback function when finished
    if (_.isFunction(queueElement[2])) {
        queueElement[2].call(this, img);
    }
    
    // Mark thread as free
    thread[0] = false;
};
  
/* Data to Screen conversion */
pat.PatternThumbnailGenerator.prototype._answerToX = function(answer, question) {
    var dx = (pat.config.answerSequencesLength === 1) ? 1 : (this.options.width - this.options.canvasPadding[1] - this.options.canvasPadding[3]) / (pat.config.answerSequencesLength - 1);
    return _.indexOf(pat.getAnswerSeq(question), answer) * dx + this.options.canvasPadding[3];
};
    
pat.PatternThumbnailGenerator.prototype._questionToY = function(question) {
    var dy = (pat.config.questions.length === 1) ? 1 : (this.options.height - this.options.canvasPadding[0] - this.options.canvasPadding[2]) / (pat.config.questions.length - 1);
    return _.indexOf(pat.config.questions, question) * dy + this.options.canvasPadding[0];
};

pat.PatternThumbnailGenerator.prototype._qaToCoords = function(photoResponse, question) {
   return [this._answerToX(photoResponse[question], question), this._questionToY(question)];
};
})();