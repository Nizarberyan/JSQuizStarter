const questions =   [
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
let userAnswers = [];
let timer;

function showQuestion() {
    const q = questions[currentQuestion];
    quizContainer.innerHTML = `
        <h3>${currentQuestion + 1}. ${q.question}</h3>
        <div class="options">
            ${q.options.map((opt, i) =>
        `<label><input type="radio" name="option" value="${i}"> ${opt}</label>`
    ).join('')}
        </div>
    `;
    nextBtn.textContent = currentQuestion === questions.length - 1 ? "Validate" : "Next";
}

function nextQuestion() {
    const selected = document.querySelector('input[name="option"]:checked');
    if (!selected) {
        alert("Please select an answer!");
        return;
    }

    userAnswers[currentQuestion] = parseInt(selected.value);

    if (currentQuestion === questions.length - 1) {
        showResults();
    } else {
        currentQuestion++;
        showQuestion();
    }
}

function showResults() {
    clearInterval(timer);

    score = 0;
    questions.forEach((q, i) => {
        if (userAnswers[i] === q.answer) score++;
    });

    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    scoreEl.textContent = `${score} / ${questions.length}`;

    feedbackEl.textContent = score >= 8 ? "Excellent!" : score >= 5 ? "Could be better" : "Keep practicing!";

    timerEl.textContent = `Time: ${elapsed}s`;

    const reviewHtml = questions.map((q, i) => {
        const userIdx = userAnswers[i];
        const isCorrect = userIdx === q.answer;
        return `
            <li class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div><strong>${q.question}</strong></div>
                <div>Correct: ${q.options[q.answer]}</div>
                <div>Your answer: ${q.options[userIdx]} ${isCorrect ? '✓' : '✗'}</div>
            </li>
        `;
    }).join('');

    resultsDiv.innerHTML = `
        <div id="answers-review">
            <ol class="review-list">${reviewHtml}</ol>
        </div>
    `;

    resultsDiv.classList.remove('hidden');
    nextBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
}

function startQuiz() {
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    startTime = Date.now();

    timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = `Time: ${elapsed}s`;
    }, 1000);

    resultsDiv.classList.add('hidden');
    nextBtn.style.display = 'inline-block';
    restartBtn.style.display = 'none';

    showQuestion();
}

nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', startQuiz);
reloadBtn.addEventListener('click', startQuiz);

startQuiz();