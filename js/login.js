$(document).ready(function() {
	$(".login_popup").hide();
	
	$(".login_pfp_thumbnail").click(function() {
		$(".login_popup").show();
	});
	
	$(document).click(function(evt) {
		$(".login_popup").hide();
	});
	
	$(".login_container").click(function(evt) {
		evt.stopPropagation();
	});
	
	
});