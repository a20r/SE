
$(document).ready(function() {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		fillData();
		loadMainPage();
		checkLogin();
		loadRecommended();
		checkFollowedButton();

	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
})

/**
* Hides the filter in the main html page.
*/
function hideFilter() {
	var filter = document.getElementById("filterContainer");
	if (filter.className != "HiddenClass") {
		filter.className = "HiddenClass";
	} else {
		filter.className = "";
	}
}

/**
* Checks if button for followed stocks is needed.
* If user is not logged in or does not have follwing
* stocks, hide the button.
*/
function checkFollowedButton() {
	var button = document.getElementById("followedButton");
	var loginCookie = $.cookie("stock_auth_token");
	if (loginCookie == undefined || loginCookie.length <= 0) {
		button.style.display = "none";
		return;
	}
	$.getJSON("/get_following", function(jsonObj) {
		if (jsonObj.length > 0) {
			button.style.display = "";
		} else {
			button.style.display = "none";
		}
	});
}

/**
* Loads recommended stocks
*/
function loadRecommended() {
	var recommended = document.getElementById("recommended");
	var html = '';
		for (var item = 0; item < 5; item++) {
		html += '<div class=\"RecommendedPlaceholder\">\r\n' +
				'</div>\r\n';
		}
	recommended.innerHTML = html;
	$.getJSON("/recommend", function (jsonObj) {
		var recStock = jsonObj["stocks"];
		var html = '';
		for (var item in recStock) {
		html += '<div class=\"RecommendedPlaceholder\"' +
				' onclick=\"loadIndividual(\'' + recStock[item] + '\')\">\r\n' +
				'<div class=\"RecSymbol\">' + recStock[item] +
				'</div>\r\n</div>\r\n';
		}
		recommended.innerHTML = html;
	});
}
/**
* Checks if user is logged in to the system.
*/
function checkLogin() {
	var login = document.getElementById("logCond");
	var cookie = $.cookie("stock_auth_token");
	if (cookie != undefined && cookie.length > 0) {
		login.innerHTML = '<a href="javascript:logout();">LOGOUT</a>';
	} else {
		login.innerHTML = '<a href="/login.html">LOGIN</a>';
	}
}

/**
* Logouts: remove cookie information, redirect user to the main page.
*/
function logout() {
	document.cookie = 'stock_auth_token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	window.location.replace("/main_page.html");
}

// interval for how often page is updated in seconds
var updateTime = 10 * 1000
// function call to update the page
var updateInterval = setInterval(fillData, updateTime)
// current page the user is on in the "Current Values" in the main page
var currentPage = 0;
// the data that is used to show data for user (when using filter, some values are hidden)
var currentDataInUse;
// data about stocks received from server
var allData;

/**
* Gets stocks data from server, then invokes functions to load the whole 
* page with data received from server
*/
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

/**
* Creates circles bellow Current Values container to allow
* clicking on them.
*/
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

/**
* Loads selected page (circles bellow) for Current Values container.
* Allows to navigate between Current Values.
*/
function pageOnClick(pageClicked) {
	var previousPage = document.getElementById("page" + currentPage);
	previousPage.className = "Page";
	var newCurrentPage = document.getElementById("page" + pageClicked);
	newCurrentPage.className = "CurrentPage";
	loadCurrentValues(currentDataInUse, pageClicked * 12);
	currentPage = pageClicked;
}

/**
* Filters Current Values using "BY NAME OR SYMBOL" filter.
*/
function filterCurrent(value) {
	currentDataInUse = new Array();
	var index = 0;
	for (var row in allData) {
		var symbol = allData[row][0].toLowerCase();
		var name = allData[row][3].toLowerCase();
		if (symbol.substr(0, value.length) == value ||
			name.substr(0, value.length) == value) {
			currentDataInUse[index] = allData[row];
			index++;
		}
	}
	loadCurrentValues(currentDataInUse, 0);
	loadPaging(index);
}

/**
* Filter Current Values using slider on closing prices
*/
function filterCurrentPrices(low, high){
	if (allData == undefined || allData.length <= 0)
		return;
	var array = new Array();
	var index = 0;
	for (var row in allData) {
		var price = allData[row][1];		
		if (price >= low && price <= high) {
			array[index] = allData[row];
			index++;
		}
	}
	currentDataInUse = array;
	loadCurrentValues(currentDataInUse, 0);
	loadPaging(index);
}

/**
* Loads values in the Current Values container.
*/
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
			html += '<div onclick=\"loadIndividual(\'' + data[index][0] + '\')\" class=\"ItemPlaceholder BottomRowPlaceholder\">';
		} else {
			html += '<div onclick=\"loadIndividual(\'' + data[index][0] + '\')\" class=\"ItemPlaceholder\">';
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

/**
* Redirects to individual stock page. index - symbol of the stock
*/
function loadIndividual(index){
	$.cookie("index", index);
	window.location.href = "/individual.html";
}

/**
* Create the table for all stocks and show details using only last day's information.
*/
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

/**
* Add new row with information to the table
*/
function addRow(name, symbol, change, open, high, low, close, volume) {
	var table = document.getElementById("stocksBody");
	var html = '';
	html += '<tr onclick=\"loadIndividual(\'' + symbol + '\')\">\r\n' + 
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
}

/**
* Filter the table "BY NAME OR SYMBOL"
*/
function show(value){
	var lowercaseValue = value.toLowerCase();
	var stocksTable = document.getElementById("stocks");
	var rows = stocksTable.rows;
	for (var row = 1; row < rows.length; row++){
		if (value.length != 0 && rows[row].cells[0].innerHTML.toLowerCase().substr(0, value.length) != lowercaseValue && value.length != 0 && rows[row].cells[1].innerHTML.toLowerCase().substr(0, value.length) != lowercaseValue)
			rows[row].className = "HiddenClass";
		else rows[row].className = "";
	}
	filterCurrent(lowercaseValue);
}

// Slider to filter by the price
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

/**
* Filter table using slider on closing prices
*/
function filter(low, high){
	var rows = document.getElementById('stocks').rows;
	for (var row = 0; row < rows.length; row++){
		var price = rows[row].cells[4].innerHTML;
		if (price < low || price > high)
			rows[row].className = "HiddenClass";
		else rows[row].className = "";
	} 
	filterCurrentPrices(low, high);
}