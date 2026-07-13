let streak = 0
let bestStrk = 0 
let current = null
let startTime = null
let timerInterval = null

const timer = document.getElementById('timer')
const eq = document.getElementById('eq')
const streakNum = document.getElementById('streak')
const level = document.getElementById('level')
const feedback = document.getElementById('check')
const best = document.getElementById('best')
const form = document.getElementById('answer')
const input = document.getElementById('ans-input')
const board = document.getElementById('board')


function startTimer() {
    clearInterval(timerInterval)
    startTime = performance.now()
    timerInterval = setInterval(() => {
        const lap = (performance.now() - startTime) / 1000
        timer.textContent = `${lap.toFixed(1)}s`
    }, 100)
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min 
}

function getLevel(s) {
    if (s < 3) return 1
    if (s <= 5) return 2
    if (s <= 7) return 3
    if (s < 10) return 4
    if (s <= 15) return 5
    return 6
}

function generateEq(l) {
    const level = getLevel(l)
    let a, b, c, op, text, ans 

    if (level === 1) {
        a = randInt(1, 9)
        b = randInt(1, 9)
        op = Math.random() < 0.5 ? '+' : '-'
        if (op === '-' && b > a) [a, b] = [b, a]
        text = `${a} ${op} ${b}`
        ans = op === '+' ? a + b : a - b 
    } else if (level === 2) {
        if (Math.random() < 0.5) {
            a = randInt(10, 50)
            b = randInt(10, 50)
            op = Math.random() < 0.5 ? '+' : '-'
            if ( op === '-' && b > a) [a, b] = [b, a]
            text = `${a} ${op} ${b}`
            ans = op === '+' ? a + b : a - b 
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
            ans = op === '+' ? a + b : a - b
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
            ans = op === '+' ? a + b : a - b
        }
    } else if (level === 5) {
        a = randInt(2, 100)
        b = randInt(2, 100)
        text = `${a} / ${b}`
        if (b > a) [a, b] = [b, a]
        ans = Math.trunc(a / b)
        
    } else {
        if (Math.random() < 0.5) {

            a = randInt(2, 20);
            b = randInt(2, 20);
            c = randInt(1, 50);
            op = Math.random() < 0.5 ? '+' : '-';
            text = `${a} × ${b} ${op} ${c}`;
            ans = op === '+' ? a * b + c : a * b - c;
        } else {
            a = randInt(2, 20);
            b = randInt(2, 20);
            c = randInt(1, 50);        
            if (b > a) [a, b] = [b, a]
            op = Math.random() < 0.5 ? '+' : '-';
            text = `${a} / ${b} ${op} ${c}`;
            ans = op === '+' ? (Math.trunc(a / b)) + c : (Math.trunc(a / b)) - c;
        }
    }

    return {text, ans}
}

function nexEq() {
    current = generateEq(streak)
    eq.textContent = current.text
    input.value = ''
    input.focus()
    startTimer()
}

function renderStreak() {
    streakNum.innerHTML = ''
    for(let i = 0; i < streak; i++) {
        const mark = document.createElement('div')
        mark.className = 'streak-mark'
        streakNum.appendChild(mark)
    }
}

function updateLevel() {
    level.textContent = `Level ${getLevel(streak)}`
}

function updateBest() {
    best.textContent = bestStrk > 0 ? `Best streak: ${bestStrk}` : ''

}

form.addEventListener('submit', function(e) {
    e.preventDefault()
    const guess = parseInt(input.value, 10)
    if(isNaN(guess)) return

    clearInterval(timerInterval)
    const timePassed = ((performance.now() - startTime) / 1000).toFixed(2)

    if(guess === current.ans) {
        streak ++
        bestStrk = Math.max(bestStrk, streak)
        feedback.textContent = 'Hell yeaahh!!'
        feedback.className = 'check correct'
        board.classList.remove('shake')
        
    } else {
        feedback.textContent = `Noo :,( — it was ${current.ans}!`;
        feedback.className = 'check wrong';
        streak = 0;
        
        board.classList.add('shake');
        setTimeout(() => board.classList.remove('shake'), 350);
    }

    renderStreak()
    updateLevel()
    updateBest()
    nexEq()
})

nexEq()
renderStreak()
updateLevel()
updateBest()