
$(document).ready(function() {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		fillData();
		loadMainPage();
		checkLogin();

	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
})

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

function logout() {
	document.cookie = 'stock_auth_token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	window.location.replace("/main_page.html");
}

var updateTime = 10 * 1000
var updateInterval = setInterval(fillData, updateTime)
var currentPage = 0;
var currentDataInUse;
var allData;

function fillData() {
	allData = new Array();
	$.getJSON("/get_stocks", function (jsonObj) {
		console.log(jsonObj);
		allData = new Array();
		var index = 0;
		var keys = Object.keys(jsonObj);
		for (var key in jsonObj) {
			if (jsonObj.hasOwnProperty(key)) {
				allData[index] = new Array();
				allData[index][0] = key;
				allData[index][1] = Math.floor(jsonObj[key]["price"] * 100) / 100;
				allData[index][2] = jsonObj[key]["change"];
				allData[index][3] = jsonObj[key]["name"];
				index++;
			}
		}

		if (currentDataInUse == undefined) {
		    currentDataInUse = allData;
		} else {
		    for (var i = 0; i < currentDataInUse.length; i++) {
		        var cData = jsonObj[currentDataInUse[i][0]];
		        currentDataInUse[i][1] = Math.floor(cData["price"] * 100) / 100;
		        currentDataInUse[i][2] = cData["change"];
		    }
        }

        loadCurrentValues(currentDataInUse, currentPage);
  		loadPaging(currentDataInUse.length);
	});
}

function loadPaging(dataLength) {
	var paging = document.getElementById("paging");
	var width = Math.ceil(dataLength / 12) * 16;
	paging.style.width = width + 'px';
	var index;
	var html = '<div id=\"page0\" class=\"CurrentPage\"' +
				'onclick=\"pageOnClick(0)\"></div>\r\n';
	var pages = Math.ceil(dataLength / 12);
	currentPage = 0;
	for (index = 1; index < pages; index++) {
		html += '<div id=\"page' + index + '\" class=\"Page\"' +
		'onclick=\"pageOnClick(' + index + ')\"></div>\r\n';
	}
	html += '<div class=\"Last\"></div>';
	paging.innerHTML = html;
}

function pageOnClick(pageClicked) {
	var previousPage = document.getElementById("page" + currentPage);
	previousPage.className = "Page";
	var newCurrentPage = document.getElementById("page" + pageClicked);
	newCurrentPage.className = "CurrentPage";
	loadCurrentValues(currentDataInUse, pageClicked * 12);
	currentPage = pageClicked;
}

function filterCurrent(value) {
	currentDataInUse = new Array();
	var index = 0;
	for (var row in allData) {
		// if (allData[row][0].substring(0, value.length).toLowerCase() 
		// 	== value.toLowerCase() ||
		// 	allData[row][3].substring(0, value.length).toLowerCase()
		// 	== value.toLowerCase()) {
		// 	currentDataInUse[index] = allData[row];
		// 	index++;
		// }
		var symbol = allData[row][0].toLowerCase();
		var name = allData[row][3].toLowerCase();
		value = value.toLowerCase();
		if (symbol.indexOf(value) !== -1 ||
			name.indexOf(value) !== -1) {
			currentDataInUse[index] = allData[row];
			index++;
		}
	}
	loadCurrentValues(currentDataInUse, 0);
	loadPaging(index);
}

function loadCurrentValues(data, start) {
	var currentValues = document.getElementById("currentValues");
	var index;
	var html = '';
	var itemsInPage;
	var indexLastRow;
	if (start + 12 < data.length) {
		itemsInPage = 12;
		indexLastRow = start + 8;
	} else {
		itemsInPage = data.length - start;
		var fullRows = itemsInPage % 4 == 0 ? (itemsInPage / 4) - 1 : 
			Math.floor(itemsInPage / 4);
		indexLastRow = itemsInPage <= 4 ? start : start + fullRows * 4;
	}
	for (index = start; index < start + 12 && index < data.length; index++) {
		if (index >= indexLastRow) {
			html += '<div class=\"ItemPlaceholder BottomRowPlaceholder\">';
		} else {
			html += '<div class=\"ItemPlaceholder\">';
		}
		if ((index + 1) % 4 == 0) {
			html += '<div class=\"LastItemContainer\">\r\n';
		} else {
			html += '<div class=\"ItemContainer\">\r\n';

		}
		html += '<div class=\"Symbol\">' + data[index][0] + '</div>\r\n' +
			'<div class=\"Price\">' + data[index][1] + '</div>\r\n';
		if (data[index][2] > 0) {
			html += '<div class=\"ArrowUp Arrow fa fa-arrow-up\"></div>\r\n';
		} else {
			html += '<div class=\"ArrowDown Arrow fa fa-arrow-down\"></div>\r\n';

		}
		html += '<div class=\"Name\">' + data[index][3] + '</div>\r\n' +
				'<div class=\"VerticalLine\"></div>\r\n';

		html += '</div>\r\n</div>\r\n';
	}

	currentValues.innerHTML = html;
}

function loadMainPage() {
	var stocksTable = document.getElementById("stocks");
	$.getJSON("/get_historical_stocks", function (jsonObj) {
		console.log(jsonObj);
		for (var key in jsonObj) {
			if (jsonObj.hasOwnProperty(key)) {
				var history = jsonObj[key]["history_list"];
				if (history.length > 1) {
					var item = history[0];
					console.log(item);
					var name = jsonObj[key]["name"];
					var change = history[0]["Close"] / history[1]["Close"] * 100 - 100;
					change = Math.round(change * 100) / 100;
					addRow(name, jsonObj[key]["index"], change, history[0]["Open"], 
						history[0]["High"], history[0]["Low"], history[0]["Close"],
						history[0]["Volume"]);
				}
			}
		}
	});
}

function addRow(name, symbol, change, open, high, low, close, volume) {
	var table = document.getElementById("stocksBody");
	var html = '';
	html += '<tr>\r\n' +
		'<td>' + name + '</td>\r\n' +
		'<td>' + symbol + '</td>\r\n';
	if (change < 0) {
		html += '<td> <i class=\'fa fa-caret-down NegativeChange\'>' +
			'</i> ' + change + '% </td>\r\n'; 
	} else if (change > 0) {
		html += '<td> <i class=\'fa fa-caret-up PositiveChange\'>' +
			'</i> ' + change + '% </td>\r\n'; 
	} else {
		html += '<td>' + change + '% </td>\r\n';
	}
	html += '<td>' + open + '</td>\r\n' +
		'<td>' + high + '</td>\r\n' +
		'<td>' + low + '</td>\r\n' +
		'<td>' + close + '</td>\r\n' +
		'<td>' + volume + "</td>\r\n" +
		'</tr>\r\n';
	table.innerHTML += html;
	// var reader = new XMLHttpRequest();
	// reader.open('GET', 'data/' + symbol + '.csv');
	// reader.onreadystatechange = function() {
	// 	if (reader.readyState != 4) {
	// 		return;
	// 	}
	// 	var csv = reader.responseText;
	// 	var data = $.csv.toArrays(csv);
	// 	var html = '';
	// 	html += '<tr onclick=\"onClick(\'' + symbol + '\');\">\r\n' +
	// 			'<td>' + name + '</td>\r\n' +
	// 			'<td>' + symbol + '</td>\r\n';
	// 	var lastDayRow = data[1];
	// 	var nextToLastDayRow = data[2];
	// 	var change = lastDayRow[1] / nextToLastDayRow[4] * 100 - 100;
	// 	var changeString = Math.round(change * 100) / 100;
	// 	if (change < 0) {
	// 		html += '<td> <i class=\'fa fa-caret-down NegativeChange\'>' +
	// 			'</i> ' + changeString + '% </td>\r\n'; 
	// 	} else if (change > 0) {
	// 		html += '<td> <i class=\'fa fa-caret-up PositiveChange\'>' +
	// 			'</i> ' + changeString + '% </td>\r\n'; 
	// 	} else {
	// 		html += '<td>' + changeString + '% </td>\r\n';
	// 	}
	// 	var i;
	// 	for (i = 1; i < 6; i++) {
	// 		html += '<td>' + lastDayRow[i] + '</td>\r\n';
	// 	}
	// 	html += '</tr>\r\n';
	// 	stocksTable.innerHTML += html;
	// };
	// reader.send();

}

function onClick(symbol) {
	var stocksTable = document.getElementById("mainContent");
	stocksTable.className = "HiddenClass";
	var individualStock = document.getElementById("individualStock");
	individualStock.className = "";
	var table = document.getElementById("singleStockTable");
	initialiseTable(table);
	var back = document.getElementById("back");
	back.className = "";
	var reader = new XMLHttpRequest();
	reader.open('GET', 'data/' + symbol + '.csv');
	reader.onreadystatechange = function() {
		if (reader.readyState != 4) {
			return;
		}
		var csv = reader.responseText;
		var data = $.csv.toArrays(csv);
		var html = '';
		var index = 0;
		for(var row in data) {
			if (index > 0) {
				html += '<tr>\r\n';
				var i;
				for (var i = 0; i < 6; i++) {
					html += '<td>' + data[row][i] + '</td>\r\n';
				}
				html += '</tr>\r\n';
			}
			index++;
		}
		table.innerHTML += html;
	}
	reader.send();
}

function initialiseTable(table) {
	table.innerHTML = '<tr>\r\n' + 
				'<th>Trading Day</th>\r\n' + 
				'<th>Opening Price</th>\r\n' + 
				'<th>Trading Day\'s High</th>\r\n' + 
				'<th>Trading Day\'s Low</th>\r\n' + 
				'<th>Closing Price</th>\r\n' + 
				'<th>Volume</th>\r\n' +
				'</tr>';
}

function goBack() {
	var back = document.getElementById("back");
	back.className = "HiddenClass";
	var individualStock = document.getElementById('individualStock');
	individualStock.className = "HiddenClass";
	var mainContent = document.getElementById("mainContent");
	mainContent.className = "";
}



function show(value){
	var lowercaseValue = value.toLowerCase();
	var stocksTable = document.getElementById("stocks");
	var rows = stocksTable.rows;
	for (var row = 1; row < rows.length; row++){
		if (value.length != 0 && rows[row].cells[0].innerHTML.toLowerCase().substr(0, value.length) != lowercaseValue && value.length != 0 && rows[row].cells[1].innerHTML.toLowerCase().substr(0, value.length) != lowercaseValue)
			rows[row].className = "HiddenClass";
		else rows[row].className = "";
	}
	filterCurrent(value);
}

var startDate;
var endDate;

function showByDate(element){	
	if (element.id == "startDate")
		startDate = new Date(element.value);
	else 
		endDate = new Date(element.value);
	// hide rows that do not match selected date
	if (startDate != null && endDate != null){
		var rows = document.getElementById('singleStockTable').rows;
		for (var row = 0; row < rows.length; row++){
			var day = new Date(rows[row].cells[0].innerHTML);
			if (day < startDate || day > endDate)
				rows[row].className = "HiddenClass";
			else rows[row].className = "";
		}
	// remove values
	document.getElementById('startDate').value = "";
	startDate = null;
	document.getElementById('endDate').value = "";
	endDate = null;	
	}
}

$(function() {
	$( "#startDate" ).datepicker({ dateFormat: 'yy-mm-dd' });
});

$(function() {
	$( "#endDate" ).datepicker({ dateFormat: 'yy-mm-dd' });
});

$(function() {
    $( "#slider-range" ).slider({
      range: true,
      min: 0,
      max: 5000,
      values: [ 0, 5000 ],
      slide: function( event, ui ) {
        $( "#price" ).text( "By price range: £" + ui.values[ 0 ] + " - £" + ui.values[ 1 ] );		
		filter(ui.values[ 0 ], ui.values[ 1 ]);
      }
    });
    $( "#price" ).text( "By price range: £" + $( "#slider-range" ).slider( "values", 0 ) +
      " - £" + $( "#slider-range" ).slider( "values", 1 ) );
	  filter($( "#slider-range" ).slider( "values", 0 ), $( "#slider-range" ).slider( "values", 1 ));
  });
  
function filter(low, high){
	var rows = document.getElementById('stocks').rows;
	for (var row = 0; row < rows.length; row++){
		var price = rows[row].cells[4].innerHTML;
		if (price < low || price > high)
			rows[row].className = "HiddenClass";
		else rows[row].className = "";
	} 
}
