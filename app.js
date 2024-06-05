const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

// socket.io setup
const server = http.createServer(app);
const io = socket(server);

// chess.js setup
const chess = new Chess();
let players = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

io.on('connection', (uniquesocket) => {
    console.log("A user connected: " + uniquesocket.id);

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'b');
    } else {
        uniquesocket.emit('spectatorRole');
    }

    uniquesocket.on('disconnect', () => {
        console.log("A user disconnected: " + uniquesocket.id);
        if (players.white === uniquesocket.id) {
            delete players.white;
        } else if (players.black === uniquesocket.id) {
            delete players.black;
        }
    });

    uniquesocket.on('move', (move) => {
        try {
            const turn = chess.turn();
            if ((turn === 'w' && uniquesocket.id !== players.white) || (turn === 'b' && uniquesocket.id !== players.black)) {
                console.log("It's not your turn");
                return;
            }

            const result = chess.move(move);
            if (result) {
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            } else {
                console.log("Invalid move:", move);
                uniquesocket.emit('InvalidMove', move);
            }
        } catch (err) {
            console.log("Error:", err);
            uniquesocket.emit('InvalidMove', move);
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
