class QuizApp {
    constructor() {
        this.quiz = null;
        this.userNickname = '';
        this.currentQuestion = 0;
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.questionTimerInterval = null;
        this.userAnswers = [];
        this.questionTimeLeft = 15;

        // DOM elements
        this.elements = {
            quizContainer: document.getElementById('quiz-container'),
            nextBtn: document.getElementById('next-btn'),
            restartBtn: document.getElementById('restart-btn'),
            reloadBtn: document.getElementById('reload-btn'),
            resultsDiv: document.getElementById('results'),
            scoreEl: document.getElementById('score'),
            feedbackEl: document.getElementById('feedback'),
            timerEl: document.getElementById('timer'),
            welcomeMsg: document.getElementById('welcome-message')
        };

        this.bindEvents();
    }

    // Storage management
    getStorageKey(type = 'progress') {
        const topicId = this.quiz?.id || 'unknown';
        return `quiz_${type}:${this.userNickname}:${topicId}`;
    }

    saveProgress() {
        try {
            const state = {
                currentQuestion: this.currentQuestion,
                userAnswers: this.userAnswers,
                startTime: this.startTime,
                score: this.score,
                finished: !this.elements.resultsDiv.classList.contains('hidden'),
                completedElapsed: !this.elements.resultsDiv.classList.contains('hidden')
                    ? Math.floor((Date.now() - this.startTime) / 1000) : null
            };
            localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    loadProgress() {
        try {
            const raw = localStorage.getItem(this.getStorageKey());
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('Failed to load progress:', error);
            return null;
        }
    }

    clearProgress() {
        try {
            localStorage.removeItem(this.getStorageKey());
        } catch (error) {
            console.error('Failed to clear progress:', error);
        }
    }

    saveQuizResult() {
        try {
            const isRevisionMode = this.quiz.id === 'revision';
            
            if (isRevisionMode) {
                this.updateRevisionResults();
            } else {
                const questionResults = this.quiz.questions.map((question, index) => ({
                    question: question.question,
                    options: question.options,
                    correctAnswer: question.answer,
                    userAnswer: this.userAnswers[index] || [],
                    isCorrect: this.isCorrectAnswer(this.userAnswers[index], question.answer)
                }));

                const result = {
                    nickname: this.userNickname,
                    theme: this.quiz.title,
                    themeId: this.quiz.id,
                    score: this.score,
                    totalQuestions: this.quiz.questions.length,
                    date: new Date().toISOString(),
                    timeElapsed: Math.floor((Date.now() - this.startTime) / 1000),
                    questionResults: questionResults
                };

                const historyKey = `quiz_history:${this.userNickname}`;
                const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
                existingHistory.push(result);
                localStorage.setItem(historyKey, JSON.stringify(existingHistory));
            }
        } catch (error) {
            console.error('Failed to save quiz result:', error);
        }
    }

    updateRevisionResults() {
        const historyKey = `quiz_history:${this.userNickname}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        this.quiz.questions.forEach((revisionQuestion, index) => {
            const isCorrect = this.isCorrectAnswer(this.userAnswers[index], revisionQuestion.answer);
            
            history.forEach(quiz => {
                if (quiz.questionResults) {
                    quiz.questionResults.forEach(result => {
                        if (result.question === revisionQuestion.question && !result.isCorrect && isCorrect) {
                            result.isCorrect = true;
                            quiz.score++;
                        }
                    });
                }
            });
        });
        
        localStorage.setItem(historyKey, JSON.stringify(history));
    }

    
    startGlobalTimer() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        this.updateTimerDisplay();
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
    }

    startQuestionTimer() {
        clearInterval(this.questionTimerInterval);
        this.questionTimeLeft = 15;
        this.updateTimerDisplay();

        this.questionTimerInterval = setInterval(() => {
            this.questionTimeLeft--;
            this.updateTimerDisplay();

            if (this.questionTimeLeft <= 0) {
                this.handleQuestionTimeout();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.elements.timerEl.textContent = `Global: ${elapsed}s | Question: ${this.questionTimeLeft}s`;
    }

    stopAllTimers() {
        clearInterval(this.timerInterval);
        clearInterval(this.questionTimerInterval);
    }

    handleQuestionTimeout() {
        clearInterval(this.questionTimerInterval);
        this.userAnswers[this.currentQuestion] = [];
        this.saveProgress();
        this.goToNextQuestion(true);
    }



    normalizeAnswer(answer) {
        if (Array.isArray(answer)) {
            return answer.slice().sort((a, b) => a - b);
        }
        return [answer];
    }

    isCorrectAnswer(userAnswer, correctAnswer) {
        const normalizedUser = Array.isArray(userAnswer)
            ? userAnswer.slice().sort((a, b) => a - b)
            : (typeof userAnswer === 'number' ? [userAnswer] : []);
        const normalizedCorrect = this.normalizeAnswer(correctAnswer);

        return this.arraysEqual(normalizedUser, normalizedCorrect);
    }

    arraysEqual(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, i) => val === arr2[i]);
    }

    showQuestion(index) {
        const question = this.quiz.questions[index];
        const isMultiAnswer = this.normalizeAnswer(question.answer).length > 1;


        this.elements.quizContainer.innerHTML = `
            <h3>${index + 1}. ${question.question} 
            ${isMultiAnswer ? '<span class="hint">(Select all that apply)</span>' : ''}
            </h3>
        `;


        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('options');

        const previouslySelected = Array.isArray(this.userAnswers[index])
            ? this.userAnswers[index]
            : (typeof this.userAnswers[index] === 'number' ? [this.userAnswers[index]] : []);

        question.options.forEach((option, idx) => {
            const label = document.createElement('label');
            const isChecked = previouslySelected.includes(idx) ? 'checked' : '';
            label.innerHTML = `
                <input type="checkbox" name="option" value="${idx}" ${isChecked}> 
                ${option}
            `;
            optionsDiv.appendChild(label);
        });

        this.elements.quizContainer.appendChild(optionsDiv);
        this.startQuestionTimer();


        const isLastQuestion = index === this.quiz.questions.length - 1;
        this.elements.nextBtn.textContent = isLastQuestion ? "Finish Quiz" : "Next Question";
    }

    processAnswer() {
        const selectedNodes = document.querySelectorAll('input[name="option"]:checked');

        if (!selectedNodes || selectedNodes.length === 0) {
            alert("Please select at least one answer!");
            return false;
        }

        clearInterval(this.questionTimerInterval);


        this.userAnswers[this.currentQuestion] = Array.from(selectedNodes)
            .map(node => parseInt(node.value))
            .sort((a, b) => a - b);

        this.saveProgress();
        this.showAnswerFeedback();
        return true;
    }

    showAnswerFeedback() {
        const optionsDiv = document.querySelector('#quiz-container .options');
        if (!optionsDiv) return;

        const correctAnswers = this.normalizeAnswer(this.quiz.questions[this.currentQuestion].answer);
        const labels = Array.from(optionsDiv.querySelectorAll('label'));

        labels.forEach((label, idx) => {
            const isCorrect = correctAnswers.includes(idx);
            label.classList.add(isCorrect ? 'correct' : 'incorrect');

            const input = label.querySelector('input[type="checkbox"]');
            if (input) input.disabled = true;
        });

        this.elements.nextBtn.disabled = true;
        setTimeout(() => {
            this.elements.nextBtn.disabled = false;
            this.goToNextQuestion();
        }, 1500);
    }

    goToNextQuestion(autoAdvance = false) {
        if (this.currentQuestion === this.quiz.questions.length - 1) {
            this.calculateResults();
        } else {
            this.currentQuestion++;
            this.saveProgress();
            this.showQuestion(this.currentQuestion);
        }
    }

    calculateResults() {
        this.stopAllTimers();


        this.score = this.quiz.questions.reduce((total, question, index) => {
            return total + (this.isCorrectAnswer(this.userAnswers[index], question.answer) ? 1 : 0);
        }, 0);

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const percentage = Math.round((this.score / this.quiz.questions.length) * 100);


        this.elements.scoreEl.textContent = `${this.userNickname}: ${this.score}/${this.quiz.questions.length} (${percentage}%)`;

        // Feedback based on performance
        let feedback;
        if (percentage >= 80) feedback = "Excellent work! 🎉";
        else if (percentage >= 60) feedback = "Good job! Keep improving! 👍";
        else feedback = "Keep practicing! You'll get better! 💪";

        this.elements.feedbackEl.textContent = feedback;


        this.elements.resultsDiv.classList.remove('hidden');
        this.elements.nextBtn.style.display = 'none';
        this.elements.restartBtn.style.display = 'inline-block';
        this.elements.timerEl.textContent = `Completed in ${elapsed}s`;


        this.saveProgress();
        this.saveQuizResult();
    }

    resetQuiz() {
        this.stopAllTimers();
        this.startTime = null;
        this.currentQuestion = 0;
        this.score = 0;
        this.userAnswers = [];


        this.elements.resultsDiv.classList.add('hidden');
        this.elements.restartBtn.style.display = 'none';
        this.elements.nextBtn.style.display = 'inline-block';
        this.elements.timerEl.textContent = 'Time: 0s';

        this.clearProgress();
        this.showQuestion(this.currentQuestion);
        this.startGlobalTimer();
        this.saveProgress();
    }


    async loadQuiz(topicId) {
        try {

            let topicTitle = topicId;
            try {
                const manifestResp = await fetch('scripts/data/topics/manifest.json');
                if (manifestResp.ok) {
                    const manifest = await manifestResp.json();
                    const topic = manifest.topics?.find(t => t.id === topicId);
                    if (topic) topicTitle = topic.title || topicId;
                }
            } catch (e) {
                console.warn('Could not load manifest:', e);
            }


            const resp = await fetch(`scripts/data/topics/${topicId}.json`);
            if (!resp.ok) {
                throw new Error(`Topic ${topicId} not found (${resp.status})`);
            }

            const questions = await resp.json();
            return {
                id: topicId,
                title: topicTitle,
                questions: Array.isArray(questions) ? questions : questions.questions || []
            };
        } catch (error) {
            console.error('Failed to load quiz:', error);
            throw error;
        }
    }


    getUserHistory() {
        try {
            const historyKey = `quiz_history:${this.userNickname}`;
            return JSON.parse(localStorage.getItem(historyKey) || '[]');
        } catch (error) {
            console.error('Failed to get user history:', error);
            return [];
        }
    }

    calculateStatistics() {
        const history = this.getUserHistory();

        return {
            totalQuizzes: history.length,
            averageScore: history.length > 0
                ? history.reduce((sum, quiz) => sum + (quiz.score / quiz.totalQuestions), 0) / history.length
                : 0,
            bestScore: history.reduce((best, quiz) => {
                const percentage = quiz.score / quiz.totalQuestions;
                return percentage > best ? percentage : best;
            }, 0),
            themesPlayed: [...new Set(history.map(quiz => quiz.theme))],
            recentQuizzes: history
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5),
            scoresByTheme: history.reduce((acc, quiz) => {
                const theme = quiz.theme;
                if (!acc[theme]) acc[theme] = [];
                acc[theme].push(quiz.score / quiz.totalQuestions);
                return acc;
            }, {})
        };
    }


    bindEvents() {
        this.elements.nextBtn.addEventListener('click', () => {
            if (this.processAnswer()) {

            }
        });

        this.elements.restartBtn.addEventListener('click', () => {
            this.resetQuiz();
        });

        this.elements.reloadBtn.addEventListener('click', () => {
            this.resetQuiz();
        });
    }

    async initialize() {
        this.userNickname = localStorage.getItem('currentUser') || '';

        if (!this.userNickname) {
            window.location.href = 'index.html';
            return;
        }

        const isRevisionMode = localStorage.getItem('revisionMode') === 'true';
        if (isRevisionMode) {
            const revisionQuestions = JSON.parse(localStorage.getItem('revisionQuestions') || '[]');
            if (revisionQuestions.length > 0) {
                this.quiz = {
                    id: 'revision',
                    title: 'Revision Mode',
                    questions: revisionQuestions
                };
                localStorage.removeItem('revisionMode');
                localStorage.removeItem('revisionQuestions');
            } else {
                alert('No revision questions available');
                window.location.href = 'dashboard.html';
                return;
            }
        } else {
            const topicId = localStorage.getItem('currentTopic') || 'html';
            try {
                this.quiz = await this.loadQuiz(topicId);
            } catch (error) {
                console.error('Failed to load quiz:', error);
                alert(`Failed to load quiz: ${error.message}`);
                return;
            }
        }

        if (!this.quiz.questions || this.quiz.questions.length === 0) {
            throw new Error('No questions found in quiz data');
        }

        if (this.elements.welcomeMsg) {
            this.elements.welcomeMsg.textContent = `Welcome ${this.userNickname}! Theme: ${this.quiz.title}`;
        }
        document.title = `JS Quiz - ${this.quiz.title}`;

        const savedProgress = this.loadProgress();

        if (savedProgress && typeof savedProgress.currentQuestion === 'number') {
            this.restoreSession(savedProgress);
        } else {
            this.startNewQuiz();
        }
    }

    restoreSession(savedProgress) {
        this.currentQuestion = savedProgress.currentQuestion;
        this.userAnswers = Array.isArray(savedProgress.userAnswers) ? savedProgress.userAnswers : [];
        this.startTime = savedProgress.startTime || null;
        this.score = savedProgress.score || 0;

        if (savedProgress.finished) {

            this.stopAllTimers();
            const elapsed = savedProgress.completedElapsed ||
                (this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0);

            this.score = this.quiz.questions.reduce((total, question, index) => {
                return total + (this.isCorrectAnswer(this.userAnswers[index], question.answer) ? 1 : 0);
            }, 0);

            const percentage = Math.round((this.score / this.quiz.questions.length) * 100);
            this.elements.scoreEl.textContent = `${this.userNickname}: ${this.score}/${this.quiz.questions.length} (${percentage}%)`;

            let feedback;
            if (percentage >= 80) feedback = "Excellent work! 🎉";
            else if (percentage >= 60) feedback = "Good job! Keep improving! 👍";
            else feedback = "Keep practicing! You'll get better! 💪";

            this.elements.feedbackEl.textContent = feedback;
            this.elements.resultsDiv.classList.remove('hidden');
            this.elements.nextBtn.style.display = 'none';
            this.elements.restartBtn.style.display = 'inline-block';
            this.elements.timerEl.textContent = `Completed in ${elapsed}s`;
        } else {

            this.showQuestion(this.currentQuestion);
            this.startGlobalTimer();
        }
    }

    startNewQuiz() {
        this.currentQuestion = 0;
        this.score = 0;
        this.userAnswers = [];
        this.showQuestion(this.currentQuestion);
        this.startGlobalTimer();
        this.saveProgress();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const quizApp = new QuizApp();
    quizApp.initialize();


    window.quizApp = quizApp;
});