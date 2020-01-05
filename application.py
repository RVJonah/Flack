from dotenv import load_dotenv
from re import match
import os
from datetime import datetime
from flask import Flask, render_template, session, request, redirect, url_for, jsonify
from flask_socketio import SocketIO, emit, send, join_room, leave_room, close_room, rooms
from .helpers.helpers import login_required

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

socketio = SocketIO(app)

#namespaces
general = '/'
private = '/private'

#channel data
channels = {general: {}, private: {}}
userList = {}

@app.route('/')
def index():
    if request.method == 'GET':
        return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        if match("^[a-zA-Z0-9]*$", username) == None:
            return jsonify({'error': 'Sorry, usernames may not contain special characters'})
        session['user_id'] = username
        return redirect(url_for('chat'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

@app.route('/chat')
@login_required
def chat():
    return render_template('chat.html', username=session['user_id'])

############### The following area is for general namespace functions only ############

@socketio.on('connect')
def on_connect():
    userList[session['user_id']] = {}
    userList[session['user_id']][general] = rooms()[0]

@socketio.on('message', namespace=general)
def on_message(data):
    username = session['user_id']
    room_name = data['room']
    message = data['message']
    time = datetime.now().strftime('%H:%M')
    send({'message': '{} {}: {}'.format(time, username, message), 'room': room_name}, room=room_name)
    if len(channels[general][room_name]['messages']) == 100:
        channels[general][room_name]['messages'].pop([0])
    channels[general][room_name]['messages'].append({'time':time, 'sender': username, 'message':message})

@socketio.on('join', namespace=general)
def on_join(data):
    username = session['user_id']
    room_name = data['room']
    if room_name not in channels[general]:
        return emit('message', {'message': 'Error: Cannot join {} as it does not exist'.format(room_name)})
    if username in channels[general][room_name]['users']:
        return emit('message', {'message': 'A user with that name is already in the room'})
    emit('message',
        {'message': username + ' has entered the room.',
        'room': room_name, 'action': 'newUser',
        'username': username},
        room=room_name)
    join_room(room_name)
    send({'message': 'You joined {}'.format(room_name)})
    emit('message', 
        {'messages': channels[general][room_name]['messages'],
        'room': room_name,
        'action': 'join'})
    channels[general][room_name]['users'][username] = userList[session['user_id']][general] = rooms()[0]

@socketio.on('leave', namespace=general)
def on_leave(data):
    username = session['user_id']
    room_name = data['room']
    namespace = data['namespace']
    leave_room(room=room_name, namespace=namespace)
    emit('message',
        {'message':username + ' has left the room.',
        'room': room_name, 'action': 'userLeft',
        'username': username},
        room=room_name,
        namespace=namespace)
    emit('message', {'message': 'You left {}'.format(room_name)})
    channels[namespace][room_name]['users'].pop(username)

@socketio.on('create')
def on_create(data):
    username = session['user_id']
    room_name = data['room']
    if match("^[a-zA-Z0-9]*$", room_name) == None:
        return send({'message': 'Sorry, room names can only contain letters a-Z and numbers 0-9'})
    if room_name in channels[general]:
        return send({'message':'Room already exists'})
    channels[general][room_name] = {'creator': username, 'messages': [], 'users': {}}
    emit('message',
        {'room': room_name,
        'action': 'open'},
        broadcast=True)

@socketio.on('close', namespace=general)
def on_close(data):
    username = session['user_id']
    room_name = data['room']
    namespace = data['namespace']
    if room_name not in channels[namespace]:
        return send('No channel found matching {}'.format(room_name))
    room_creator = channels[general][room_name]['creator']
    if username == room_creator and namespace == general:
        emit('message',
        {'action': 'closed',
        'room': room_name},
        namespace=namespace,
        broadcast=True)
        close_room(room_name)
        channels[general].pop(room_name)
    else:
        send({'message': 'You are not the room creator so cannot close it'})

@socketio.on('get_list', namespace=general)
def on_get_list():
    channel_list = list(channels[general].keys())
    send({
        "channelList": channel_list, 
        })

@socketio.on('private_request', namespace=general)
def on_private_request(data):
    chat_requester = session['user_id']
    chat_receiver = data
    new_room_name = chat_requester + '2' + chat_receiver
    if new_room_name in rooms():
        return send({'message':'You are already in a room with that person'})
    join_room(new_room_name, sid=userList[chat_requester][private], namespace=private)
    join_room(new_room_name, sid=userList[chat_receiver][private], namespace=private)
    emit("private_request", {
        'room': new_room_name,
        'namespace': private
    },
    room=new_room_name,
    namespace=private)
    channels[private][new_room_name] = {
        'messages': [],
        'users': {
            chat_requester: userList[chat_requester][private],
            chat_receiver: userList[chat_receiver][private] 
        }
    }

@socketio.on('get_users', namespace=general)
def on_get_users(data):
    emit("user_list", {'users': list(channels[data['namespace']][data['room']]['users'].keys())})

############## This area is for private namespace functions only #############

@socketio.on('connect', namespace=private)
def on_connect_private():
    userList[session['user_id']][private] = rooms()[0]

@socketio.on("message", namespace=private)
def on_private_message(data):
    username = session['user_id']
    room_name = data['room']
    message = data['message']
    time = datetime.now().strftime('%H:%M')
    send({'message': '{} {}: {}'.format(time, username, message), 'room': room_name}, room=room_name)
    if len(channels[private][room_name]['messages']) == 100:
        channels[private][room_name]['messages'].pop([0])
    channels[private][room_name]['messages'].append({'time':time, 'sender': username, 'message':message})
    

@socketio.on('disconnect')
def on_disconnect():
    username = session['user_id']
    for namespaces in channels:
        for channel_item in channels[namespaces]:
            if username in channels[namespaces][channel_item]['users']:
                channels[namespaces][channel_item]['users'].pop(username)
                emit('message',
                        {'message':username + ' has left the room.',
                        'room': channel_item, 'action': 'userLeft',
                        'username': username},
                        room=channel_item,
                        namespace=namespaces)
                    

if __name__ == '__main__':
    socketio.run(app)
