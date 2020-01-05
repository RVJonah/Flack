'use strict';
var Login = (function () {
  function login(event) {
    event.preventDefault();
    var username = $('#username').val();
    var message = $("#message")
    if (username === "") {
      return;
    }
    if (username.match("^[a-zA-Z0-9]*$") === null) { 
      message.empty();
      message.text("Sorry username cannot contain special charcters or spaces");
      message.toggle();
      setTimeout(function(){
        message.toggle();
      },3000);
    } else {
      $("#loginForm").submit();
    }
  }
  return login;
}());

$(document).ready(function () {
  $("#loginButton").click(function (event) {
    Login(event);
  });
});