namespace ('pat');

// Replace body margin:auto with fixed margin to avoid
// http://bugs.jquery.com/ticket/5445
pat.fixWebkitJqueryPositionBug = function(){
    var $body = $('body');
    
    var $html = $('html');
    var initialBodyPaddingLeft = parseInt($body.css('paddingLeft'), 10);
    var initialBodyPaddingRight = parseInt($body.css('paddingRight'), 10);
    $body = $('body').css('marginLeft', 0);
    var updateBodyLeftPos = function() {
        $body.css('paddingLeft', initialBodyPaddingLeft + ($html.outerWidth() - $body.width() - initialBodyPaddingLeft - initialBodyPaddingRight) / 2);
    };
    $(window).resize(updateBodyLeftPos);
    updateBodyLeftPos();
};