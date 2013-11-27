
var xmlhttp;
if (window.XMLHttpRequest){
	// code for IE7+, Firefox, Chrome, Opera, Safari
	xmlhttp=new XMLHttpRequest();
}
else{
	// code for IE6, IE5
  	xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
}

/**
* Checks if both passwords are the same. (Used for registration)
*/
function validatePassword(){
	"use strict";
	var element1 = document.getElementById("password");
	var element2 = document.getElementById("password1");
	if (element1.value !== element2.value)
		element2.setCustomValidity("Passwords do not match");
	else 
		element2.setCustomValidity("");
}

/**
* Validates email using regex
*/
function validateEmail(){
	"use strict";
	var element = document.getElementById("email");
	var email = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
	if (!element.value.match(email))
		element.setCustomValidity("Incorrect email address");
	else 
		element.setCustomValidity("");
}

/**
* Submit user details to server
*/
function sendForm(){
	"use strict";
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	var email = document.getElementById("email").value;
	$.ajax({ 
		type:"POST", url: "/register", 
		data: { "username": username, "password": password, "email": email}, 
		success: function(obj) { 
			window.location.replace("/main_page.html");
			if (obj.error === 0)
				window.location.replace("/main_page.html");
			else if (obj.error === 1){
				$("#alert_html").html(obj.message)
				$("#alert_msg").css("display", "block");
			}			
		} });
}

/** 
* Login.
* Sends entered details to server, if details are correct,
* redirects to the main page, otherwise, shows error message.
*/
function login(){
	"use strict";
	var password = document.getElementById("password").value;
	var username = document.getElementById("username").value;
	$.ajax({ 
		type:"POST", url: "/login", 
		data: { "username": username, "password": password }, 
		success: function(obj) { 
			if (obj.error === 0)
				window.location.replace("/main_page.html");
			else if (obj.error === 1){
				$("#alert_html").html(obj.message);
				$("#alert_msg").css("display", "block");
			}
		} });
}

// changes default submit for registration form
$(document).ready(function(){
    $( "#form" ).submit(function( event ) {
		event.preventDefault();
		sendForm();
	});
	$( "#login" ).submit(function( event ) {
		event.preventDefault();
		login();
	});
});