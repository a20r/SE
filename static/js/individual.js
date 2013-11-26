
$(document).ready(function() {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
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