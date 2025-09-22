const quizzes = [
    {
        id: 'web-dev-fundamentals',
        title: 'Web Dev Fundamentals',
        questions: [
            {
                question: "What does HTML stand for?",
                options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
                answer: 0
            },
            {
                question: "Which of the following are used for styling web pages?",
                options: ["HTML", "CSS", "JavaScript", "Sass"],
                answer: [1, 3]
            },
            {
                question: "Inside which HTML element do we put JavaScript?",
                options: ["&lt;script&gt;", "&lt;js&gt;", "&lt;javascript&gt;"],
                answer: 0
            },
            {
                question: "Which company originally developed JavaScript?",
                options: ["Netscape", "Microsoft", "Sun Microsystems", "Oracle"],
                answer: 0
            },
            {
                question: "What does CSS stand for?",
                options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System"],
                answer: 0
            },
            {
                question: "Which HTML elements can contain metadata? (Select all that apply)",
                options: ["&lt;head&gt;", "&lt;meta&gt;", "&lt;title&gt;", "&lt;body&gt;"],
                answer: [0, 1, 2]
            },
            {
                question: "Which is NOT a JavaScript data type?",
                options: ["Number", "Boolean", "Character", "Symbol"],
                answer: 2
            },
            {
                question: "Which symbols start a single-line comment in JavaScript?",
                options: ["//", "#", "&lt;!-- --&gt;", "/*"],
                answer: 0
            },
            {
                question: "Which methods convert a JSON string to a JavaScript object? (Select all that apply)",
                options: ["JSON.parse()", "JSON.stringify()", "eval()", "Object.fromJSON()"],
                answer: [0, 2]
            },
            {
                question: "How do you print 'Hello' to the browser console?",
                options: ["print('Hello')", "console.log('Hello')", "echo('Hello')"],
                answer: 1
            }
        ]
    },
    {
        id: 'javascript-basics',
        title: 'JavaScript Basics',
        questions: [
            {
                question: "Which keyword creates a block-scoped variable?",
                options: ["var", "let", "const", "static"],
                answer: [1, 2]
            },
            {
                question: "What is the result of typeof null?",
                options: ["null", "object", "undefined", "number"],
                answer: 1
            },
            {
                question: "Which method adds an element to the end of an array?",
                options: ["push", "pop", "shift", "unshift"],
                answer: 0
            },
            {
                question: "Which comparison is strict equality?",
                options: ["==", "=", "===", "!=="],
                answer: 2
            },
            {
                question: "Select all truthy values: (Select all that apply)",
                options: ["0", "'0'", "[]", "''"],
                answer: [1, 2]
            },
            {
                question: "Which array method returns a new array with elements that pass a test?",
                options: ["map", "filter", "reduce", "forEach"],
                answer: 1
            },
            {
                question: "What does the spread operator (...) do in arrays?",
                options: ["Mutates the array", "Copies/expands iterable elements", "Joins arrays in place", "Sorts elements"],
                answer: 1
            },
            {
                question: "Which values are falsy in JavaScript? (Select all that apply)",
                options: ["0", "'false'", "null", "NaN", "[]"],
                answer: [0, 2, 3]
            },
            {
                question: "What does JSON.stringify do?",
                options: ["Parses JSON to object", "Converts a value to a JSON string", "Validates JSON", "Downloads JSON"],
                answer: 1
            },
            {
                question: "What keyword is used to handle errors in a block of code?",
                options: ["catch", "throw", "try", "finally"],
                answer: [0, 2, 3]
            }
        ]
    },
    {
        id: 'css-essentials',
        title: 'CSS Essentials',
        questions: [
            {
                question: "Which property changes text color?",
                options: ["font-color", "text-color", "color", "foreground"],
                answer: 2
            },
            {
                question: "How do you select an element with id=main?",
                options: [".main", "#main", "main", "*[main]"],
                answer: 1
            },
            {
                question: "Which units are relative? (Select all that apply)",
                options: ["px", "em", "rem", "%"],
                answer: [1, 2, 3]
            },
            {
                question: "Which property creates space outside the border?",
                options: ["padding", "margin", "gap", "outline"],
                answer: 1
            },
            {
                question: "Which rule imports another CSS file?",
                options: ["@import", "@use", "@link", "@require"],
                answer: 0
            },
            {
                question: "What does the box-sizing: border-box do?",
                options: ["Adds a border by default", "Includes padding and border in element width/height", "Excludes margins from layout", "Resets box model"],
                answer: 1
            },
            {
                question: "Which properties control flex container direction and wrapping? (Select all that apply)",
                options: ["flex-direction", "flex-flow", "flex-basis", "flex-wrap"],
                answer: [0, 1, 3]
            },
            {
                question: "How do you center a block element horizontally?",
                options: ["margin-left: auto; margin-right: auto;", "text-align: center;", "justify-content: center;", "align-items: center;"],
                answer: 0
            },
            {
                question: "Which selector has the highest specificity?",
                options: ["Element", "Class", "ID", "Universal"],
                answer: 2
            },
            {
                question: "Which media query targets screens up to 600px wide?",
                options: ["@media (min-width: 600px)", "@media screen and (max-width: 600px)", "@media only mobile", "@media width <= 600"],
                answer: 1
            }
        ]
    }
];


let currentQuizIndex = (() => {
    const params = new URLSearchParams(window.location.search);
    const idx = parseInt(params.get('quiz'));
    if (!Number.isFinite(idx) || idx < 0 || idx >= quizzes.length) return 0;
    return idx;
})();

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
    return `${STORAGE_KEY_BASE}:${currentQuizIndex}`;
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

    scoreEl.textContent = `${score} / ${qs.length}`;
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

function init() {
    const subtitle = document.querySelector('header p');
    if (subtitle) subtitle.textContent = `Theme: ${getActiveQuiz().title}`;
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

            scoreEl.textContent = `${score} / ${qs.length}`;
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

init();