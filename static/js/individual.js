
$(document).ready(function() { 
	checkLogin();
	loadPage($.cookie("index"));
});

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

function follow() {
    $.ajax({
        url: "/follow",
        type: "POST",
        data: {
            stock_name: $.cookie("index")
        },
        success: function (obj) {
            console.log(obj);
        }
    });
}

function checkLogin() {
	var login = document.getElementById("logCond");
	var cookie = document.cookie;
	if (cookie.indexOf("stock_auth_token=") !== -1) {
		var cookieValue = cookie.indexOf(cookie.indexOf("stock_auth_token="));
		if (cookieValue !== -1) {
			login.innerHTML = '<a href="javascript:logout();">LOGOUT</a>'
		} else {
			login.innerHTML = '<a href="/login.html">LOGIN</a>';
		}
	} else {
		login.innerHTML = '<a href="/login.html">LOGIN</a>';
	}
}

