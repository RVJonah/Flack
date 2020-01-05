const privateMessageHandler = (function(){
  var privateMessages = {
    sendPrivateRequest: user => {
      var currentRooms =$('#currentChannels li');
      var username = $('#username').text();
      var roomIsUnique = true;
      if (user === username) {
        return;
      }
      currentRooms.each(function() {
        if ($(this).prop("id") === (`${username}2${user}Select`)){
          roomIsUnique = false;
          return;
        }
        if ($(this).prop("id") === (`${user}2${username}Select`)){
          roomIsUnique = false;
          return;
        }
      })
      if(!roomIsUnique) {
        return;
      }
      generalSocket.emit("private_request", user);
    },
    handlePrivateRequest(event) {
      rooms.createRoom(event.room,event.message, event.namespace);
      $("#currentChannels").append(`
        <li id="${event.room}Select">
          <button type="menu" onclick="rooms.switchRooms('${event.room}')">
            ${event.room}
          </button>
        </li>`);
    }
  }
  return privateMessages
}())