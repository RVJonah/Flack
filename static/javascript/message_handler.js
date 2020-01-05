const messageHandler = (function(){
  var messageSorter= {
    handleMessageEvent(event) {
      var currentRoom = $("article")
      if (event.room === currentRoom.attr("id")) {
        currentRoom.append(`<p>${event.message}</p>`);
      } else if (!event.room) {
        if (currentRoom.attr("id") === 'system') {
          currentRoom.append(`<p>${event.message}</p>`);
        } else {
          rooms.roomList['system'].append(`<p>${event.message}</p>`);
        }
      } else {
        rooms.roomList[event.room].append(`<p>${event.message}</p>`);
      }
    },
    handleRoomEvent(event) {
      if (event.action === "open"){
        $("#channelList").append(`
        <li id="${event.room}Button">
          <button type="menu" onclick="chat.joinRoom('${event.room}')">
            ${event.room}
          </button>
        </li>`);
      }
      if (event.action === "closed"){
        var currentRoomId = $("article").attr('id')
        if (event.room === currentRoomId) {
          rooms.switchRooms('system');
        }
        if ($(`#${event.room}Select`)){
          $(`#${event.room}Select`).remove();
        }
        $(`#${event.room}Button`).remove();
      }
      if (event.action === 'join') {
        rooms.switchRooms(event.room);
        chat.joinRoomButtons(event.room);
      }
      if (event.action === 'newUser') {
        this.addUser(event.username);
      }
      if (event.action === 'userLeft') {
        this.deleteUser(event.username);
      }
    },
    populateChannelList(channelList){
      $("#channelList").empty();
      $("#currentChannels").empty();
      channelList.forEach(channel =>{
        $("#channelList").append(`
        <li id="${channel}Button">
          <button type="menu" onclick="chat.joinRoom('${channel}')">
            ${channel}
          </button>
        </li>`);
      })
    },
    populateOldMessages(messages){
      messages.forEach(message => {
        $("article").append(`<p>${message.time} ${message.sender}: ${message.message}</p>`);
      })
    },
    populateJoinedChannels(channels){
      channels.forEach((channel) => {
        rooms.createRoom(channel);
        chat.joinRoom(channel);
      })
    },
    addUser(username){
      $("#userList").append(`
      <li id="${username}">
        <button type='button' onclick="privateMessageHandler.sendPrivateRequest('${username}')">
          ${username}
        </button>
      </li>`);
    },
    deleteUser(username) {
      $(`#${username}`).remove();
    },
    populateUserList(users) {
      userList.empty
      users.forEach(user => {
        this.addUser(user)
      })
    },
    emitHandler(event) {
      if (event.action) {
        this.handleRoomEvent(event);
      }
      if (event.message){
        this.handleMessageEvent(event);
      }
      if (event.channelList) {
        this.populateChannelList(event.channelList);
        if (localStorage.currentChannels){
          this.populateJoinedChannels(localStorage.currentChannels);
        }
        if (localStorage.lastVisitedRoom && localStorage.lastVisitedRoom !== 'system'){
          chat.joinRoom(localStorage.lastVisitedRoom);
        }
      }
      if (event.messages) {
        this.populateOldMessages(event.messages);
      }
    }
  }
  return messageSorter;
}());