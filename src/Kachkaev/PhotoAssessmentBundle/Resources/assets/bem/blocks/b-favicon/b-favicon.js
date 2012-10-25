$(function(){
	// Changes favicon on fly when the window is blured and focused again (just for decoration)
	var $favicon = $('.b-favicon');
	if ($favicon.size() == 0)
		return;
	
	var $head = $('head');
	
	$(window).focus(function() {
		$favicon.remove().attr('href', '/favicon.ico').appendTo($head);
	}).blur(function() {
		$favicon.remove().attr('href', '/favicon_inactive.ico').appendTo($head);
	});
});