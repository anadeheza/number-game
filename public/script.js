const socket = io()

let currentRoom = null
let startTime = null
let timerInterval = null

const lobby = document.getElementById('lobby')
const gameFrame = document.getElementById('game-frame')
const lobbyForm = document.getElementById('lobby-form')
const roomInput = document.getElementById('room-input')

const diffInp = document.getElementById('diff-input')
const roundsInp = document.getElementById('rounds-input')
const goalInp = document.getElementById('goal-input')

const eq = document.getElementById('eq')
const feedback = document.getElementById('check')
const form = document.getElementById('answer')
const input = document.getElementById('ans-input')
const board = document.getElementById('board')
const roomDisplay = document.getElementById('room-name')
const scoreDisplay = document.getElementById('score-disp')
const roundDisplay = document.getElementById('level')
const timerDisplay = document.getElementById('timer')

const gameOv = document.getElementById('gameOv-overlay')
const matchResT = document.getElementById('matchRes-title')
const matchResS = document.getElementById('matchRes-sub')
const playAgainBtn = document.getElementById('playAgain-btn')
const bbackToLobbyBtn = document.getElementById('lobby-btn')

function winConfetti() {
    const duration = 3000
    const end = Date.now() + duration

    (function frame() {
        confetti( {
            particleCount: 20,
            angle: 60,
            spread: 50,
            origin: {x: 0}
        })

        confetti({
            particleCount: 20,
            angle: 120,
            spread: 50,
            origin: {x: 1}
        })

        if (Date.now() < end) {
            requestAnimationFrame(frame)
        }
    }())
}

function startTimer() {
    clearInterval(timerInterval)
    startTime = performance.now()
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000
        timerDisplay.textContent = `${elapsed.toFixed(1)}s`
    }, 100)
}

lobbyForm.addEventListener('submit', (e) => {
    e.preventDefault()
    currentRoom = roomInput.value.trim().toUpperCase()
    if (!currentRoom) return

    const config = {
        difficulty: diffInp.value,
        maxRounds: roundsInp.value,
        scoreGoal: goalInp.value

    }

    socket.emit('joinRoom', {roomId: currentRoom, config})

    roomDisplay.textContent = `Room: ${currentRoom}`
    lobby.style.display = 'none'
    gameFrame.style.display = 'block'

    input.disabled = false
    form.querySelector('button').disabled = false
    gameOv.style.display = 'none'
    feedback.textContent = ''

    input.focus()

})

form.addEventListener('submit', (e) => {
    e.preventDefault()
    const guess = input.value
    if (!guess) return

    socket.emit('submitGuess', { roomId: currentRoom, guess })
    input.value = ''
})

playAgainBtn.addEventListener('click', () => {
    socket.emit('requestRematch', currentRoom)
})

bbackToLobbyBtn.addEventListener('click', () => {
    socket.disconnect()
    socket.connect()

    gameOv.style.display = 'none'
    gameFrame.style.display = 'none'
    lobby.style.display = 'block'
})

socket.on('nextEq', (text) => {
    eq.textContent = text
    input.focus()
    startTimer()
})

socket.on('roundWin', ({ winnerId, players, currentRound }) => {
    board.classList.remove('shake')
    clearInterval(timerInterval)
    
    if (winnerId === socket.id) {
        feedback.textContent = 'You got it first!'
        feedback.className = 'check correct'
    } else {
        feedback.textContent = 'Your friend has beat you! >:('
        feedback.className = 'check wrong'
        board.classList.add('shake')
    }


    roundDisplay.textContent = `Round: ${currentRound}`
    renderScores(players)
})

socket.on('gameOver', ({winnerId, players}) => {
    clearInterval(timerInterval)
    board.classList.remove('shake')
    input.disabled = true
    form.querySelector('button').disabled = true

    gameOv.style.display = 'flex'

    if(winnerId === socket.id) {
        matchResT.textContent = 'VICTORY! ᕙ(  •̀ ᗜ •́  )ᕗ';
        matchResT.style.color = '#e8d54a';
        matchResS.textContent = 'you won the match! congratsദ് ദി(˵ •̀ ᴗ - ˵ )';
        winConfetti();
    } else {
        matchResT.textContent = 'DEFEAT (╥﹏╥)';
        matchResT.style.color = '#ea6a6a';
        matchResS.textContent = 'It is okay, you will do better next time! ( ´･･)ﾉ(._.`)';

    }
    renderScores(players)
})

socket.on('wrongAnswer', () => {
    feedback.textContent = 'Wrong! Try again!'
    feedback.className = 'check wrong'
    board.classList.add('shake')
    setTimeout(() => board.classList.remove('shake'), 350)
})

socket.on('roomUpdate', (room) => {
    if (!room.gameOver && gameOv.style.display === 'flex') {
        gameOv.style.display = 'none'
        input.disabled = false
        form.querySelector('button').disabled = false
        feedback.textContent = ''
        input.focus()
    }
    roundDisplay.textContent = `Round: ${room.currentRound}`
    renderScores(room.players)
})

function renderScores(players) {
    let scoresText = []
    for (let id in players) {
        if (id === socket.id) {
            scoresText.unshift(`You: ${players[id].score}`)
        } else {
            scoresText.push(`Them: ${players[id].score}`)
        }

    }
    scoreDisplay.textContent = scoresText.join(' | ')
}