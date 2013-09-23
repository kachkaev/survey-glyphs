(function(){

var LOCALSTORAGEKEY_HELPTAB = 'pat.b-help.current';

$.widget('pat.bHelp', {

    options: {
        tab: null,
        popupHTML: '',
        state: 0
    },
    
	_create: function() {
        
		var w = {
				_self: this,
				$element: this.element,
				options: this.options
			};
		this.w = w;

        // Improve indents in the body
		var $tabBodies = w.$element.find('.b-help__tab-bodies');
        var tabBodiesHTML = $tabBodies.html();
        tabBodiesHTML = tabBodiesHTML.replace(/ \(/g, '<i class="t-bracket-space"> </i><i class="t-bracket">(</i>');
        $tabBodies.html(tabBodiesHTML);
        

	    // =====================================
	    // Objects with UI
	    // =====================================

		w.$closer = $('<div/>').addClass('b-help__closer').appendTo(w.$element);
		w.$fadeGradientTop = $('<div/>').addClass('b-help__fade-gradient_top').appendTo(w.$element);
		w.$fadeGradientBottom = $('<div/>').addClass('b-help__fade-gradient_bottom').appendTo(w.$element);
        w.$blind = $('<div/>').addClass('b-help__blind').hide().appendTo('body');
        w.$animation = $('<div/>').addClass('b-help__animation');
        w.$tabs = w.$element.find('.b-help__tab');
        w.$tabBodies = w.$element.find('.b-help__tab-body');
        
        if (w.$element.is(':visible')) {
            w.options.state = 1;
            w.$blind.show();
        }
        
        // Read current tab from localstorage
        w.options.tab = localStorage.getItem(LOCALSTORAGEKEY_HELPTAB);
        
        // Move the closer to the left on Windows
        if (navigator && navigator.appVersion && navigator.appVersion.indexOf("Win") != -1) {
            w.$closer.addClass('b-help__closer_windows');
        }

        w.$fadeGradientTop.css('right', pat.ScrollHelper.scrollbarWidth);
        w.$fadeGradientBottom.css('right', pat.ScrollHelper.scrollbarWidth);
        
        // =====================================
        // Event handling
        // =====================================

        // The closer and the blind 
        w.$closer.add(w.$blind).click(function() {
            w._self.close();
        });
        
        // Click on tab selects it
        w.$tabs.click(function() {
           var $this = $(this);
           if ($this.hasClass('b-help__tab_current')) {
               return;
           }
           w._self.switchTabTo($this.data('id'));
        });
	},
	
	switchTabTo: function(tabId, instant) {
	    var w = this.w;
	    
	    var $tab = w.$tabs.filter('[data-id="'  + tabId + '"]');
	    var $tabBody = w.$tabBodies.filter('[data-id="'  + tabId + '"]');
	    
	    if (!$tab.length || !$tabBody.length) {
	        throw new Error('Tab with id "'+tabId+'" does not exist.');
	    }
	    
	    w.$tabs.removeClass('b-help__tab_current');
	    $tab.addClass('b-help__tab_current');
	    setTimeout(function() {
	        $tabBody.scrollTop(0).scrollLeft(0);
	    }, 10);
	    if (instant) {
	        w.$tabBodies.hide();
	        $tabBody.show();
	    } else {
            w.$tabBodies.not($tabBody).stop(true, true).fadeOut();
            $tabBody.stop(true, true).fadeIn();
	    }
	    w.options.tab = tabId;
	    localStorage.setItem(LOCALSTORAGEKEY_HELPTAB, tabId);
	},
	
	open: function() {
        var w = this.w;
        
        if (w.options.state != 0)
            return;
        w.options.state = -1;

        // lock scroll position, but retain settings for later
        pat.ScrollHelper.lockBodyScrollPosition();
        
        // Switch to the first tab if the current tab cannot be not found
        var tab = w.options.tab;

        if (!w.$tabs.filter('[data-id="'  + w.options.tab + '"]').length) {
            tab = w.$tabs.first().attr('data-id');
        }
        w._self.switchTabTo(tab, true);

        // Fade both the element and the blind
	    w.$blind.add(w.$element).fadeIn(function() {
	        w.options.state = 1;
	    });
	},
	
	close: function(callback) {
        var w = this.w;
        
        if (w.options.state == 0 || (w.options.state == -2)) {
            if (_.isFunction(callback)) {
                callback.call();
            }
            return;
        }
        w.options.state = -2;
        
        // Fade both the element and the blind
        w.$blind.add(w.$element).fadeOut(function() {
            w.options.state = 0;
            
            // unlock scroll position
            pat.ScrollHelper.unlockBodyScrollPosition();

            if (_.isFunction(callback)) {
                callback.call();
            }
        });
	},
	
	/**
	 * 1 - open, 0 - close, -1 - changing the state
	 */
	getState: function() {
	    return this.options.state;
	},
	
    _setOption: function (key, value) {
        var w = this.w;
        
        // Check if such option exists, throw an error if not
        if (!w.options.hasOwnProperty(key)) {
            throw "Option " + key + " does not exist";
        }
        
        // Check if value matches what it was, do nothing if yes
        if (value === w.options[key] || (_.isArray(value) && _.isEqual(value, w.options[key]))) {
            return;
        }
        
        // Save old option value
        var prev = w.options[key];
        
        // Apply the option
        this._super(key, value);
        
        // Call corresponding update method depending on the option key
        switch (key) {
        
        case 'popupHTML':
            throw new Error('Property popupHTML is read-only');

        case 'state':
            throw new Error('Property state is read-only');

        case 'tab':
            throw new Error('Property tab is read-only');

        case '':
            break;
        }
        
        // console.log("event: change" + key.toLowerCase(), {newValue: value, prevValue: prev});
        w._self._trigger("change" + key.toLowerCase(), null, {newValue: value, prevValue: prev});
    }
});
}());