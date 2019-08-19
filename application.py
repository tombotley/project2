import time

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

# create flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# wrap flask app with socketio
socketio = SocketIO(app)

# declare global variables for user, channel and message data
users = []
channels = []
messages = {}

# add some channels
channels.append('channel1')
channels.append('channel2')

# add some messages
messages['channel1'] = [{'message': 'hello chatters!', 'user': 'admin', 'timestamp': '15:05, 23 July'}]
messages['channel2'] = [{'message': 'hello chatters!', 'user': 'admin', 'timestamp': '17:50, 23 July'}]


@app.route('/')
def index():

    # render the index.html page and pass channel list
    return render_template('index.html', channels=channels)


def message_received():
    """ callback function for successful server emits """

    # callback function
    print('Message received')


@socketio.on('submit display')
def new_display(data):
    """ when user submits a display name """

    # get data values
    name = data['display_name']
    old_name = data['old_display']
    channel = data['current_chan']
    print('Display name ' + name + ' submitted')

    # if display name found in users list reject the name and emit display taken response
    if name in users:
        print('Display name ' + name + ' rejected')
        emit('display taken', {'error': 'This display name is already in use'}, callback=message_received())

    # else accept the name, append to user list, emit display set response to user and name changed response to others in room
    else:
        print('Display name ' + name + ' accepted')
        users.append(name)
        emit('display set', name, callback=message_received())
        emit('name changed', {'name': name, 'old_name': old_name}, room=channel, include_self=False)


@socketio.on('submit channel')
def new_channel(data):
    """ when user submits a new channel """

    # get data values
    name = data['channel_name']
    print('Channel name ' + name + ' submitted')

    # if channel name found in channels list reject the name and emit channel exists response event
    if name in channels:
        print('Channel name ' + name + ' rejected')
        emit('channel exists', {'error': 'This channel name already exists'}, callback=message_received())

    # else accept the name, append to channels list, create a nested list to store messages and broadcast channel created event to all
    else:
        print('Channel name ' + name + ' accepted')
        channels.append(name)
        messages[name] = []
        emit('channel created', name, callback=message_received(), broadcast=True)


@socketio.on('join channel')
def join_channel(data):
    """ when user joins a channel """

    # get data values and join room
    channel = data['channel']
    user = data['user']
    join_room(channel)

    # if channel name exists get message history for that channel and emit to user
    if channel in channels:
        message_data = messages[channel]
        emit('get messages', message_data, callback=message_received())

    # emit user joined event to other users in the room
    emit('user joined', {'user': user}, room=channel, include_self=False)


@socketio.on('leave channel')
def leave_channel(data):
    """ when user leaves channel """

    # get data values and leave room
    channel = data['channel']
    user = data['user']
    leave_room(channel)

    # emit user left event to other users in the room
    emit('user left', {'user': user}, room=channel)


@socketio.on('send message')
def send_message(data):
    """ when user sends a message """

    # get data values
    message = data['message']
    channel = data['channel']
    user = data['user']

    # get current date and time and format a timestamp string
    timestamp = time.localtime()
    timestamp = time.strftime("%H:%M, %d %B", timestamp)  # %X, %d/%m/%Y

    # create a new message dictionary with data values
    new_message = {
        'message': message,
        'user': user,
        'timestamp': timestamp
    }

    # append new message dictionary to messages list for the relevant channel
    messages[channel].append(new_message)

    # if number of messages for that channel exceeds 100 then remove the oldest
    if len(messages[channel]) > 100:
        messages[channel].pop(0)

    # emit new message event to all users in the room
    emit('new message', new_message, room=channel)


@socketio.on('file upload')
def file_upload(data):
    """ when user uploads a file """

    # emit received file and user data back to the users current room
    emit('file received', data, room=data['room'])


if __name__ == '__main__':
    socketio.run(app, debug=True)
