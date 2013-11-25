$(document).ready(function() {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
  	
		loadMainPage();
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}
})

function loadMainPage() {
	var stocksTable = document.getElementById("stocks");
	var key = new XMLHttpRequest();
	key.open('GET', 'data/key.csv');
	key.onreadystatechange = function() {
		if (key.readyState != 4) {
			return;
		}
		var csv = key.responseText;
		var keyData = $.csv.toArrays(csv);
		var table = '';
		for (var row in keyData) {
			var name = keyData[row][0];
			var symbol = keyData[row][1];
			addRow(name, symbol, stocksTable);
		}

	};
	key.send();
}

function addRow(name, symbol, stocksTable) {
	var reader = new XMLHttpRequest();
	reader.open('GET', 'data/' + symbol + '.csv');
	reader.onreadystatechange = function() {
		if (reader.readyState != 4) {
			return;
		}
		var csv = reader.responseText;
		var data = $.csv.toArrays(csv);
		var html = '';
		html += '<tr onclick=\"onClick(\'' + symbol + '\');\">\r\n' +
				'<td>' + name + '</td>\r\n' +
				'<td>' + symbol + '</td>\r\n';
		var lastDayRow = data[1];
		var i;
		for (i = 0; i < 6; i++) {
			html += '<td>' + lastDayRow[i] + '</td>\r\n';
		}
		html += '</tr>\r\n';
		stocksTable.innerHTML += html;
	};
	reader.send();
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