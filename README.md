# JSQuizStarter

A simple front-end quiz application (HTML, CSS, JavaScript) that lets learners test their knowledge.

## Overview
JSQuizStarter is a complete static quiz that’s ergonomic and pleasant to use. It practices core client-side application logic (variables, conditions, loops), DOM manipulation, and event handling.

## Features
- 10 questions (minimum), each with 2 to 4 answer choices.
- Single-answer selection per question (radio buttons).
- A timer that starts when the quiz begins and shows elapsed time.
- On the last question, a “Submit” button displays your score.
- Feedback message based on the score (e.g., “Excellent!”, “Could be better”).
- Visual indication after answering (green for the correct option, red for the others).
- “Restart” button to relaunch the quiz without reloading the page.
- Progress persistence (local storage) so your progress is restored if the tab is reloaded.

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript (no framework).
- Clear file structure: `index.html`, `quiz.html`, `styles/style.css`, `scripts/script.js`.

## Project Structure
```
JSQuizStarter/
├── index.html        # Landing page
├── quiz.html         # Quiz page
├── styles/
│   └── style.css     # Styles (light/dark themes, responsive)
├── scripts/
│   └── script.js     # Quiz logic (DOM, events, timer, persistence)
└── README.md
```

## Usage
1. Clone the repository or download the sources.
2. Open `index.html` in a modern browser (no server required).
3. Click “Start Quiz” to begin, then answer the questions.
4. On the last question, the button becomes “Submit” to show the score and feedback.
5. Use “Restart” to relaunch the quiz without reloading the page.

Tip: the “Reload” button resets the quiz without reloading the page.

## Accessibility & Responsive Design
- Responsive layout (desktop/mobile).
- Visible focus states for buttons and options.
- Adequate contrast, with toned-down feedback colors in dark mode to avoid glare.

## JavaScript Concepts Covered
- Variables, conditions, loops.
- DOM manipulation.
- Event handling (click, change).
- Time measurement and local persistence (localStorage).

## License
Educational project. You’re free to use and adapt it.