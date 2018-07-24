// Handlers
$(document).ready(function () {
	// General init stuff
	$("#SongListContainer caption").text("Select a Soundtrack to view Songs!");
    
    /*$("#OstTree li:has(ul)").find("span").click(function () {
        $(this).parent().children().toggle();
        $(this).toggle();
    });*/
	
	$("#OstTreeContainer").jstree();
    
    
    var songsTbl = $("#SongListTbl").DataTable({
        "scrollY":        "500px",
        "scrollCollapse": true,
        "paging":         true,
        "pageLength":	  500,
        "lengthChange":	  false,
        "autoWidth": 	  false
    });

    var queueTbl = $("#QueueTbl").DataTable({
        "scrollY":        "500px",
        "scrollCollapse": true,
        "paging":         false,
        "ordering":	  false,
        "searching": false
    });
    
    // attach HideOnCooldown checkbox to songs tbl
    var hideOnCooldownDiv = document.createElement("div");
    var hideOnCooldownBox = document.createElement("input");
    var hideOnCooldownLabel = document.createElement("label");
    
    hideOnCooldownDiv.setAttribute("class", "HideOnCooldownBox");
    hideOnCooldownBox.setAttribute("type", "checkbox");
    hideOnCooldownLabel.textContent = "Hide songs on cooldown";
    
    hideOnCooldownBox.onChange = function() {
    	var ost = $('#OstTreeContainer').jstree('get_selected', true)[0].text;
    	if(ost && ost.length === 0) { // valid OST selected
    		var hideCooldown = hideOnCooldownBox1.checked;
    		handleOstSelect(ost, hideCooldown);
    	}
    }
    
    hideOnCooldownDiv.appendChild(hideOnCooldownBox);
    hideOnCooldownDiv.appendChild(hideOnCooldownLabel);
//    $("#SongListTbl_wrapper").insertBefore(hideOnCooldownDiv, $("#SongListTbl_wrapper:first-child"));
    $("#SongListTbl_wrapper").prepend(hideOnCooldownDiv);
    
    fetchQueue(queueTbl);
    setInterval(fetchQueue, 3000, queueTbl); // setting this timing too low possibly causes the page to never load?

  //alert(JSON.stringify(queueTbl));

    openTab(null, "NewsContainer");

    // collapse everything down to the OST level
	// $("#OstTree .ostParent:not(:has(.ostParent)) > span").click();
});

// Fetches data for the OST specified by `ost`
function handleOstSelect(ost, hideCooldown) {
    var getParams = {};
    var songsTbl = $("#SongListTbl").DataTable();
    getParams["ost"] = ost;
    getParams["ignoreCooldown"] = hideCooldown;
    
    $.get("/kkdystrack/php/get_songs_by_ost.php", getParams)
		.done( function(raw) {
            var data = JSON.parse(raw).data;
			songsTbl.clear().draw();
    		$("#SongListContainer caption").text("Soundtrack: ".concat(ost))
      		for(i=0; i<data.length; i++) {
				addSongToTbl(data[i], songsTbl);
    		}
    		songsTbl.draw();
    	});
}



function addSongToTbl(songdata, tbl) {
	var row = document.createElement("tr");
	var costNum = parseInt(songdata.cost);
	row.setAttribute("data-songid", songdata.song_id);
	
	var song_name = document.createElement("td");
	song_name.textContent = songdata.song_name;

	var song_length = document.createElement("td");
	song_length.textContent = moment().startOf('day').seconds(songdata.song_length).format('mm:ss');

	var cost = document.createElement("td");
	cost.textContent = costToStatus(costNum);

	var rating = document.createElement("td");
	rating.textContent = fmtRatingDisp(songdata.rating_num, songdata.rating_pct);

	var last_play = document.createElement("td");
	last_play.textContent = songdata.last_play != null ? songdata.last_play : "(No Plays)";

	var times_played = document.createElement("td");
	times_played.textContent = songdata.times_played;

	if(costNum >= 0) {
		row.classList.add("canSelect");
		row.addEventListener("click", function() {
			// Possibly replace with something nicer later
			var str = "Add \"" +songdata.ost_name+ " - " +songdata.song_name+ "\" to the queue for " +songdata.cost +" rupees?";
			if(confirm(str)) {
	            var postParams = {};
	            postParams["song_id"] = songdata.song_id;
	            
	            $.post("kkdystrack/php/proc_request.php", postParams)
	            	.done( function(raw) {
	                	var data = JSON.parse(raw);
	                	if(data.cost >= 0) {
							var res = "Success! \"" +songdata.ost_name+ " - " +songdata.song_name+ "\" was added to the queue! ";
							if(data.eta > 0) {
								res += "It should play at approximately ";
								res += fmtEta(data.eta);
							} else {
								res += "We can't determine when it will play, though...";
							}
							alert(res);
	                   	} else {
	                       	alert("There was an issue processing your request, so your song could not be added. Reason: " + costToStatus(parseInt(data.cost)));
	                   	}
	            	});
			}
		});
	} else {
		row.classList.add("cannotSelect");
	}

	row.append(song_name, song_length, cost, rating, last_play, times_played);
	tbl.row.add(row);
}


function fmtRatingDisp(num, pct) {
	if(num == 0) {
		return "No Votes";
	} else {
		var voteStr = num == 1 ? ")" : "s)";
		return (pct*5).toFixed(1) +"/5 ("+ num.toString() +" vote" +voteStr;
	}
}



function fetchQueue(tbl) {
    $.get("/queue.json")
    	.done( function(raw) {
    		tbl.clear()
    		for(i=0; i<raw.length; i++) {
    			addQueueEntryToTbl(raw[i], tbl);
    		}
    		tbl.draw();
    	});
}




function addQueueEntryToTbl(songdata, tbl) {
	var row = document.createElement("tr");
	row.setAttribute("data-songid", songdata.song_id);
	
	var disp_name = document.createElement("td");
	disp_name.textContent = songdata.disp_name;

	var song_length = document.createElement("td");
	song_length.textContent = moment().startOf('day').seconds(songdata.song_length).format('mm:ss');

	var username = document.createElement("td");
	username.textContent = songdata.username;

	var rating = document.createElement("td");
	rating.textContent = fmtRatingDisp(songdata.rating_num, songdata.rating_pct);

	var last_play = document.createElement("td");
	last_play.textContent = songdata.last_play != null ? songdata.last_play : "(No Plays)";

	var times_played = document.createElement("td");
	times_played.textContent = songdata.times_played;

	var eta = document.createElement("td");
	eta.textContent = fmtEta(songdata.eta);

	row.append(disp_name, song_length, username, rating, last_play, times_played, eta);
	tbl.row.add(row);
}


/**
 * Converts a numeric cost code to the display representation
 * @param cost
 * @returns
 */
function costToStatus(cost) {
	var costAdj;
	if(cost < 0) {
		switch(cost) {
		case -1: // song on cooldown
			costAdj = "On Cooldown";
			break;
		case -2: // Already Queued
			costAdj = "Already Queued";
			break;
		// case -3:
		case -6: // User Banned
			costAdj = "You aren't allowed to request";
			break;
		case -8: // queue closed
			costAdj = "Song requests are currently closed.";
			break;
		default: // other server error
			costAdj = "Server Error: ";
			costAdj += cost;
		break;
		}
	} else {
		costAdj = cost;
	}
	return costAdj;

}


function fmtEta(unixtime) {
	if(unixtime > 0) {
		return moment.unix(unixtime).format('h:mm A');
	} else {
    	return "Unknown";
	}
}



function openTab(event, toShow) {
	// hide all the tabs to start, and show the one we want
	$(".TabElement").hide();
	$("#" +toShow).show();

	// have to redraw the queue table for some reason
	if(toShow == "QueueContainer") {
		$("#QueueTbl").DataTable().draw();
	} else if(toShow == "RequestsContainer") {
		$("#SongListTbl").DataTable().draw();
	}
	
	if(event != null) {
		$(".TabLink").removeClass("active");
		event.currentTarget.className += " active";
	}
}
