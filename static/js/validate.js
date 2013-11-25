
var xmlhttp;
if (window.XMLHttpRequest){
	// code for IE7+, Firefox, Chrome, Opera, Safari
	xmlhttp=new XMLHttpRequest();
}
else{
	// code for IE6, IE5
  	xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
}

function validatePassword(){
	"use strict";
	var element1 = document.getElementById("password1");
	var element2 = document.getElementById("password2");
	if (element1.value !== element2.value)
		element2.setCustomValidity("Passwords do not match");
	else 
		element2.setCustomValidity("");
}

function validateEmail(){
	"use strict";
	var element = document.getElementById("email");
	var email = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
	if (!element.value.match(email))
		element.setCustomValidity("Incorrect email address");
	else 
		element.setCustomValidity("");
}

// Register
function sendForm(){
	"use strict";
	var url = "/register"; //where to send data
	var username = document.getElementById("user").value;
	var password = document.getElementById("password1").value;
	var email = document.getElementById("email").value;
	$.ajax({ 
		type:"POST", url: "/register", 
		data: { "username": username, "password": password, "email": email}, 
		success: function(obj) { 
			if (obj.error === 0)
				window.location.replace("/main_page.html");
			else if (obj.error === 1){
				$("#alert_html").html(" Username already exists!")
				$("#alert_msg").css("display", "block");
			}			
		} })

}

//Login
function checkUsernamePassword(){

}

// change default submit for registration form
$(document).ready(function(){
    $( "#form" ).submit(function( event ) {
		event.preventDefault();
		sendForm();
	});
});