const rooms = (function() {
  var roomEditor = {
    roomList: {},
    createRoom : (room, messages=[], namespace='/') => {
      var $roomArticle = $("<article></article>", {"id": room, "class": namespace});
      var $title = $("<h2></h2>");
      $title.text(room + " chat");
      var $chatArea = $("<div></div>", {"class": "chat"});
      if (messages) {
        messages.forEach(message => {
          chatArea.append(`<p>${message.time} ${message.sender}: ${message.message}</p>`);
        })
      }
      $roomArticle.append($title);
      $roomArticle.append($chatArea);
      rooms.roomList[room] = $roomArticle;
    },
    enterRoom: (enteredRoom, messages=[])  => {
      var chatDiv =$("#chatDiv");
      $('#userList').empty();
      if (!rooms.roomList[enteredRoom]) {
        rooms.createRoom(enteredRoom,messages);
      }
      chatDiv.append(rooms.roomList[enteredRoom]);
      localStorage.lastVisitedRoom = enteredRoom;
      if (enteredRoom === 'system') return;
      generalSocket.emit("get_users", {
        room: enteredRoom,
        namespace: $("article").attr("class")
      })
    },
    leaveRoom: (leftRoom) => {
      rooms.roomList[leftRoom] = $("article").remove();
      $('#userList').empty();
    },
    switchRooms(newRoom) {
      var currentRoom = $("article").attr("id");
      if (newRoom === currentRoom) {
        return;
      }
      rooms.roomList[currentRoom] = $("article").detach();
      rooms.enterRoom(newRoom);
    }
  }
  return roomEditor
}());