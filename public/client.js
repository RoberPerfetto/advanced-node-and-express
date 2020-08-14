$( document ).ready(function() {
  /*global io*/
  const socket = io.connect("https://ffc-advanced-node-and-express.glitch.me/");
  socket.on('user', function(data){
    console.log(data);
  });  
  
  $('form').submit(() => {
    var messageToSend = $('#m').val();
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false;
  });
  
  socket.on('user', function(data){
    $('#num-users').text(data.currentUsers+' users online');
    var message = data.name;
    if(data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    $('#messages').append($('<li>').html('<b>'+ message +'<\/b>'));
  });
  
  socket.on('chat message', function(data) {
    console.log(data.message)          
  })
});