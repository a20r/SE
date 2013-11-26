
$(document).ready(function() { 
	checkLogin();
	checkFollowedButton();
	loadPage($.cookie("index"));
	$("#buttonFollowStyle").click(follow);
});


function checkFollowedButton() {
	var button = document.getElementById("buttonFollow");
	var loginCookie = $.cookie("stock_auth_token");
	alert(loginCookie)
	if (loginCookie == undefined || loginCookie.length <= 0) {
		button.style.display = "none";
		console.log("No login cookie 1");
	} else {
		$.getJSON("/get_following", function(jsonObj) {
			if (jsonObj.length > 0) {
				button.style.display = "";
				console.log("cookie");
				checkFollowing();
			} else {
				console.log("No login cookie");
				button.style.display = "none";
			}
		});
	}
}

function loadPage(index){
	$.getJSON("/get_stocks/" + index, function (jsonObj){
		console.log(jsonObj);
		document.getElementById('name').innerHTML = "<strong>" + jsonObj["index"] + "</strong>";
		document.getElementById('name').innerHTML = document.getElementById('name').innerHTML + " " +  jsonObj["name"];
		document.getElementById('CurrentPrice').innerHTML = jsonObj["price"];
		document.getElementById('HighestPrice').innerHTML = jsonObj["fifty_two_week_high"];
		document.getElementById('LowestPrice').innerHTML = jsonObj["fifty_two_week_low"];
		document.getElementById('Change').innerHTML = jsonObj["change"] + "%";
		if (jsonObj["change"] < 0)
			document.getElementById('CurrentPriceArrow').className = "fa fa-arrow-down ArrowDown";
		else
			document.getElementById('CurrentPriceArrow').className = "fa fa-arrow-up ArrowUp";
	});
}

function checkFollowing() {
	var button = document.getElementById("buttonFollowStyle");
	var currentStock = $.cookie("index");
	console.log("The cookie is " + currentStock);
	$.getJSON("/get_following", function (jsonObj) {
		console.log("The following: " + jsonObj);
		for (var index in jsonObj) {
			if (jsonObj[index] == currentStock) {
				button.className = "btn btn-lg btn-primary btn-block UnfollowButton";
				$("#buttonFollowStyle").click(unfollow);
				button.innerHTML = '<i class="fa fa-plus-circle"></i> UNFOLLOW';
				return;
			}
		}
		button.innerHTML = '<i class="fa fa-plus-circle"></i> FOLLOW';
		$("#buttonFollowStyle").click(follow);
		button.className = "btn btn-lg btn-primary btn-block FollowButton";
	});
}

function follow() {
    $.ajax({
        url: "/follow",
        type: "POST",
        data: {
            stock_name: $.cookie("index")
        },
        success: function (obj) {
            console.log(obj);
            checkFollowing();
        }
    });
}

function unfollow() {
	$.ajax({
        url: "/unfollow",
        type: "POST",
        data: {
            stock_name: $.cookie("index")
        },
        success: function (obj) {
            console.log(obj);
            checkFollowing();
        }
    });
}

function checkLogin() {
	var login = document.getElementById("logCond");
	var cookie = $.cookie("stock_auth_token");
	if (cookie != undefined && cookie.length > 0) {
		login.innerHTML = '<a href="javascript:logout();">LOGOUT</a>';
	} else {
		login.innerHTML = '<a href="/login.html">LOGIN</a>';
	}
}

function logout() {
	document.cookie = 'stock_auth_token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	window.location.replace("/main_page.html");
}

