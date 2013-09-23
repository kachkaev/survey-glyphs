namespace('pat');

(function() {

pat.ScrollHelper = {
};

/**
 * @memberOf pat.ScrollHelper
 */
pat.ScrollHelper.getScrollPosition = function () {
    return [
          self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
          self.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop
        ];
};

/**
 * @memberOf pat.ScrollHelper
 */
pat.ScrollHelper.lockBodyScrollPosition = function() {
    var scrollPosition = pat.ScrollHelper.getScrollPosition();
    var $html = $('html'); // it would make more sense to apply this to body, but IE7 won't have that
    var $body = $('body');
    var $grid = $('.b-signature-grid');
    var $window = $(window);
    $html.data('scroll-position', scrollPosition);
    $html.data('previous-overflow', $html.css('overflow'));
    $html.data('previous-style', $html.attr('style'));
    
    var hasHorisontalScrollBar = 0;
    var hasVerticalScrollBar = 0;
    if ($html.get(0).scrollHeight > $window.height()) {
        hasVerticalScrollBar = 1;
    }
    if ($html.get(0).scrollWidth > $window.width()) {
        hasHorisontalScrollBar = 1;
    };
   
    $html.css({
            'overflow': 'hidden',
            'padding-right': '10000px',
            'padding-bottom': '10000px'
        });
    window.scrollTo(
            scrollPosition[0],
            scrollPosition[1]
        );
};

/**
 * @memberOf pat.ScrollHelper
 */
pat.ScrollHelper.unlockBodyScrollPosition = function() {
    var $html = jQuery('html');
    var scrollPosition = $html.data('scroll-position');
    if (!scrollPosition) {
        return;
    }
    if (_.isString($html.data('previous-style'))) {
        $html.attr('style', $html.data('previous-style'));
    } else {
        $html.removeAttr('style');
    }
    window.scrollTo(scrollPosition[0], scrollPosition[1]);
    $html.removeData('previous-overflow');
    $html.removeData('previous-style');
    $html.removeData('scroll-position');
};

/**
 * @memberOf pat.ScrollHelper
 * @link http://jdsharp.us/jQuery/minute/calculate-scrollbar-width.php
 */
pat.ScrollHelper.scrollbarWidth = function() {
    var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
    // Append our div, do our calculation and then remove it
    $('body').append(div);
    var w1 = $('div', div).innerWidth();
    div.css('overflow-y', 'scroll');
    var w2 = $('div', div).innerWidth();
    $(div).remove();
    return w1 - w2; 
}();

}());
