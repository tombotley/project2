# Project 2

Web Programming with Python and JavaScript

Screencast presentation: https://youtu.be/Yn0854JfYwQ
<br/><br/>

**Objectives**
•	Create a Slack style chat application using Flask and Socket.IO
•	Learn to use JavaScript to run code server-side.
•	Become more comfortable with building web user interfaces.
•	Gain experience with Socket.IO to communicate between clients and servers.

<br/><br/>

**Requirements**
•	Prompt new visitors for a display name, which will be associated with all messages the user sends and should be rememebered when a user returns to the app.
•	Any user should be able to create a new channel, so long as its name doesn’t conflict with the name of an existing channel.
•	Users should be able to see a list of all current channels, and selecting one should allow the user to view the channel. 
•	Once a channel is selected, the user should see any messages that have already been sent in that channel, up to a maximum of 100 messages. Your app should only store the 100 most recent messages per channel in server-side memory.
•	Once in a channel, users should be able to send text messages to others the channel. When a user sends a message, their display name and the timestamp of the message should be associated with the message. All users in the channel should then see the new message (with display name and timestamp) appear on their channel page. Sending and receiving messages should NOT require reloading the page.
•	If a user is on a channel page, closes the web browser window, and goes back to your web application, your application should remember what channel the user was on previously and take the user back to that channel.
•	Add at least one additional feature to your chat application of your choosing. I have chosen to add a feature allowing users to share files with their current channel.
<br/><br/>

**What I have implemented**

**Application.py**

This is my Python application file which renders the index.html file and then waits for socket events from any connected clients.

To assist with my application I imported the emit, join_room and leave_room functions of the flask socketio library. To handle the application data I declared global variables including lists for users and channels, and a dictionary to store channel messages. 

``@app.route('/')``
When a user visits the site the index.html page is rendered with the current list of channels.

``@socketio.on('submit display')``
When the server receives a ‘submit display’ event the new_display function checks the received data values to make sure the display name submitted has not already been used. If the name is found in the users list the server emits a ‘display taken’ event to the client with an error message. Else the name is appended to the users list, a ‘display set’ event is emitted to the client and a ‘name changed’ event is emitted to any clients in the same room/channel as the user submitting their display (in case a user changes their name during a chat session).

``@socketio.on('submit channel')``
When the server receives a ‘submit channel’ event the new_channel function checks the received data to make sure the submitted channel name does not already exist. If the name is found in the channels list the server emits a ‘channel exists’ event to the client with an error message. Else the name is appended to the channels list, the channel name and an empty list is added to the messages dictionary as a key value pair (the list will later store message dictionaries for each message sent to the channel) and the server emits a ‘channel created’ event to all clients with the channel name so each client can add it to their join channel list.

``@socketio.on('join channel')``
When the server receives a ‘join channel’ event the join_channel function uses socket.io’s join_room method to add a user to a room/channel. If the channel is found in the channels list then any message history for that channel is retrieved from the messages dictionary and the server passes these to the joining client with the ‘get messages’ event. The server then emits the joining users name to the other users on the channel to announce the join.
 
``@socketio.on('leave channel')``
When the server receives a ‘leave channel’ event the leave_channel function uses socket.io’s leave_room method to remove a user to a room/channel. The server then emits the leaving users name to the remaining users in the channel in order to announce the departure.

``@socketio.on('send message')``
When the server receives a ‘send message’ event the send_message function takes the received message data (message, sender and channel), gets a timestamp which is then converted into a string with the format ‘HH:MM, DD Month’ and creates a new message dictionary. The new message is then appended to the nested list of message dictionaries in the messages dictionary where the key matches the channel name. If the number of messages with the key matching the channel name exceeds 100 then the pop() method is used to remove the message at the first position in the list. Finally the server emits the new message to all users in the sender’s channel.

``@socketio.on('file upload')``
When the server receives a ‘file upload’ event the file_upload function takes the file array buffer sent from a client and simply emits it back to all clients in the sender’s channel.


**Index.js**

This is my client side JavaScript file which manages local storage data, connecting to the websocket, click and change events on the html elements and listens for socket events from the server.  

``localStorage.getItem('display')``
The first step is to check local storage for a previously stored ‘display’ name with localStorage.getItem to determine if the user has visited before. If a display name is found then page header elements are amended accordingly. The display name is shown and the text on the set_display button is changed from ‘Set Display’ to ‘Change Display’. If no display name is found then a Bootstrap modal is shown prompting the user to enter a display name. The setTimeout() and focus() methods are used to focus on the input_display input field after 1000 milliseconds (once the modal has loaded).

``socket = io.connect``
Next the websocket connection is established using the io.connect method, passing in the localhost location.

``socket.on 'connect'``
The client listens for a ‘connect’ event from the server to confirm the websocket connection has been established. Now connected the client can check local storage for a ‘channel’ name, which indicates the last channel a user joined if they have visited the site before. If a channel is found then a ‘join channel’ event is emitted to the server.  If there is no previous channel then pointer events are set to none for the channel_view <div> of the html page. This deactivates the send message and share file forms.

``submit_display onclick``
An onclick listener is added for the submit_display button of the modalDisplayForm. The callback function retrieves the input_display value from the form and, after making sure a value has been entered, it is compared to the current display name in local storage. If the values match then a message is displayed in the modal indicating the user is already using that name, the form is cleared and an option to cancel is given (which has its own click listener that will hide the modal). Else if a value has been entered and it doesn’t match the current display name then the client emits a ‘submit display’ event to the server. The emit includes the new display name along with the old display name and current channel so the server can check the name isn’t in use and inform other users in the same channel of a display name change. 

``set_display onclick``
An onclick listener is added for the set_display button in the page header. The data-toggle and data-target html attributes for this button are set to show the modalDisplayForm where the user can enter a display name. Therefore all the callback function needs to do is clear any error messages that may remain from previous failed attempts to set display name and focus on the input_display input field.

``socket.on 'display set'``
The client listens for a ‘display set’ event from the server to confirm that the submitted display name was accepted. The local storage ‘display’ value is then created/updated with the new name, the modalDisplayForm is hidden, the page header is updated to show the online display name and pointer events are now activated for the channel_info (previously deactivated so that a user cannot join a channel before a display name is set.

``socket.on 'display taken'``
The client listens for a ‘display taken’ event from the server which will inform them that their display name submission was rejected because it is already in use. The error message received from the server is logged in the browser console then displayed in the modalDisplayForm to inform the user.

``submit_channel onclick``
An onclick listener is added for the submit_channel button in the channel_form, where users attempt to create a new channel. The callback function clears error messages from any previous failed attempts to create a channel. The input_channel value is retrieved and if not empty is emitted to the server with the ‘submit channel’ event. 

``socket.on 'channel created'``
The client listens for a ‘channel created’ event from the server when a new channel has been created. Each client connected to the socket receives this event and appends a new <p> element to their channel_list <div>, which displays the channel name and functions as a link to join the channel.

``socket.on 'channel exists'``
The client listens for a ‘channel exists’ event from the server which will inform them that their create channel submission was rejected because a channel with that name already exists. The error message received from the server is logged in the browser console then displayed in the channel_form to inform the user.

``channel_list addEventListener click``
Event delegation is used to add click event listeners to all channel_list elements created dynamically when a new channel is created. The click target and data-chan value of the target is retrieved. If the data-chan value does not match the current channel and the click target is a <p> element then the client emits a ‘leave channel’ event (if currently connected to a channel), any previous channel messages are cleared from channel_view and the client emits a ‘join channel’ event to the server for the selected channel. Pointer events are then activated for the channel_view <div> so that the user can begin sending messages or files to the channel.

``socket.on 'user joined'``
The client listens for a ‘user joined’ event from the server to announce that another user has joined their current channel (emitted to all clients in the channel except the joining client). A new <div> of CSS class ‘announce’ with the users display name is created and appended to the messages <div>.

``socket.on 'user left'``
The client listens for a ‘user left’ event from the server to announce that another user has left their current channel (emitted to all clients in the channel except the leaving client). A new <div> of CSS class ‘announce’ with the users display name is created and appended to the messages <div>.

``socket.on 'name changed'``
The client listens for a ‘name changed’ event from the server to announce that another user in their current channel has changed their display name (emitted to all clients in the channel except the user who changed their name).

``send_message onclick``
An onclick listener is added for the send_message button in the message_form, where users send messages to other users in their channel. The input_message value is retrieved and so long as the message isn’t empty it is emitted to the server with the ‘send message’ event along with the channel name and their display name. The input_message input field is then cleared.

``socket.on 'get messages'``
The client listens for the ‘get messages’ event from the server when they join a channel and the message history is retrieved. The channel_name element at the top of channel_view is updated to display the joined channel and then a for loop is used to loop through each received message and append to the messages <div> (using data.length to determine the number of loop iterations required). If the message’s user value matches the current user then the message <div> is set to CSS class my_message (a user’s own messages are displayed with a different background colour and float to the right rather than the left). The received data values are concatenated along with strings containing HTML (so that each value is inside its own <span> with specific CSS styling) and inserted into the innerHTML of a chat_message <div>. 

``socket.on 'new message'``
The client listens for the ‘new message’ event from the server which is received by all clients in a channel when a new message is sent. A new message <div> is created, if the message was sent by the current user then the CSS class is set to my_message, the new message innerHTML is set with a concatenation of the received data values and strings containing HTML, then the message is appended to the messages <div>.   

``file_input addEventListener change``
A change event listener on the file_input element listens for when a user has selected a file with the share file form, which uses HTML5’s File API. For this project I have decided upon a file size limit of 10MB and for the file to be sent to the server in one slice. Future improvements could include sending the file to the server in multiple slices, providing upload progress to the client and increasing the file size limit. 

The file data is stored in a variable called file and then with the file.size method the size is checked to make sure it is less than 10MB (10000000 bytes). If greater the user is alerted that the file exceeded the limit and the file_input element is cleared. If under 10MB a FileReader object is created to read the contents of the file, the file.slice method is used to create a Blob object containing the file data and then FileReader’s readAsArrayBuffer method is used to read the Blob and return an array buffer.  

Using FileReader’s onload property we check that the resulting array buffer is ready and then with a callback function it is emitted to the server along with the user’s display and channel names and the file’s name, type and size. As the clients cannot connect to each other the server’s task is simply to emit the file back to all clients in the source channel.

``socket.on 'file received'``
The client listens for the ‘file received’ event from the server which is received by all clients in a channel when a file has been shared by one of the channel clients. The array buffer received is converted back into a Blob object, an <a> element is created which will serve as a download link for the file, window.URL.createObjectURL is used to generate a URL for the element’s HREF and the download attribute is set to the file’s name (so that it will be named accordingly when downloaded). In a similar fashion to sent messages, a <div> is created which will contain a description of the shared file including sender and file name and the object download link is then appended. Finally the file share <div> is appended to the messages <div> in channel_view.


**Index.html**
This is the application’s single HTML file, which contains the Bootstrap modal used to prompt a user for their display name, the channel_info <div> which contains the form to create new channels and lists the existing channels received from the server upon arrival, along with any channels created during the session which are added dynamically (the users can click on any of these listed channels to join them) and lastly the channel_view <div> which displays a channel’s message history upon joining and dynamically adds new messages, channel announcements and shared files during the chat session. At the bottom of the channel_view are forms to add text messages and share files.  

**Style.css**
This is the apps CSS stylesheet. Here I have styled the sites header and channel divides. Styling of note includes the column-reverse flexbox with auto overflow-y which allows the chat <div> to be scrolled back through the message history when it exceeds maximum height (with latest messages at the bottom) and keyframe animation which changes message opacity from 0 to 1 over a .5 second period to give a fade in effect. Due to an issue with how Firefox handles column-reverse flex direction and overflow I have also included a temporary fix that changes the chat <div> flexbox to column flex direction for this browser. Without this change Firefox is unable to render the scrollbar. 

