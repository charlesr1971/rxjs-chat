// Check command line arguments

var debug = true;

if(debug) {
    console.log('process.argv: ', process.argv);
}

var nodeArgs = process.argv.slice(2);
if(debug) {
    console.log('nodeArgs: ', nodeArgs);
}

var port = 5000;
var secure = false;

if(nodeArgs.length){
    port = nodeArgs[0];
}

if(nodeArgs.length > 1){
    secure = nodeArgs[1] === 'true';
}

var serverPort = port;
var app = require('express')();
var fs = require('fs');
var https = require('https');
var options = {};
var server, http, io;

if(secure){

    console.log('secure: true');

    options = {
        key: fs.readFileSync('../pem/private-key.pem'),
        cert: fs.readFileSync('../crt/ssl-certificate.crt')
    };
    http = https.createServer(options, app);
    io = require('socket.io')(http);

}
else{

    console.log('secure: false');

    http = require('http').Server(app);
    io = require('socket.io')(http, { origins: '*:*'});

}

io.on('connection', (socket) => {
    // Log whenever a user connects
    if(debug) {
        console.log('user connected');
    }
    // Log whenever a client disconnects from our websocket server
    socket.on('disconnect', function() {
        if(debug) {
            console.log('user disconnected');
        }
    });
    // When we receive a 'message' event from our client, print out
    // the contents of that message and then echo it back to our client
    // using `io.emit()`
    socket.on('message', (message) => {
        if(debug) {
            console.log("Message Received: " + message);
        }
        io.emit('message', {type:'new-message', text: message});    
    });
});

// Initialize our websocket server on unsecure port

http.listen(serverPort, () => {
    if(debug) {
        console.log('started on port ',serverPort);
    }
});