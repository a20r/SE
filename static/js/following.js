$(document).ready(function() {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
  		createCookie();
		loadFollowing();
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
})

function createCookie() {
	var value = "username";
	document.cookie = "username=username";

}

function loadFollowing() {
	var username = document.getElementById("username");
	var cookieUsername = getUsernameCookie();
	if (cookieUsername == null) {
		return;
	}

	username.innerHTML = cookieUsername;
	var reader = new XMLHttpRequest();
	reader.open('GET', '../profiles/key.csv');
	reader.onreadystatechange = function() {
		if (reader.readyState != 4) {
			return;
		}
		var csv = reader.responseText;
		var data = $.csv.toArrays(csv);
		var stocks = new Array();
		var index = 0;
		for (var row in data) {
			if (data[row][0].localeCompare(cookieUsername) == 0) {
				stocks[index] = new Array();
				stocks[index][0] = data[row][1];
				stocks[index][1] = data[row][2];
				index++;
			}
		}
		createFollowingTable(stocks);
	}
	reader.send();
}

function createFollowingTable(stocks) {
	var table = document.getElementById('stocks');
	for (var stock in stocks) {
		addRow(stocks[stock][0], stocks[stock][1], table);
	}
}

function addRow(symbol, name, table) {
	var reader = new XMLHttpRequest();
	reader.open('GET', '../data/' + symbol + '.csv');
	reader.onreadystatechange = function () {
		if (reader.readyState != 4) {
			return;
		}
		var csv = reader.responseText;
		var data = $.csv.toArrays(csv);
		var html = '<tr>\r\n' +
				'<td>' + name + '</td>\r\n'
				'<td>' + symbol + '</td>\r\n';
		var index = 0;
		for (index = 0; index < 6; index++) {
			html += '<td>'  + data[1][index] + '</td>\r\n';
		}
		html += '</tr>\r\n';
		table.innerHTML += html;
	}
	reader.send();
}

function getUsernameCookie() {
	var cookies = document.cookie;
	var start = cookies.indexOf(" usernames=");
	if (start == -1) {
		start = cookies.indexOf("username=");
	}
	if (start == -1) {
		cookies = null;
	} else {
		start = cookies.indexOf("=", start) + 1;
		var end = cookies.indexOf(";", start);
		if (end == -1) {
			end = cookies.length;
		}
		cookies = unescape(cookies.substring(start,end));
	}
	return cookies;
}