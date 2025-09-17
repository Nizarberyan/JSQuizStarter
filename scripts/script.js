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
let questionTimerEl = document.getElementById('question-timer');
if (!questionTimerEl) {
    questionTimerEl = document.createElement('div');
    questionTimerEl.id = 'question-timer';
    questionTimerEl.textContent = '';
    if (timerEl && timerEl.parentNode) {
        timerEl.parentNode.insertBefore(questionTimerEl, document.getElementById('quiz-container'));
    }
}

let currentQuestion = 0;
let score = 0;
let startTime;
let timerInterval;
let userAnswers = [];

const QUESTION_TIME_LIMIT = 15;
let perQuestionInterval;
let perQuestionTimeLeft = QUESTION_TIME_LIMIT;
let isTransitioning = false;


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
    // Keep counting total elapsed time in background, but keep it hidden during quiz
    if (timerEl) timerEl.style.display = 'none';
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
    // Stop total elapsed timer updates
    if (timerEl) timerEl.style.display = 'none';
    clearInterval(timerInterval);
}


function updateQuestionTimerEl() {
    if (!questionTimerEl) return;
    questionTimerEl.textContent = perQuestionTimeLeft != null ? `Time left for this question: ${perQuestionTimeLeft}s` : '';
}

function stopPerQuestionTimer() {
    clearInterval(perQuestionInterval);
    perQuestionInterval = null;
}

function startPerQuestionTimer() {
    stopPerQuestionTimer();
    perQuestionTimeLeft = QUESTION_TIME_LIMIT;
    updateQuestionTimerEl();
    perQuestionInterval = setInterval(() => {
        perQuestionTimeLeft--;
        if (perQuestionTimeLeft <= 0) {
            perQuestionTimeLeft = 0;
            updateQuestionTimerEl();
            stopPerQuestionTimer();
            handleTimeUp();
        } else {
            updateQuestionTimerEl();
        }
    }, 1000);
}

function handleTimeUp() {
    if (isTransitioning) return;
    isTransitioning = true;

    // Mark as wrong (-1 indicates timeout/no answer)
    userAnswers[currentQuestion] = -1;
    saveState();

    // Show correct answer highlight
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

    // After brief pause, advance
    setTimeout(() => {
        isTransitioning = false;
        if (currentQuestion === questions.length - 1) {
            calculateResults();
        } else {
            currentQuestion++;
            saveState();
            showQuestion(currentQuestion);
        }
    }, 800);
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

    // Reset transition flag and (re)start per-question timer
    isTransitioning = false;
    startPerQuestionTimer();

    nextBtn.textContent = index === questions.length - 1 ? "Validate" : "Next";
}


nextBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    const selected = document.querySelector('input[name="option"]:checked');
    if (!selected) {
        alert("Please select an answer!");
        return;
    }

    // Stop question countdown while showing feedback
    stopPerQuestionTimer();
    isTransitioning = true;

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
        isTransitioning = false;
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


function renderReview() {
    let review = document.getElementById('answers-review');
    if (!review) {
        review = document.createElement('div');
        review.id = 'answers-review';
        resultsDiv.appendChild(review);
    }
    review.innerHTML = '';
    const list = document.createElement('ol');
    list.className = 'review-list';
    questions.forEach((q, i) => {
        const li = document.createElement('li');
        const correctIdx = q.answer;
        const correctText = q.options[correctIdx];
        const userIdx = userAnswers[i];
        const userText = (userIdx != null && userIdx >= 0) ? q.options[userIdx] : 'No answer';
        const isCorrect = userIdx === correctIdx;
        const statusClass = isCorrect ? 'correct' : 'incorrect';
        const statusLabel = isCorrect ? 'Correct' : (userIdx == null || userIdx < 0 ? 'No answer' : 'Incorrect');
        li.innerHTML = `<div class="review-item ${statusClass}"><div class="review-q"><strong>${q.question}</strong></div><div class="review-a"><span class="label">Correct:</span> <span class="value">${correctText}</span></div><div class="review-your"><span class="label">Your answer:</span> <span class="value">${userText}</span> <span class="badge ${statusClass}">${statusLabel}</span></div></div>`;
        list.appendChild(li);
    });
    review.appendChild(list);
}

function calculateResults() {
    stopPerQuestionTimer();
    stopTimer();
    score = 0;
    questions.forEach((q, i) => {
        if (userAnswers[i] === q.answer) score++;
    });

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const percent = Math.round((score / questions.length) * 100);

    // Score text styling and progress
    scoreEl.textContent = `${score} / ${questions.length}`;
    scoreEl.classList.add('score-big');

    const feedbackText = score >= 8 ? "Excellent!" : score >= 5 ? "Could be better" : "Keep practicing!";
    const feedbackLevel = score >= 8 ? 'good' : (score >= 5 ? 'ok' : 'bad');
    feedbackEl.textContent = feedbackText;
    feedbackEl.classList.add('feedback-badge', feedbackLevel);

    // Create/update progress bar under score
    let progressWrap = document.getElementById('score-progress');
    if (!progressWrap) {
        progressWrap = document.createElement('div');
        progressWrap.id = 'score-progress';
        resultsDiv.insertBefore(progressWrap, document.getElementById('answers-review'));
    }
    progressWrap.innerHTML = `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="progress-bar" style="width:${percent}%"></div></div><div class="percent-text">${percent}%</div>`;

    // Build review of correct answers and user's answers
    renderReview();

    resultsDiv.classList.remove('hidden');
    nextBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';

    // Show total time at the end only
    if (timerEl) {
        timerEl.style.display = 'block';
        timerEl.textContent = `Time: ${elapsed}s`;
    }
    if (questionTimerEl) {
        questionTimerEl.textContent = '';
    }

    saveState();
}


restartBtn.addEventListener('click', () => {
    stopPerQuestionTimer();
    stopTimer();
    startTime = null;
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    resultsDiv.classList.add('hidden');
    const review = document.getElementById('answers-review');
    if (review) review.innerHTML = '';
    const progressWrap = document.getElementById('score-progress');
    if (progressWrap) progressWrap.remove();
    scoreEl.classList.remove('score-big');
    feedbackEl.classList.remove('feedback-badge', 'good', 'ok', 'bad');
    restartBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    if (timerEl) {
        timerEl.textContent = 'Time: 0s';
        timerEl.style.display = 'none';
    }
    if (questionTimerEl) questionTimerEl.textContent = '';
    clearState();
    showQuestion(currentQuestion);
    startTimer();
    saveState();
});

// Reload button: reset quiz without page reload
reloadBtn.addEventListener('click', () => {
    stopPerQuestionTimer();
    stopTimer();
    startTime = null;
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    resultsDiv.classList.add('hidden');
    const review = document.getElementById('answers-review');
    if (review) review.innerHTML = '';
    const progressWrap = document.getElementById('score-progress');
    if (progressWrap) progressWrap.remove();
    scoreEl.classList.remove('score-big');
    feedbackEl.classList.remove('feedback-badge', 'good', 'ok', 'bad');
    restartBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    if (timerEl) {
        timerEl.textContent = 'Time: 0s';
        timerEl.style.display = 'none';
    }
    if (questionTimerEl) questionTimerEl.textContent = '';
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
            const percent = Math.round((score / questions.length) * 100);

            // Score and feedback styling
            scoreEl.textContent = `${score} / ${questions.length}`;
            scoreEl.classList.add('score-big');
            const feedbackText = score >= 8 ? "Excellent!" : score >= 5 ? "Could be better" : "Keep practicing!";
            const feedbackLevel = score >= 8 ? 'good' : (score >= 5 ? 'ok' : 'bad');
            feedbackEl.textContent = feedbackText;
            feedbackEl.classList.add('feedback-badge', feedbackLevel);

            // Progress bar
            let progressWrap = document.getElementById('score-progress');
            if (!progressWrap) {
                progressWrap = document.createElement('div');
                progressWrap.id = 'score-progress';
                resultsDiv.insertBefore(progressWrap, document.getElementById('answers-review'));
            }
            progressWrap.innerHTML = `<div class=\"progress\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"${percent}\"><div class=\"progress-bar\" style=\"width:${percent}%\"></div></div><div class=\"percent-text\">${percent}%</div>`;

            // Also show the review of correct answers
            renderReview();

            resultsDiv.classList.remove('hidden');
            nextBtn.style.display = 'none';
            restartBtn.style.display = 'inline-block';
            if (timerEl) {
                timerEl.style.display = 'block';
                timerEl.textContent = `Time: ${elapsed}s`;
            }
            if (questionTimerEl) questionTimerEl.textContent = '';
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
