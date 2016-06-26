/* var express = require('express');
var app = express()
//app.use('/tictactoe', express.static(__dirname + '/main'));
socket = require('socket.io');
 */



/*var port = process.env.PORT || 8080;
 app.listen(port, function() {
  //console.log("Express server listening on port %d", app.address().port); 
});

var listener = app.listen( config.serverport, function(){
    console.log('Listening on port ' + listener.address().port); //Listening on port 8888
    console.log('/tictactoe'); //Handler
});
 */

 
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
/* var listener = app.listen(port, ipaddress, function() {
    //console.log('Listening on port ' + listener.address().port); //Listening on port 8888
    //console.log('/tictactoe'); //Handler
}); */


/* app.get('/', function (req, res) {
res.send('Listening on port ' + port);
}) */


var http = require('http').Server(function (req, res) {
    res.writeHead(301, {
        "location": "http://localhost"
    });
    res.end();
});

var io = require('socket.io')(http);
//var Table = require('./_table.js');


////////////////////////Table js

var CELL_ROWS = 40;
var CELL_COLS = 50;

var _playerX;
var _playerO;
var _currentTurn;

var _grid;

function Table(playerX, playerO) {
    _playerX = playerX;
    _playerO = playerO;
    _grid = [];
    _currentTurn = Math.floor(Math.random() * 2) + 1 === 2 ? "x" : "o";
    _createNewGrid();
};

function _createNewGrid() {
    for (var i = 0; i < CELL_ROWS; i++) {
        _grid.push([]);
        for (var j = 0; j < CELL_COLS; j++) {
            _grid[i].push({
                value: null
            });
        }
    }
};

function _isWinningMove(x, y, value) {
    var n_s = _N_SCheck(x, y, value);
    var ne_sw = _NE_SWCheck(x, y, value);
    var e_w = _E_WCheck(x, y, value);
    var se_nw = _SE_NWCheck(x, y, value);

    var result = [];
    if (n_s.status)
        result.push(n_s.data);
    if (ne_sw.status)
        result.push(ne_sw.data);
    if (e_w.status)
        result.push(e_w.data);
    if (se_nw.status)
        result.push(se_nw.data);

    return {status: result.length > 0, data: result};
};

//North-South check
function _N_SCheck(x, y, value) {
    var pos = [
        {x: x, y: y},
        {x: x, y: y}
    ];
    var counter = 1;

    for (var i = 1; i <= 5; i++) {
        var _y = y - i;
        if (_y < 0 || _grid[_y][x].value !== value)
            break;
        pos[1].x = x;
        pos[1].y = _y
        counter++;
    }
    if (counter >= 5) {
        return {status: true, data: pos};
    }
    for (var i = 1; i <= 5; i++) {
        var _y = y + i;
        if (_y >= CELL_ROWS || _grid[_y][x].value !== value)
            break;
        pos[0].x = x;
        pos[0].y = _y
        counter++;
    }
    return {status: counter >=5, data: pos};

};

//East-West check
function _E_WCheck(x, y, value) {
    var pos = [
        {x: x, y: y},
        {x: x, y: y}
    ];
    var counter = 1;

    for (var i = 1; i < 5; i++) {
        var _x = x - i;
        if (_x < 0 || _grid[y][_x].value !== value)
            break;
        pos[1].x = _x;
        pos[1].y = y
        counter++;
    }
    if (counter >= 5) {
        return {status: true, data: pos};
    }
    for (var i = 1; i < 5; i++) {
        var _x = x + i;
        if (_x >= CELL_COLS || _grid[y][_x].value !== value)
            break;
        pos[0].x = _x;
        pos[0].y = y
        counter++;
    }
    return {status: counter >=5, data: pos};

};

//NorthEast-SouthWest check
function _NE_SWCheck(x, y, value) {
    var pos = [
        {x: x, y: y},
        {x: x, y: y}
    ];
    var counter = 1;

    for (var i = 1; i <= 5; i++) {
        var _y = y - i;
        var _x = x - i;
        if (_x < 0 || _y < 0 || _grid[_y][_x].value !== value)
            break;
        pos[1].x = _x;
        pos[1].y = _y
        counter++;
    }
    if (counter >= 5) {
        return {status: true, data: pos};
    }
    for (var i = 1; i <= 5; i++) {
        var _y = y + i;
        var _x = x + i;
        if (_x >= CELL_COLS || _y >= CELL_ROWS || _grid[_y][_x].value !== value)
            break;
        pos[0].x = _x;
        pos[0].y = _y
        counter++;
    }
    return {status: counter >=5, data: pos};

};

//SouthEast-NorthWest check
function _SE_NWCheck(x, y, value) {
    var pos = [
        {x: x, y: y},
        {x: x, y: y}
    ];
    var counter = 1;

    for (var i = 1; i <= 5; i++) {
        var _y = y + i;
        var _x = x - i;
        if (_x < 0 || _y >= CELL_ROWS || _grid[_y][_x].value !== value)
            break;
        pos[1].x = _x;
        pos[1].y = _y
        counter++;
    }
    if (counter >= 5) {
        return {status: true, data: pos};
    }
    for (var i = 1; i <= 5; i++) {
        var _y = y - i;
        var _x = x + i;
        if (_x >= CELL_COLS || _y < 0 || _grid[_y][_x].value !== value)
            break;
        pos[0].x = _x;
        pos[0].y = _y
        counter++;
    }
    return {status: counter >=5, data: pos};

};

//Set cell target value, return 1 if it's winning move; return 0 if succeed; otherwise return -1
Table.prototype.makeAMove = function (x, y) {
    var cell = _grid[y][x];
    if (cell.value == null) {
        cell.value = _currentTurn;
        var isWinningMove = _isWinningMove(x, y, _currentTurn);
        if (isWinningMove.status)
            return {status: 1, data: isWinningMove.data};
        return {status: 0, data: null};
    }
    return {status: -1, data: null};
};

Table.prototype.getPlayerX = function () {
    return _playerX;
}

Table.prototype.getPlayerO = function () {
    return _playerO;
}

Table.prototype.nextTurn = function () {
    _currentTurn = _currentTurn === "x" ? "o" : "x";
    return _currentTurn;
};

Table.prototype.getCurrentTurn = function () {
    return _currentTurn;
};

module.exports = Table;

////////////////////Table Ends///////////////////

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

http.listen(port, function () {
    console.log('listening on *:'+port);
});
