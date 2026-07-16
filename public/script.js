const socket = io()

let currentRoom = null
let startTime = null
let timer = null
let gameOverTimer = null

const lobby = document.getElementById('lobby')
const gameFrame = document.getElementById('game-frame')
const lobbyForm = document.getElementById('lobby-form')
const roomInput = document.getElementById('room-input')

const diffInp = document.getElementById('diff-input')
const roundsInp = document.getElementById('rounds-input')
const goalInp = document.getElementById('goal-input')
const playersInp = document.getElementById('players-input')

const eq = document.getElementById('eq')
const feedback = document.getElementById('check')
const form = document.getElementById('answer')
const input = document.getElementById('ans-input')
const board = document.getElementById('board')
const roomDisplay = document.getElementById('room-name')
const scoreDisplay = document.getElementById('score-disp')
const roundDisplay = document.getElementById('level')
const timerDisplay = document.getElementById('timer')

const waitingRoom = document.getElementById('waiting-room')
const gamePlay = document.getElementById('game-play')
const playersList = document.getElementById('player-list')
const readyBtn = document.getElementById('ready-btn')

const gameOv = document.getElementById('gameOv-overlay')
const matchResT = document.getElementById('matchRes-title')
const matchResS = document.getElementById('matchRes-sub')
const matchStats = document.getElementById('match-stats')
const playAgainBtn = document.getElementById('playAgain-btn')
const backToLobbyBtn = document.getElementById('lobby-btn')
const endMatchBtn = document.getElementById('end-match-btn')


function winConfetti() {
    const duration = 1000
    const end = Date.now() + duration;

    (function frame() {
        confetti( {
            particleCount: 5,
            angle: 60,
            spread: 100,
            origin: {x: 0}
        })

        confetti({
            particleCount: 5,
            angle: 120,
            spread: 100,
            origin: {x: 1}
        })

        if (Date.now() < end) {
            requestAnimationFrame(frame)
        }
    }())
}

function startTimer() {
    clearInterval(timer)
    startTime = performance.now()
    timer = setInterval(() => {
        const time = (performance.now() - startTime) / 1000
        timerDisplay.textContent = `${time.toFixed(1)}s`
    }, 100)
}

lobbyForm.addEventListener('submit', (e) => {
    e.preventDefault()
    currentRoom = roomInput.value.trim().toUpperCase()
    if (!currentRoom) return

    const config = {
        difficulty: diffInp.value,
        maxRounds: roundsInp.value,
        scoreGoal: goalInp.value,
        targetPlayers: playersInp.value
    }

    socket.emit('joinRoom', {roomId: currentRoom, config})
    roomDisplay.textContent = `Room: ${currentRoom}`

    lobby.style.display = 'none'
    gameFrame.style.display = 'block'

    waitingRoom.style.display = 'flex'
    gamePlay.style.display = 'none'
    readyBtn.textContent = 'Ready'
    readyBtn.style.background = '#e8d54a'
})

readyBtn.addEventListener('click', () => {
    socket.emit('toggleReady', currentRoom)
})

form.addEventListener('submit', (e) => {
    e.preventDefault()
    const guess = input.value
    if (!guess) return

    socket.emit('submitGuess', { roomId: currentRoom, guess })
    input.value = ''
})

function goToLobby() {
    clearInterval(timer)
    socket.disconnect()
    socket.connect()

    gameOv.style.display = 'none'
    gameFrame.style.display = 'none'
    lobby.style.display = 'block'
}

endMatchBtn.addEventListener('click', () => {
    socket.emit('endMatch', currentRoom)
})

socket.on('matchEnded', () => {
    goToLobby()
})

playAgainBtn.addEventListener('click', () => {
    socket.emit('requestRematch', currentRoom)
})

backToLobbyBtn.addEventListener('click', () => {
    goToLobby()
})

socket.on('roomFull', ({roomId}) => {
    feedback.textContent = `Room ${roomId} is already full, srry :/`
    feedback.className = 'check wrong'

    gameFrame.style.display = 'none'
    lobby.style.display = 'block'
})

socket.on('gameStart', () => {
    waitingRoom.style.display = 'none'
    gamePlay.style.display = 'flex'
    feedback.textContent = ''
    
    input.disabled = false
    form.querySelector('button').disabled = false

    input.focus()
})

socket.on('nextEq', (text) => {
    eq.textContent = text
    input.focus()
    startTimer()
})

socket.on('roundWin', ({ winnerId, players, currentRound }) => {
    board.classList.remove('shake')
    clearInterval(timer)
    
    if (winnerId === socket.id) {
        feedback.textContent = 'You got it!'
        feedback.className = 'check correct'
    } else {
        feedback.textContent = 'Your friend has beat you! :/'
        feedback.className = 'check wrong'
        board.classList.add('shake')
    }


    roundDisplay.textContent = `Round: ${currentRound}`
    renderScores(players)
})

socket.on('wrongAnswer', () => {
    feedback.textContent = 'Wrong! Try again!'
    feedback.className = 'check wrong'
    
    board.classList.add('shake')
    setTimeout(() => board.classList.remove('shake'), 350)
})

function renderScores(players) {
    let scoresText = []
    const ids = Object.keys(players)

    ids.forEach((id, idx) => {
        if (id === socket.id) {
            scoresText.unshift(`You: ${players[id].score}`)
        } else {
            scoresText.push(`Player ${idx + 1}: ${players[id].score}`)
        }

    })
    scoreDisplay.textContent = scoresText.join(' | ')
}

function renderStats(players) {
    matchStats.innerHTML = ''
    const ids = Object.keys(players)

    ids.forEach((id, idx) => {
        const times = players[id].times || []
        if(times.length === 0) return 
        
        const average = times.reduce((a, b) => a + b, 0) / times.length
        const best = Math.min(...times)
        
        
        const who = id === socket.id ? 'You' : `Player ${idx + 1}`

        const line = document.createElement('div')
        if (ids.length === 1) {
            line.textContent = `average: ${(average / 1000).toFixed(1)}s | best time: ${(best / 1000).toFixed(1)}s` 
        } else {
            line.textContent = `${who} -> average: ${(average / 1000).toFixed(1)}s | best time: ${(best / 1000).toFixed(1)}s`
            console.log(`players: ${ids.length}`)
        }
        matchStats.appendChild(line)
    })
}

socket.on('gameOver', ({winnerId, players}) => {
    clearInterval(timer)
    board.classList.remove('shake')
    input.disabled = true
    form.querySelector('button').disabled = true

    gameOv.style.display = 'flex'
    requestAnimationFrame(() => gameOv.style.opacity = 1)

    if(winnerId === socket.id) {
        matchResT.textContent = 'VICTORY! ᕙ(  •̀ ᗜ •́  )ᕗ';
        matchResT.style.color = '#e8d54a';
        matchResS.textContent = 'you won the match! congrats ദി(˵ •̀ ᴗ - ˵ )';
        winConfetti();
    } else {
        matchResT.textContent = 'DEFEAT (╥﹏╥)';
        matchResT.style.color = '#ea6a6a';
        matchResS.textContent = 'You will do better next time! ( ´･･)ﾉ(._.`)';

    }
    renderScores(players)
    renderStats(players)

    clearTimeout(gameOverTimer)
    gameOverTimer = setTimeout(() => {
        matchResS.style.opacity = 0.5
        matchResT.style.opacity = 0.5
    }, 3000)
})


socket.on('roomUpdate', (room) => {
    if(!room.started) {
        waitingRoom.style.display = 'flex'
        gamePlay.style.display = 'none'
        renderWaitingRoom(room)
    }

    if (!room.gameOver && gameOv.style.display === 'flex') {
        gameOv.style.display = 'none'
        clearTimeout(gameOverTimer)
        matchResT.style.opacity = 1
        matchResS.style.opacity = 1
        input.disabled = false
        form.querySelector('button').disabled = false
        feedback.textContent = ''
    }
    roundDisplay.textContent = `Round: ${room.currentRound}`
    renderScores(room.players)
})

function renderWaitingRoom(room) {
    playersList.innerHTML = ''
    let localPlayerReady = false
    timerDisplay.textContent = ''


    const playerss = Object.values(room.players)
    playerss.forEach((p, idx) => {
        const item = document.createElement('div')
        item.className = 'player-item'

        const isMe = p.id === socket.id
        if (isMe) localPlayerReady = p.ready 

        const nameSpan = document.createElement('span')
        nameSpan.className = 'player-name'
        if(isMe) {
            nameSpan.textContent = `You (Player ${idx + 1})`
        } else {
            nameSpan.textContent = `Player ${idx + 1}`
        }

        const statusSpan = document.createElement('span')
        if (p.ready) {
            statusSpan.className = `player-status status-ready`
            statusSpan.textContent = 'Ready'
        } else {
            statusSpan.className = `player-status status-waiting`
            statusSpan.textContent = 'Not ready'
        }

        item.appendChild(nameSpan)
        item.appendChild(statusSpan)
        playersList.appendChild(item)
    })

    if(localPlayerReady) {
        readyBtn.textContent = 'Cancel'
        readyBtn.style.background = '#6b4a35'
        readyBtn.style.color = '#f2efe3'
        readyBtn.style.border = '1px solid #cfd6c8'
    } else {
        readyBtn.textContent = 'Ready'
        readyBtn.style.background = '#e8d54a'
        readyBtn.style.color = '#2a2313'
        readyBtn.style.border = 'none'
    }

    const joined = playerss.length
    const target = room.targetPlayers
    roomDisplay.textContent = `Room: ${currentRoom} (${joined}/${target})`
    
}

