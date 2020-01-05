const chat = (function(){
  var leaveRoomButtons = roomName => {
    $("#channelList").append(`
      <li id="${roomName}Button">
        <button type='button' onclick="chat.joinRoom('${roomName}')">
          ${roomName}
        </button>
      </li>`);
      $(`#${roomName}Select`).remove();
  }
  var chatMethods = {
    sendMessage : (event) => {
      event.preventDefault();
      var currentRoom = $("article").attr("id");
      var currentNameSpace = $("article").attr("class");
      if (currentRoom === 'system') {
        return
      };
      var text = $("#messageBox");
      if (text.val() === '') return;
      if (currentNameSpace === '/') {
        generalSocket.emit("message", {
          room: currentRoom,
          message: text.val(),
        });
      };
      if (currentNameSpace === '/private') {
        privateSocket.emit("message", {
          room: currentRoom,
          message: text.val(),
        });
      };
      text.val([]);
    },
    joinRoom : roomToJoin => {
      var currentRooms =$('#currentChannels li');
      currentRooms.each( () => {
        if ($(this).prop("id") === (roomToJoin +  'Select')){
          return;
        }
      })
      generalSocket.emit("join", {
        room: roomToJoin,
        namespace: "/"
      });
    },
    leaveRoom : () => {
      var currentRoomName = $("article").attr("id");
      var namespace = $("article").attr("class");
      if (currentRoomName === "system"){
        return
      }
      generalSocket.emit("leave", {
        room: currentRoomName,
        namespace: namespace
      });
      rooms.leaveRoom(currentRoomName);
      leaveRoomButtons(currentRoomName);
      if (namespace == "/private") {
        $(`#${currentRoomName}Button`).remove();
      }
      delete rooms.roomList[currentRoomName];
      rooms.enterRoom('system');
    },
    openRoom : () => {
      var roomToOpen = $("#roomBox");
      if (roomToOpen.val().match("^[a-zA-Z0-9]*$") === null) {
        if ($('article').attr("id") === 'system') {
          $('article').append("<p>Sorry, room names cannot contain special characters</p>");
          return;
        } else {
          rooms.roomList['system'].append(`<p>${event.message}</p>`);
          return;
        };
      };
      if (roomToOpen.val() === '' || roomToOpen === "system") return;
      generalSocket.emit("create", {
        room: roomToOpen.val(),
        namespace: "/"
      });
      roomToOpen.val([]);
    },
    closeRoom: () => {
      var roomToClose = $("#roomBox");
      var roomNamespace = '/';
      generalSocket.emit("close", {
        room: roomToClose.val(),
        namespace: roomNamespace
      })
      roomToClose.val([]);
    },
    joinRoomButtons: roomName => {
      $(`#${roomName}Button`).remove();
      $("#currentChannels").append(`
        <li id="${roomName}Select">
          <button type='button' onclick="rooms.switchRooms('${roomName}')">
            ${roomName}
          </button>
        </li>`);
    },
    logout: () => {
      generalSocket.emit("disconnect");
      privateSocket.emit("disconnect");
      delete localStorage.lastVisitedRoom;
    }
  }
  return chatMethods
}());

$(document).ready(function () {
  $("#createButton").click(function (event) {
      chat.openRoom();
  });
  $("#leaveButton").click((event) => {
    chat.leaveRoom();
  });
  $("#closeButton").click((event) => {
    chat.closeRoom();
  })
  $("#sendButton").click((event) => {
    chat.sendMessage(event);
  })
  $("#logout").click((event) => {
    chat.logout();
  })
});
