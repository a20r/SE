
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

// Ckeck if username exists for registration
function validateUsername(){
	"use strict";
	var element = document.getElementById("user");
	//TODO: send to server and check if username exists
	var url = "/username";
	xmlhttp.open("POST", url);
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("username="+username);
	var response;
	xmlhttp.onreadystatechange = function() {
  		if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
    		response = xmlhttp.responseText;
    	}
  	};
  	// TODO
	var exists = false;
	if (exists)
		element.setCustomValidity("Username already exists");
	else {
		element.setCustomValidity("");
	}
}

// Register
function sendForm(){
	"use strict";
	var url = "/register"; //where to send data
	var username = document.getElementById("user").value;
	var password = document.getElementById("password1").value;
	var email = document.getElementById("email").value;
	//TODO: send to the server
	// $.ajax({
	// 	type: "POST";
	// 	data: {
	// 		"username": username,
	// 		"password": password,
	// 		"email": email
	// 	},
	// 	url: "/register"
	// })
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