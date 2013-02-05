/**
 * Allows to undo or redo actions for a given property of a given object
 * 
 * Borrowed from energy-consumption-signature-viewer project
 * @version 2013-02-05 
 * 
 * @constructor
 */
ObjectPropertyStateManager = function (object, property, localStoragePrefix, validationFunction) {
    this.object = object;
    this.property = property;
    this.localStoragePrefix = localStoragePrefix;
    this.validationFunction = validationFunction;
    
    this.queueChanged = new signals.Signal();
    this.valueChanged = new signals.Signal();
    this._lastCapturedValue = undefined;
    this._undoStack = [];
    this._redoStack = [];
    this._lastCapturedValue = this.object[this.property];

    this._loadStacksFromLocalStorageIfNeeded();
    this.queueChanged.add(this._saveStacksToLocalStorageIfNeeded, this);
};

ObjectPropertyStateManager.prototype.maxUndoCount = 50;

ObjectPropertyStateManager.prototype.reset = function() {
};

/**
 * Captures a new state
 * @param {Object} action (optional) Parameters of the action performed
 */
ObjectPropertyStateManager.prototype.capture = function(action) {
    action = $.extend({
        type: null,
        options: null
    }, action);

    var capturedValue = this.object[this.property];

    if (_.isEqual(capturedValue, this._lastCapturedValue)) {
        return false;
    }
    
    //if (this._undoStack.length && _.isEqual(this._undoStack[0].value, capturedValue)) {
    //    return false;
    // }

    this._undoStack.push({
        action: action,
        value: this._lastCapturedValue
    });
    
    if (this._redoStack.length && _.isEqual(this._redoStack[0].value, capturedValue)) {
        this._redoStack.shift();
    } else {
        this._redoStack = [];
    }
    
    while (this.maxUndoCount && this._undoStack.length > this.maxUndoCount)
        this._undoStack.shift();
    
    this._lastCapturedValue = capturedValue;
    this.queueChanged.dispatch();
    return true;
};

/**
 * Makes a redo of previously undone action.
 * @returns true if redo performed, false if there was nothing to redo
 */
ObjectPropertyStateManager.prototype.redo = function() {
    if (!this.canRedo())
        return false;

    var diff = this._redoStack.pop();
    
    var unDiff = {
            action: diff.action,
            value: this.object[this.property]
    };
    
    this._undoStack.push(unDiff);
    this.object[this.property] = diff.value;
    this._lastCapturedValue = diff.value;
    this.valueChanged.dispatch(diff.value);
    this.queueChanged.dispatch();

    return true;
};

/**
 * Makes an undo of a previously performed action.
 */
ObjectPropertyStateManager.prototype.undo = function() {
    if (!this.canUndo())
        return false;

    var diff = this._undoStack.pop();
    
    var unDiff = {
            action: diff.action,
            value: this.object[this.property]
    };
    
    this._redoStack.push(unDiff);
    this.object[this.property] = diff.value;
    this._lastCapturedValue = diff.value;
    this.valueChanged.dispatch(diff.value);
    this.queueChanged.dispatch();

    return true;
};

/**
 * Checks whether redo is possible.
 */
ObjectPropertyStateManager.prototype.canRedo = function() {
    return !!this._redoStack.length;
};

/**
 * Checks whether undo is possible.
 */
ObjectPropertyStateManager.prototype.canUndo = function() {
    return !!this._undoStack.length;
};

/**
 * Returns number of redo commands possible.
 */
ObjectPropertyStateManager.prototype.getRedoCount = function() {
    return this._redoStack.length;
};

/**
 * Returns number of redo commands possible.
 */
ObjectPropertyStateManager.prototype.getUndoCount = function() {
    return this._undoStack.length;
};


ObjectPropertyStateManager.prototype.validate = function(skipEventDispatching) {
    if (!_.isFunction(this.validationFunction))
        return;
    
    // TODO implement .validate()
    
    if (!skipEventDispatching) {
        this.queueChanged.dispatch();
    }
};

ObjectPropertyStateManager.prototype._loadStacksFromLocalStorageIfNeeded = function() {
    // Load undos
    var newUndoStack = [];
    for (var i = 1; ; ++i) {
        var value = localStorage[this._localstorageKey(-i)];
        if (_.isUndefined(value) || i > this.maxUndoCount)
            break;
        try {
            value = JSON.parse(value);
        } catch (e) {
            break;
        }
        newUndoStack.push(value);
    }
    // Load redos
    var newRedoStack = [];
    for (var i = 1; ; ++i) {
        var value = localStorage[this._localstorageKey(i)];
        if (_.isUndefined(value) || i > this.maxUndoCount)
            break;
        try {
            value = JSON.parse(value);
        } catch (e) {
            break;
        }
        newRedoStack.push(value);
    }
    this._undoStack = newUndoStack;
    this._redoStack = newRedoStack;
    this.validate(true);
};

ObjectPropertyStateManager.prototype._saveStacksToLocalStorageIfNeeded = function() {
    if (!this.localStoragePrefix)
        return;
    
    // Erase existing data
    for (var i = this.maxUndoCount; i > 0; --i) {
        localStorage.removeItem(this._localstorageKey(i));
        localStorage.removeItem(this._localstorageKey(-i));
    }
    
    // Save undos
    for (var i = this._undoStack.length; i > 0; --i) {
        localStorage[this._localstorageKey(-i)] = JSON.stringify(this._undoStack[i - 1]);
    }

    // Save redos
    for (var i = this._redoStack.length; i > 0; --i) {
        localStorage[this._localstorageKey(i)] = JSON.stringify(this._redoStack[i - 1]);
    }
};

ObjectPropertyStateManager.prototype._localstorageKey = function (i) {
    return this.localStoragePrefix + '.' + i;
};