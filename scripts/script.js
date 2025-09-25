
let quizzes = [];
let userNickname = '';

let currentQuizIndex = 0;

const quizContainer = document.getElementById('quiz-container');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const reloadBtn = document.getElementById('reload-btn');
const resultsDiv = document.getElementById('results');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const timerEl = document.getElementById('timer');

function getActiveQuiz() { return quizzes[currentQuizIndex]; }
function getQuestions() { return getActiveQuiz().questions; }

let currentQuestion = 0;
let score = 0;
let startTime;
let timerInterval;
let questionTimerInterval;
let userAnswers = [];
let questionTimeLeft = 15;

const STORAGE_KEY_BASE = 'quizStateV2';
function getStorageKey() {
    const id = quizzes && quizzes[currentQuizIndex] ? quizzes[currentQuizIndex].id : `idx-${currentQuizIndex}`;
    return `${STORAGE_KEY_BASE}:${id}`;
}

function saveState() {
    try {
        const state = {
            currentQuestion,
            userAnswers,
            startTime,
            score,
            quizIndex: currentQuizIndex,
            finished: resultsDiv && !resultsDiv.classList.contains('hidden'),
            completedElapsed: (resultsDiv && !resultsDiv.classList.contains('hidden'))
                ? Math.floor((Date.now() - startTime) / 1000) : null
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save quiz state:', e);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(getStorageKey());
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Failed to load quiz state:', e);
        return null;
    }
}

function clearState() {
    try {
        localStorage.removeItem(getStorageKey());
    } catch (e) {
        console.error('Failed to clear quiz state:', e);
    }
}

function startTimer() {
    if (!startTime) {
        startTime = Date.now();
    }
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = `Time: ${elapsed}s | Q: ${questionTimeLeft}s`;
}

function stopTimer() {
    clearInterval(timerInterval);
    clearInterval(questionTimerInterval);
}

function startQuestionTimer() {
    clearInterval(questionTimerInterval);
    questionTimeLeft = 15;

    updateTimerDisplay();
    questionTimerInterval = setInterval(() => {
        questionTimeLeft -= 1;
        updateTimerDisplay();
        if (questionTimeLeft <= 0) {
            clearInterval(questionTimerInterval);
            handleQuestionTimeout();
        }
    }, 1000);
}

function handleQuestionTimeout() {
    userAnswers[currentQuestion] = [];
    saveState();
    goToNextQuestion(true);
}

function normalizeAnswer(answer) {
    return Array.isArray(answer) ? answer.slice().sort((x, y) => x - y) : [answer];
}

function arraysEqual(a1, a2) {
    if (!Array.isArray(a1) || !Array.isArray(a2)) return false;
    if (a1.length !== a2.length) return false;
    return a1.every((val, i) => val === a2[i]);
}

function isCorrectAnswer(userAnswer, correctAnswer) {
    const normalizedUser = Array.isArray(userAnswer)
        ? userAnswer.slice().sort((a, b) => a - b)
        : (typeof userAnswer === 'number' ? [userAnswer] : []);
    const normalizedCorrect = normalizeAnswer(correctAnswer);
    return arraysEqual(normalizedUser, normalizedCorrect);
}

function showQuestion(index) {
    const qs = getQuestions();
    const q = qs[index];
    const isMultiAnswer = normalizeAnswer(q.answer).length > 1;

    quizContainer.innerHTML = `
        <h3>${index + 1}. ${q.question} 
        ${isMultiAnswer ? '<span class="hint">(Select all that apply)</span>' : ''}
        </h3>
    `;

    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('options');

    const previouslySelected = Array.isArray(userAnswers[index])
        ? userAnswers[index]
        : (typeof userAnswers[index] === 'number' ? [userAnswers[index]] : []);

    q.options.forEach((opt, idx) => {
        const label = document.createElement('label');
        const checked = previouslySelected.includes(idx) ? 'checked' : '';
        label.innerHTML = `<input type="checkbox" name="option" value="${idx}" ${checked}> ${opt}`;
        optionsDiv.appendChild(label);
    });

    quizContainer.appendChild(optionsDiv);
    startQuestionTimer();
    const lastIndex = getQuestions().length - 1;
    nextBtn.textContent = index === lastIndex ? "Validate" : "Next";
}

function goToNextQuestion() {
    if (currentQuestion === getQuestions().length - 1) {
        calculateResults();
    } else {
        currentQuestion++;
        saveState();
        showQuestion(currentQuestion);
    }
}

function calculateResults() {
    stopTimer();

    const qs = getQuestions();
    score = qs.reduce((acc, q, i) => {
        return acc + (isCorrectAnswer(userAnswers[i], q.answer) ? 1 : 0);
    }, 0);

    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    scoreEl.textContent = `${userNickname}: ${score} / ${qs.length}`;
    feedbackEl.textContent = score >= Math.ceil(qs.length * 0.7) ? "Excellent!" : score >= Math.ceil(qs.length * 0.5) ? "Can do better" : "Keep practicing!";

    resultsDiv.classList.remove('hidden');
    nextBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    timerEl.textContent += ` (Completed in ${elapsed}s)`;

    saveState();
}

function resetQuiz() {
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
}

nextBtn.addEventListener('click', () => {
    const selectedNodes = document.querySelectorAll('input[name="option"]:checked');
    if (!selectedNodes || selectedNodes.length === 0) {
        alert("Please select at least one answer!");
        return;
    }

    clearInterval(questionTimerInterval);

    userAnswers[currentQuestion] = Array.from(selectedNodes)
        .map(n => parseInt(n.value))
        .sort((a, b) => a - b);
    saveState();

    const optionsDiv = document.querySelector('#quiz-container .options');
    if (optionsDiv) {
        const correct = normalizeAnswer(getQuestions()[currentQuestion].answer);

        const labels = Array.from(optionsDiv.querySelectorAll('label'));

        labels.forEach((label, idx) => {
            label.classList.add(correct.includes(idx) ? 'correct' : 'incorrect');
            const input = label.querySelector('input[type="checkbox"]');
            if (input) input.disabled = true;
        });
    }

    nextBtn.disabled = true;
    setTimeout(() => {
        nextBtn.disabled = false;
        goToNextQuestion();
    }, 800);
});

restartBtn.addEventListener('click', resetQuiz);
reloadBtn.addEventListener('click', resetQuiz);

async function loadQuiz(topicId) {
    try {
        // Load manifest to get topic metadata
        const manifestResp = await fetch('scripts/data/topics/manifest.json');
        let topicTitle = topicId;
        if (manifestResp.ok) {
            const manifest = await manifestResp.json();
            const topic = manifest.topics?.find(t => t.id === topicId);
            if (topic) topicTitle = topic.title || topicId;
        }
        
        // Load only the specific topic file
        const resp = await fetch(`scripts/data/topics/${topicId}.json`);
        if (!resp.ok) throw new Error(`Topic ${topicId} not found`);
        const questions = await resp.json();
        return { id: topicId, title: topicTitle, questions };
    } catch (e) {
        console.error('Failed to load quiz:', e);
        return { id: topicId, title: topicId, questions: [] };
    }
}

async function init() {
    const params = new URLSearchParams(window.location.search);
    userNickname = params.get('nickname') || '';
    
    // Redirect to index if no nickname provided
    if (!userNickname) {
        window.location.href = 'index.html';
        return;
    }
    
    const topic = params.get('topic') || 'html';
    const quiz = await loadQuiz(topic);
    quizzes = [quiz];
    currentQuizIndex = 0;

    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome ${userNickname}! Theme: ${getActiveQuiz().title}`;
    }
    document.title = `JS Quiz - ${getActiveQuiz().title}`;

    const saved = loadState();

    if (saved && typeof saved.currentQuestion === 'number') {
        currentQuestion = saved.currentQuestion;
        userAnswers = Array.isArray(saved.userAnswers) ? saved.userAnswers : [];
        startTime = saved.startTime || null;
        score = saved.score || 0;

        if (saved.finished) {
            stopTimer();
            const elapsed = saved.completedElapsed != null
                ? saved.completedElapsed
                : (startTime ? Math.floor((Date.now() - startTime) / 1000) : 0);

            const qs = getQuestions();
            score = qs.reduce((acc, q, i) => {
                return acc + (isCorrectAnswer(userAnswers[i], q.answer) ? 1 : 0);
            }, 0);

            scoreEl.textContent = `${userNickname}: ${score} / ${qs.length}`;
            feedbackEl.textContent = score >= Math.ceil(qs.length * 0.7) ? "Excellent!" : score >= Math.ceil(qs.length * 0.5) ? "Can do better" : "Keep practicing!";
            resultsDiv.classList.remove('hidden');
            nextBtn.style.display = 'none';
            restartBtn.style.display = 'inline-block';
            timerEl.textContent = `Time: ${elapsed}s (Completed in ${elapsed}s)`;
            return;
        }

        showQuestion(currentQuestion);
        startTimer();
        return;
    }

    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    showQuestion(currentQuestion);
    startTimer();
    saveState();
}

init()