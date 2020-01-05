const generalSocket = (function() {
	var generalSocket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);
	generalSocket.on("message", event => {
		messageHandler.emitHandler(event);
	});
	generalSocket.on("connect", () => {
		$("article").append("<p>Flack Chat Connected</p>");
		generalSocket.emit("get_list");
	});
	generalSocket.on("user_list", event =>{
		messageHandler.populateUserList(event.users);
	});
	return generalSocket;
}());

const privateSocket = (function() {
	var privateSocket = io.connect(location.protocol + "//" + document.domain + ":" + location.port + "/private");
	privateSocket.on("message", event => {
		messageHandler.emitHandler(event);
	});
	privateSocket.on("private_request", event => {
		privateMessageHandler.handlePrivateRequest(event);
	});
	return privateSocket;
}());