document.addEventListener('DOMContentLoaded', function() {

  // check local storage for display name
  if (localStorage.getItem('display')) {

    // if user has a display name insert name into user_display element
    document.getElementById('user_display').innerHTML = localStorage.getItem('display');
    // set_display button text changed from 'set display' to 'change display'
    document.getElementById('set_display').innerHTML = 'Change Display';

  } else {

    // else do not allow click events on channel menu and show display form modal
    document.getElementById('channel_info').style.pointerEvents = 'none';
    $('#modalDisplayForm').modal({
      show: true,
      // prevent esc and clicking on backdrop closing the modal
      backdrop: 'static',
      keyboard: false
    });

    // after 1000 milliseconds focus on the input_display input field
    setTimeout(function (){
      $('#input_display').focus();
    }, 1000);

  };

  // connect to websocket
  const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // when connected check for previous channel and join if found
  socket.on('connect', function() {

    // confirm connection in browser console
    console.log('User connected');
    console.log('ID: ' + socket.id);

    // only try to join channel if one found in localStorage
    if (localStorage.getItem('channel')) {

      // get the stored channel and display name and emit to server
      const channel = localStorage.getItem('channel');
      console.log(channel);
      const user = localStorage.getItem('display');
      socket.emit('join channel', {'channel': channel, 'user': user});

    } else {

      // else continue to disallow click events on channel view (until a user joins a channel)
      document.getElementById('channel_view').style.pointerEvents = 'none';
    };

  });

  // listen for click event on display form modal submit button and emit submit display event to server
  document.querySelector('#submit_display').onclick = function() {

    // clear any error messages from previous failed display name submission
    document.getElementById('display_error').innerHTML = '';
    // get the display name value from the input field and the old name from localStorage
    const display_name = document.querySelector('#input_display').value;
    const old_display = localStorage.getItem('display');

    // only continue if the user entered a display name value
    if (display_name !== '') {

      // also check the user hasn't entered their existing display value
      if (display_name == localStorage.getItem('display')) {

        // if matches current then inform user and clear the input field
        document.getElementById('display_error').innerHTML = 'You are already using this name <a href="javascript:void(0);" id="cancel_change">(cancel)</a>';
        document.getElementById('input_display').value = '';
        document.querySelector('#cancel_change').onclick = function() {
          $('#modalDisplayForm').modal('hide');
        };

      } else {

        // else accept the submission, emit to server and clear input field
        const current_chan = localStorage.getItem('channel');
        socket.emit('submit display', {'old_display': old_display, 'display_name': display_name, 'current_chan': current_chan});
        document.getElementById('input_display').value = '';
      };
    };

  };

  // listen for click event on set_display button
  document.querySelector('#set_display').onclick = function() {

    // button is already setup to show the display form modal using the data-toggle and data-target html attributes

    // clear any error messages from previous failed display name submission
    document.getElementById('display_error').innerHTML = '';

    // after 1000 milliseconds focus on the input_display input field
    setTimeout(function (){
        $('#input_display').focus();
    }, 1000);

  };

  // listen for display set event from server when name accepted
  socket.on('display set', function(data) {

    // confirm details in browser console and update localStorage
    console.log('Display name accepted');
    localStorage.setItem('display', data);
    console.log('Display saved: ' + localStorage.getItem('display'));
    // hide display form modal and allow click events on channel menu
    $('#modalDisplayForm').modal('hide');
    document.getElementById('user_display').innerHTML = localStorage.getItem('display');
    document.getElementById('set_display').innerHTML = 'Change Display';
    document.getElementById('channel_info').style.pointerEvents = 'auto';

  });

  // when display name rejected
  socket.on('display taken', function(data) {

    // insert error message into display error element
    console.log(data);
    document.getElementById('display_error').innerHTML = data.error;

  });

  // listen for click event on channel_form button and emit submit channel event to server
  document.querySelector('#submit_channel').onclick = function() {

    // clear any error messages from previous failed channel name submission
    document.getElementById('channel_error').innerHTML = '';
    // get the channel name value from input field
    const channel_name = document.querySelector('#input_channel').value;

    // only continue if user entered a channel name value
    if (channel_name !== '') {

      // emit to server and clear input field
      socket.emit('submit channel', {'channel_name': channel_name});
      document.getElementById('input_channel').value = '';
    };

  };

  // listen for channel created event
  socket.on('channel created', function(data) {

    // create a <p> element with channel details to append to the channel list
    console.log(data);
    const p = document.createElement('p');
    p.innerHTML = data;
    p.setAttribute('class', 'join');
    // set chan value to be used when joining channel
    p.setAttribute('data-chan', data);
    document.querySelector('#channel_list').append(p);

  });

  // listen for channel exists event when name rejected
  socket.on('channel exists', function(data) {

    // inform user that name already exists
    console.log(data);
    document.getElementById('channel_error').innerHTML = data.error;

  });

  // join channel event delegation for <p> elements clicked in the channel list <div>
  document.getElementById('channel_list').addEventListener('click', function(event) {

    // get target element data and current localStorage values
    const target = event.target;
    const channel = target.dataset.chan;
    const current_chan = localStorage.getItem('channel');
    const user = localStorage.getItem('display');

    // if clicked element was a <p> and not the current channel
    if (channel !== current_chan && target.nodeName == 'P') {

      // leave current channel if one is found in localStorage
      if (localStorage.getItem('channel')) {
        socket.emit('leave channel', {'channel': current_chan, 'user': user});
      };

      // update local storage, confirm in console, clear any previous channel messages
      localStorage.setItem('channel', channel);
      console.log(channel);
      document.getElementById('messages').innerHTML = '';
      document.getElementById('channel_name').innerHTML = localStorage.getItem('channel');
      // emit event to server and allow click events on channel view
      socket.emit('join channel', {'channel': channel, 'user': user});
      document.getElementById('channel_view').style.pointerEvents = 'auto';
    };

  });

  // listen for user joined event from server
  socket.on('user joined', function(data) {

    // create a <div> with details of the user joining to append to message list of other users on the channel
    console.log(data);
    const join_message = document.createElement('div');
    join_message.setAttribute('class', 'announce');
    join_message.innerHTML = data.user + ' has joined the chat!';
    document.querySelector('#messages').append(join_message);

  });

  // listen for user left event from server
  socket.on('user left', function(data) {

    // create a <div> with details of the user leaving to append to message list of other users on the channel
    console.log(data);
    const leave_message = document.createElement('div');
    leave_message.setAttribute('class', 'announce');
    leave_message.innerHTML = data.user + ' left the chat';
    document.querySelector('#messages').append(leave_message);

  });

  // listen for name changed event from server
  socket.on('name changed', function(data) {

    // create a <div> with details of the name change to append to message list of other users on the channel
    console.log(data);
    const change_message = document.createElement('div');
    change_message.setAttribute('class', 'announce');
    change_message.innerHTML = data.old_name + ' changed their display name to ' + data.name;
    document.querySelector('#messages').append(change_message);

  });

  // listen for click event on send message button
  document.querySelector('#send_message').onclick = function() {

    // get the message value from input field
    const message = document.querySelector('#input_message').value;

    // only continue if the user entered a value
    if (message !== '') {

      // get localStorage values to emit along with the message, then clear input field
      const channel = localStorage.getItem('channel');
      const user = localStorage.getItem('display');
      socket.emit('send message', {'message': message, 'channel': channel, 'user': user});
      document.getElementById('input_message').value = '';
    };

  };

  // listen for get messages event to load message history when user joins channel
  socket.on('get messages', function(data) {

    // update channel name element with name of channel joined
    console.log(data);
    document.getElementById('channel_name').innerHTML = localStorage.getItem('channel');

    // loop through messages array and create a <div> to display each message then append to messages <div>
    for (let i = 0; i < data.length; i++) {

      const chat_message = document.createElement('div');
      // if message was sent by current user change div class to my_message
      if (data[i].user == localStorage.getItem('display')) {
        chat_message.setAttribute('class', 'my_message');
      };
      chat_message.innerHTML = '<p><span class="user">' + data[i].user + '  </span><span class="stamp">' + data[i].timestamp + '</span></p><p><span class="msg">' + data[i].message + '</span></p>';
      document.querySelector('#messages').append(chat_message);
    };

  });

  // listen for new message event when a user sends a message to channel
  socket.on('new message', function(data) {

    console.log(data);
    // create a message <div> and append to messages <div>, if it belongs to current user change div class
    const new_msg = document.createElement('div');
    if (data.user == localStorage.getItem('display')) {
      new_msg.setAttribute('class', 'my_message');
    };
    new_msg.innerHTML = '<p><span class="user">' + data.user + '  </span><span class="stamp">' + data.timestamp + '</span></p><p><span class="msg">' + data.message + '</span></p>';
    document.querySelector('#messages').append(new_msg);

  });

  // add change event listener to file_input element (when a file is selected)
  document.getElementById('file_input').addEventListener('change', function(event) {

    // get file data from file_input
    const file_input = document.getElementById('file_input');
    const file = file_input.files[0];

    // if file is greater than 10MB alert user to maximum upload size and clear input selection
    if (file.size > 10000000) {

      alert("Maximum file size is 10MB");
      document.getElementById('file_input').value = '';

    // else read file slice as array buffer and emit to server
    } else {

      const reader = new FileReader();
      const size = file.size;
      console.log(size);
      // currently uploading as one slice, update to include mulitple slices, larger file size limit and progress bar
      const slice = file.slice(0, size);
      console.log(slice);
      reader.readAsArrayBuffer(slice);

      // once reader has loaded the file get result and emit along with localStorage values
      reader.onload = function(event) {

        const file_data = reader.result;
        console.log(file_data);
        socket.emit('file upload', {'sender': localStorage.getItem('display'), 'room': localStorage.getItem('channel'), 'name': file.name, 'type': file.type, 'size': file.size, 'data': file_data});
      };
    };

  });

  // listen for file received event from server
  socket.on('file received', function(data) {

    // get file data and convert from array buffer to blob
    console.log(data);
    const received_file = new Blob([data.data]);
    console.log(received_file);

    // create an anchor element and generate a download URL for file object within browser
    const dl_link = document.createElement('a');
    const dl_url = window.URL.createObjectURL(received_file);
    // set anchor href to object URL and set name for downloaded file
    dl_link.setAttribute('href', dl_url);
    dl_link.setAttribute('download', data.name);
    dl_link.innerHTML = 'download';

    // create a message <div> with name of file and sender
    const file_share = document.createElement('div');
    file_share.innerHTML = data.sender + ' shared a file - "' + data.name + '" - ';

    // if file sent by current user change div class and clear file_input
    if (data.sender == localStorage.getItem('display')) {
      file_share.setAttribute('class', 'my_message');
      document.getElementById('file_input').value = '';
    };

    // append file download link to message then append message to messages <div>
    file_share.appendChild(dl_link);
    document.querySelector('#messages').append(file_share);

  });

});
