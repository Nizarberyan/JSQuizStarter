const questions = [
    {
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
        answer: 0
    },
    {
        question: "Which language is used for styling web pages?",
        options: ["HTML", "CSS", "JavaScript"],
        answer: 1
    },
    {
        question: "Inside which HTML element do we put the JavaScript?",
        options: ["< script>", "< js>", "< javascript>"],
        answer: 0
    },
    {
        question: "Which company developed JavaScript?",
        options: ["Netscape", "Microsoft", "Sun Microsystems"],
        answer: 0
    },
    {
        question: "What does CSS stand for?",
        options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System"],
        answer: 0
    },
    {
        question: "Which HTML element is used to define an internal style sheet?",
        options: ["style", "css", "styles"],
        answer: 0
    },
    {
        question: "Which is NOT a JavaScript data type?",
        options: ["Number", "Boolean", "Character"],
        answer: 2
    },
    {
        question: "Which symbol is used for single-line comments in JavaScript?",
        options: ["//", "#", "&lt;!-- --&gt;"],
        answer: 0
    },
    {
        question: "Which method converts a JSON string to a JavaScript object?",
        options: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()"],
        answer: 0
    },
    {
        question: "How do you print 'Hello' to the browser console?",
        options: ["print('Hello')", "console.log('Hello')", "echo('Hello')"],
        answer: 1
    }
];

const quizContainer = document.getElementById('quiz-container');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const reloadBtn = document.getElementById('reload-btn');
const resultsDiv = document.getElementById('results');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const timerEl = document.getElementById('timer');

let currentQuestion = 0;
let score = 0;
let startTime;
let timerInterval;
let userAnswers = [];


const STORAGE_KEY = 'quizStateV1';

function saveState() {
    try {
        const state = {
            currentQuestion,
            userAnswers,
            startTime,
            score,
            finished: resultsDiv && !resultsDiv.classList.contains('hidden'),
            completedElapsed: (resultsDiv && !resultsDiv.classList.contains('hidden')) ? Math.floor((Date.now() - startTime) / 1000) : null
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        throw new Error('Failed to save quiz state to localStorage: ' + e.message);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}


function startTimer() {
    if (!startTime) {
        startTime = Date.now();
    }
    const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = `Time: ${initialElapsed}s`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = `Time: ${elapsed}s`;
    }, 1000);
}


function stopTimer() {
    clearInterval(timerInterval);
}


function showQuestion(index) {
    const q = questions[index];
    quizContainer.innerHTML = `<h3>${index + 1}. ${q.question}</h3>`;
    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('options');
    q.options.forEach((opt, idx) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="option" value="${idx}"> ${opt}`;
        optionsDiv.appendChild(label);
    });
    quizContainer.appendChild(optionsDiv);

    
    nextBtn.textContent = index === questions.length - 1 ? "Validate" : "Next";
}


nextBtn.addEventListener('click', () => {
    const selected = document.querySelector('input[name="option"]:checked');
    if (!selected) {
        alert("Please select an answer!");
        return;
    }


    userAnswers[currentQuestion] = parseInt(selected.value);
    saveState();


    const optionsDiv = document.querySelector('#quiz-container .options');
    if (optionsDiv) {
        const correctIndex = questions[currentQuestion].answer;
        const labels = Array.from(optionsDiv.querySelectorAll('label'));
        labels.forEach((label, idx) => {
            if (idx === correctIndex) {
                label.classList.add('correct');
            } else {
                label.classList.add('incorrect');
            }
            const input = label.querySelector('input[type="radio"]');
            if (input) input.disabled = true;
        });
    }

    // temporarily disable Next to allow user to see the colors
    nextBtn.disabled = true;

    setTimeout(() => {
        nextBtn.disabled = false;
        if (currentQuestion === questions.length - 1) {
            calculateResults();
        } else {
            currentQuestion++;
            saveState();
            showQuestion(currentQuestion);
        }
    }, 800);
});


function calculateResults() {
    stopTimer();
    score = 0;
    questions.forEach((q, i) => {
        if (userAnswers[i] === q.answer) score++;
    });

    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    scoreEl.textContent = `${score} / ${questions.length}`;
    feedbackEl.textContent = score >= 8 ? "Excellent!" : score >= 5 ? "Can do better" : "Keep practicing!";
    resultsDiv.classList.remove('hidden');
    nextBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    timerEl.textContent += ` (Completed in ${elapsed}s)`;
    saveState();
}


restartBtn.addEventListener('click', () => {
    stopTimer();
    startTime = null;
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    resultsDiv.classList.add('hidden');
    restartBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    timerEl.textContent = 'Time: 0s';
    clearState();
    showQuestion(currentQuestion);
    startTimer();
    saveState();
});

// Reload button: reset quiz without page reload
reloadBtn.addEventListener('click', () => {
    stopTimer();
    startTime = null;
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    resultsDiv.classList.add('hidden');
    restartBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    timerEl.textContent = 'Time: 0s';
    clearState();
    showQuestion(currentQuestion);
    startTimer();
    saveState();
});

function init() {
    const saved = loadState();
    if (saved && typeof saved.currentQuestion === 'number') {
        currentQuestion = saved.currentQuestion;
        userAnswers = Array.isArray(saved.userAnswers) ? saved.userAnswers : [];
        startTime = saved.startTime || null;
        score = saved.score || 0;
        if (saved.finished) {
            // Recompute elapsed from saved startTime; show results
            stopTimer();
            const elapsed = saved.completedElapsed != null ? saved.completedElapsed : (startTime ? Math.floor((Date.now() - startTime) / 1000) : 0);
            // Recompute score to be safe
            score = 0;
            questions.forEach((q, i) => { if (userAnswers[i] === q.answer) score++; });
            scoreEl.textContent = `${score} / ${questions.length}`;
            feedbackEl.textContent = score >= 8 ? "Excellent!" : score >= 5 ? "Can do better" : "Keep practicing!";
            resultsDiv.classList.remove('hidden');
            nextBtn.style.display = 'none';
            restartBtn.style.display = 'inline-block';
            timerEl.textContent = `Time: ${elapsed}s (Completed in ${elapsed}s)`;
            return;
        }
        // resume quiz
        showQuestion(currentQuestion);
        startTimer();
        return;
    }
    // no saved state; start fresh
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    showQuestion(currentQuestion);
    startTimer();
    saveState();
}

init();
