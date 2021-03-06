// Check the configuration file for more details
var config = require('./config');

// Express.js stuff
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);

// Websockets with socket.io
var io = require('socket.io')(server);

console.log("Trying to start server with config:", config.serverip + ":" + config.serverport);

// Both port and ip are needed for the OpenShift, otherwise it tries 
// to bind server on IP 0.0.0.0 (or something) and fails
 server.listen(config.serverport, config.serverip, function() {
  console.log("Server running @ http://" + config.serverip + ":" + config.serverport);
});/* */

// Allow some files to be server over HTTP
app.use(express.static(__dirname + '/main'));

// Serve GET on http://domain/
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Server GET on http://domain/api/config
// A hack to provide client the system config
app.get('/api/config', function(req, res) {
  res.send('var config = ' + JSON.stringify(config));
});




/* var http = require('http').Server(function (req, res) {
    res.writeHead(301, {
        "location": "http://localhost"
    });
    res.end();
}); */

//var io = require('socket.io')(http);
var Table = require('./_table.js');

var waitingQueue = [];
var tableCount = 1;

setInterval(function () {
    if (waitingQueue.length < 2)
        return;

    var index = Math.floor(Math.random() * waitingQueue.length);
    var playerX = waitingQueue[index];
    waitingQueue.splice(index, 1);

    index = Math.floor(Math.random() * waitingQueue.length);
    var playerO = waitingQueue[index];
    waitingQueue.splice(index, 1);

    var name = "Table" + tableCount++;
    var table = new Table(playerX, playerO);

    playerX.join(name);
    playerO.join(name);
    playerX.table = table;
    playerO.table = table;

    playerX.currentTable = name;
    playerO.currentTable = name;

    if (playerX.playerName == playerO.playerName) {
        playerO.playerName += "1";
        playerO.emit("renamed", playerO.playerName);
    }

    io.to(name).emit('join table', {
        playerX: playerX.playerName,
        playerO: playerO.playerName,
        currentTurn: table.getCurrentTurn()
    });
}, 2000);

io.on('connection', function (socket) {
    console.log('Player (id: ' + socket.id + ') connected');

    socket.on("make a move", function (data, fn) {
        console.log('Player (id: ' + socket.id + ') make a move at [' + data.x + ';' + data.y + ']');
        var table = socket.table;
        var result = table.makeAMove(data.x, data.y);
        fn({ok: result.status >= 0});
        if (result.status >= 0) {
            io.to(socket.currentTable).emit('make a move', {
                x: data.x,
                y: data.y,
                value: table.getCurrentTurn(),
                nextTurn: table.nextTurn(),
                isWinningMove: {
                    status: result.status == 1,
                    data: result.data
                }
            });

            if (result.status == 1) {
                var playerX = table.getPlayerX();
                var playerO = table.getPlayerO();

                playerX.leave(socket.currentTable);
                playerO.leave(socket.currentTable);
                table = null;
                playerX.currentTable = null;
                playerO.currentTable = null;
                playerX.table = null;
                playerO.table = null;
            }

        }
    });

    socket.on("join queue", function (data) {
        console.log('Player (id: ' + socket.id + ') named ' + data);
        socket.playerName = data;
        socket.table = null;
        socket.currentTable = null;
        waitingQueue.push(socket);
    });

    socket.on("leave game", function (data) {
        leaveTable(socket);
    });

    socket.on('disconnect', function () {
        console.log('Player (id: ' + socket.id + ') disconnected');
        leaveTable(socket);
    });

    socket.on('chat message', function (msg) {
        console.log('chat message from ' + socket.id + ': ' + msg);
        if (socket.currentTable) {
            var name = socket.currentTable;
            socket.broadcast.to(name).emit('chat message', socket.playerName + ": " + msg);
        }
    });
});

var leaveTable = function (socket) {
    var index = waitingQueue.indexOf(socket);
    if (index != -1)
        waitingQueue.splice(index, 1);
    if (socket.table) {
        var table = socket.table;
        var winner;
        if (table.getPlayerX() == socket)
            winner = table.getPlayerO();
        else
            winner = table.getPlayerX();

        io.to(socket.currentTable).emit('opponent disconnected', winner == table.getPlayerX() ? "x" : "o");

        table = null;
        winner.table = null;
    }
};

/* http.listen(config.serverport, function () {
    console.log('listening on *:'+config.serverport);
}); */