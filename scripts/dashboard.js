class Dashboard {
    constructor() {
        this.currentUser = localStorage.getItem('currentUser');
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        this.init();
    }

    init() {
        document.getElementById('user-welcome').textContent = `Welcome ${this.currentUser}!`;
        this.loadStatistics();
        this.createCharts();
        this.bindEvents();
    }

    getAllHistory() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('quiz_history:'));
        const allHistory = [];
        keys.forEach(key => {
            const history = JSON.parse(localStorage.getItem(key) || '[]');
            allHistory.push(...history);
        });
        return allHistory;
    }

    getUserHistory() {
        return JSON.parse(localStorage.getItem(`quiz_history:${this.currentUser}`) || '[]');
    }

    loadStatistics() {
        const userHistory = this.getUserHistory();
        const allHistory = this.getAllHistory();

        // User stats
        const totalGames = userHistory.length;
        const avgScore = totalGames > 0 ? 
            Math.round(userHistory.reduce((sum, game) => sum + (game.score / game.totalQuestions * 100), 0) / totalGames) : 0;
        const bestScore = totalGames > 0 ? 
            Math.max(...userHistory.map(game => Math.round(game.score / game.totalQuestions * 100))) : 0;

        document.getElementById('total-games').textContent = totalGames;
        document.getElementById('avg-score').textContent = `${avgScore}%`;
        document.getElementById('best-score').textContent = `${bestScore}%`;

        // Theme stats
        this.displayThemeStats(userHistory);
        
        // Leaderboard
        this.displayLeaderboard(allHistory);
    }

    displayThemeStats(history) {
        const themeStats = history.reduce((acc, game) => {
            if (!acc[game.theme]) {
                acc[game.theme] = { games: 0, totalScore: 0, totalQuestions: 0 };
            }
            acc[game.theme].games++;
            acc[game.theme].totalScore += game.score;
            acc[game.theme].totalQuestions += game.totalQuestions;
            return acc;
        }, {});

        const container = document.getElementById('theme-stats');
        container.innerHTML = Object.entries(themeStats).map(([theme, stats]) => {
            const avgScore = Math.round((stats.totalScore / stats.totalQuestions) * 100);
            return `
                <div class="theme-stat">
                    <strong>${theme}</strong>: ${stats.games} games, ${avgScore}% avg
                </div>
            `;
        }).join('');
    }

    displayLeaderboard(allHistory) {
        const playerStats = allHistory.reduce((acc, game) => {
            if (!acc[game.nickname]) {
                acc[game.nickname] = { totalScore: 0, totalQuestions: 0, games: 0 };
            }
            acc[game.nickname].totalScore += game.score;
            acc[game.nickname].totalQuestions += game.totalQuestions;
            acc[game.nickname].games++;
            return acc;
        }, {});

        const leaderboard = Object.entries(playerStats)
            .map(([nickname, stats]) => ({
                nickname,
                avgScore: Math.round((stats.totalScore / stats.totalQuestions) * 100),
                games: stats.games
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 3);

        const container = document.getElementById('leaderboard');
        container.innerHTML = leaderboard.map((player, index) => `
            <div class="leaderboard-item">
                <span class="rank">${index + 1}.</span>
                <span class="name">${player.nickname}</span>
                <span class="score">${player.avgScore}% (${player.games} games)</span>
            </div>
        `).join('');
    }

    createCharts() {
        this.createThemeChart();
        this.createProgressChart();
    }

    createThemeChart() {
        const history = this.getUserHistory();
        const themeData = history.reduce((acc, game) => {
            acc[game.theme] = (acc[game.theme] || 0) + 1;
            return acc;
        }, {});

        const ctx = document.getElementById('themeChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(themeData),
                datasets: [{
                    data: Object.values(themeData),
                    backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    createProgressChart() {
        const history = this.getUserHistory().slice(-10);
        const scores = history.map(game => Math.round((game.score / game.totalQuestions) * 100));
        const dates = history.map(game => new Date(game.date).toLocaleDateString());

        const ctx = document.getElementById('progressChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Score %',
                    data: scores,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    bindEvents() {
        document.getElementById('export-csv').addEventListener('click', () => this.exportCSV());
        document.getElementById('export-json').addEventListener('click', () => this.exportJSON());
        document.getElementById('clear-data').addEventListener('click', () => this.clearData());
        document.getElementById('revision-mode').addEventListener('click', () => this.startRevisionMode());
    }

    startRevisionMode() {
        const history = this.getUserHistory();
        const failedQuestions = this.getFailedQuestions(history);
        
        if (failedQuestions.length === 0) {
            alert('No failed questions found. Great job!');
            return;
        }
        
        localStorage.setItem('revisionQuestions', JSON.stringify(failedQuestions));
        localStorage.setItem('revisionMode', 'true');
        window.location.href = 'quiz.html';
    }

    getFailedQuestions(history) {
        const failedQuestions = [];
        history.forEach(quiz => {
            if (quiz.questionResults) {
                quiz.questionResults.forEach(result => {
                    if (!result.isCorrect) {
                        failedQuestions.push({
                            question: result.question,
                            options: result.options,
                            answer: result.correctAnswer
                        });
                    }
                });
            }
        });
        return failedQuestions.slice(0, 20);
    }

    exportCSV() {
        const history = this.getUserHistory();
        const csv = [
            'Date,Theme,Score,Total,Percentage,Time',
            ...history.map(game => [
                new Date(game.date).toLocaleDateString(),
                game.theme,
                game.score,
                game.totalQuestions,
                Math.round((game.score / game.totalQuestions) * 100),
                game.timeElapsed
            ].join(','))
        ].join('\n');

        this.downloadFile(csv, `quiz-history-${this.currentUser}.csv`, 'text/csv');
    }

    exportJSON() {
        const history = this.getUserHistory();
        const json = JSON.stringify(history, null, 2);
        this.downloadFile(json, `quiz-history-${this.currentUser}.json`, 'application/json');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Are you sure you want to clear all your quiz data?')) {
            localStorage.removeItem(`quiz_history:${this.currentUser}`);
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(`quiz_progress:${this.currentUser}:`)) {
                    localStorage.removeItem(key);
                }
            });
            location.reload();
        }
    }
}

new Dashboard();