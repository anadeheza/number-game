const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: "*"}
})

app.use(express.static(__dirname + '/public'))

let rooms = {}


function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min 
}

function generateEq(l) {
    const level = l
    let a, b, c, op, text, ans 

    if (level === 1) {
        a = randInt(1, 9)
        b = randInt(1, 9)
        
        op = Math.random() < 0.5 ? '+' : '-'
        if (op === '-' && b > a) [a, b] = [b, a]
        text = `${a} ${op} ${b}`
        
        if (op === '+') { 
            ans= a + b
        } else {
            ans = a - b 
        }
    } else if (level === 2) {
        if (Math.random() < 0.5) {
            a = randInt(10, 50)
            b = randInt(10, 50)
            
            op = Math.random() < 0.5 ? '+' : '-'
            if ( op === '-' && b > a) [a, b] = [b, a]
            text = `${a} ${op} ${b}`
            
            if (op === '+') {
                ans =  a + b
            } else {
                ans =  a - b 
            }
        } else {
            a = randInt(2, 10) 
            b = randInt(2, 10)
            
            text = `${a} x ${b}`
            ans = a * b 
        }
    } else if (level === 3) {
        if (Math.random() < 0.5) {
            a = randInt(4, 50)
            b = randInt(4, 50)
            
            text = `${a} x ${b}`
            ans = a * b 
        } else {
            a = randInt (50, 99)
            b = randInt (50, 99)

            op = Math.random() < 0.5 ? '+' : '-'
            if (op === '-' && b > a) [a, b] = [b, a]
            text = `${a} ${op} ${b}`
            
            if (op === '+') {
                ans = a + b 
            } else {
                ans = a - b
            }
        }
    } else if (level === 4) {
        if (Math.random() < 0.5) {
            a = randInt(2, 50)
            b = randInt(2, 50)
            
            text = `${a} / ${b}`
            
            if (b > a) [a, b] = [b, a]
            ans = Math.trunc(a / b)
        } else {
            a = randInt (-50, 99)
            b = randInt (-50, 99)

            op = Math.random() < 0.5 ? '+' : '-'
            if (op === '-' && b > a) [a, b] = [b, a]
            text = `${a} ${op} ${b}`

            if(op === '+') 
            { 
                ans = a + b
            } else {
                ans = a - b
            }
        }
    } else if (level === 5) {
        a = randInt(2, 100)
        b = randInt(2, 100)

        op = Math.random() < 0.5 ? '*' : '/'
        
        text = `${a} ${op} ${b}`

        if (b > a) [a, b] = [b, a]

        if (op === '/') {
            ans = Math.trunc(a / b)
        } else {
            ans = a * b 
        }
        
    } else {
        if (Math.random() < 0.5) {
            a = randInt(2, 20)
            b = randInt(2, 20)
            c = randInt(1, 50)

            op = Math.random() < 0.5 ? '+' : '-'
            text = `${a} × ${b} ${op} ${c}`

            if(op === '+') { 
                ans = a * b + c 
            } else { 
                ans = a * b - c
            }
        } else {
            a = randInt(2, 20)
            b = randInt(2, 20)
            c = randInt(1, 50)

            if (b > a) [a, b] = [b, a]

            op = Math.random() < 0.5 ? '+' : '-'
            op1 = Math.random() < 0.5 ? '*' : '/'
            text = `${a} ${op1} ${b} ${op} ${c}`

            if(op1 === '/') {
                if (op === '+') {
                    ans = (Math.trunc(a / b)) + c 
                } else { 
                    ans = (Math.trunc(a / b)) - c
                }
            } else {
                if (op === '+') {
                    ans = (a * b) + c 
                } else { 
                    ans = (a * b) - c
                }
            }
        }
    }

    return {text, ans}
}

function checkStart(roomId) {
    const room = rooms[roomId]
    if(!room) return

    const playerss = Object.values(room.players)

    const all = playerss.length === room.tatgetPlayers
    const allReady = playerss.every(p => p.ready)

    if (all && allReady) {
        room.started = true
        room.currentEq = generateEq(room.difficulty)

        io.to(roomId).emit('gameStart')
        io.to(roomId).emit('nextEq', room.currentEq.text)
    }
}

io.on('connection', (socket) => {
    socket.on('joinRoom', ({roomId, config}) => {
        socket.join(roomId)

        if(!rooms[roomId]) {
            rooms[roomId] = {
                players: {},
                difficulty: parseInt(config.difficulty, 10) || 1,
                maxRounds: parseInt(config.maxRounds, 10) || 0,
                scoreGoal: parseInt(config.scoreGoal, 10) || 0,
                currentRound: 1,
                gameOver: false,
                currentEq: null,
                started: false,
                targetPlayers: parseInt(config.targetPlayers, 10) || 1,
            }
        }

        rooms[roomId].players[socket.id] = { score: 0, id: socket.id, ready: false}

        io.to(roomId).emit('roomUpdate', rooms[roomId])
    })

    socket.on('toggleReady', (roomId) => {
        const room = rooms[roomId]
        if(!room || room.started) return

        if(room.players[socket.id]) {
            room.players[socket.id].ready = !room.players[socket.id].ready
        }

        io.to(roomId).emit('roomUpdate', room)
        checkStart(roomId)

    })

    socket.on('submitGuess', ({roomId, guess}) => {
        const room = rooms[roomId]
        if(!room || room.gameOver) return

        if(parseInt(guess, 10) === room.currentEq.ans) {
            room.players[socket.id].score++
            
            let pScore = room.players[socket.id].score
            let goalReached = room.scoreGoal > 0 && pScore >= room.scoreGoal
            let roundFinished = room.maxRounds > 0 && room.currentRound >= room.maxRounds

            if (goalReached || roundFinished) {
                room.gameOver = true
                io.to(roomId).emit('gameOver', {
                    winnerId: socket.id,
                    players: room.players
                }) 
            } else {
                room.currentRound++
                room.currentEq = generateEq(room.difficulty)
                io.to(roomId).emit('roundWin', {
                    winnerId: socket.id,
                    players: room.players,
                    currentRound: room.currentRound
                })
                io.to(roomId).emit('nextEq', room.currentEq.text)
            } 
        } else {
            socket.emit('wrongAnswer')
        }
    })

    socket.on('requestRematch', (roomId) => {
        const room = rooms[roomId]
        if(!room) return

        room.gameOver = false
        room.started = false
        room.currentRound = 1
        room.currentEq = null

        for (let id in room.players) {
            room.players[id].score = 0 
            room.players[id].ready = false
        }

        io.to(roomId).emit('roomUpdate', room)
        io.to(roomId).emit('nextEq', room.currentEq.text)
    })

    socket.on('disconnect', () => {
        for (let roomId in rooms) {
            if(rooms[roomId].players[socket.id]) {
                delete rooms[roomId].players[socket.id]
                if(Object.keys(rooms[roomId].players).length === 0) {
                    delete rooms[roomId]
                } else {
                    rooms[roomId].started = false
                    io.to(roomId).emit('roomUpdate', rooms[roomId])
                }
            }
        }
    })

})

server.listen(3000, () => {
    console.log('Server running on port 3000')
})