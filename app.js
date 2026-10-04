const state = {
  sets: [],
  activeSetIndex: 0,
};

const quizContainer = document.getElementById('quiz-container');
const tabContainer = document.getElementById('tab-container');
const shuffleButton = document.getElementById('shuffle-btn');
const submitButton = document.getElementById('submit-btn');
const scoreDisplay = document.getElementById('score-display');
const timerEl = document.getElementById('timer');

let timeLeft = 60 * 60;

async function loadQuestions() {
  const response = await fetch('data/questions.json');
  if (!response.ok) {
    throw new Error('Unable to load question data. Run "node convert.js" first.');
  }

  const data = await response.json();
  state.sets = Array.isArray(data.sets) ? data.sets : [];

  if (state.sets.length === 0) {
    quizContainer.innerHTML = '<div class="empty-state">No questions found. Please check the markdown files.</div>';
    return;
  }

  renderTabs();
  renderExam();
}

function renderTabs() {
  tabContainer.innerHTML = state.sets
    .map((set, index) => {
      const isActive = index === state.activeSetIndex;
      return `
        <button type="button" data-index="${index}" class="tab-button ${isActive ? 'is-active' : ''}">
          ${set.title} (${set.questions.length})
        </button>
      `;
    })
    .join('');

  tabContainer.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeSetIndex = Number(button.dataset.index);
      scoreDisplay.classList.add('hidden');
      renderTabs();
      renderExam();
    });
  });
}

function shuffleQuestions(items) {
  const shuffled = [...items];

  for (let currentIndex = shuffled.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }

  return shuffled;
}

function renderExam() {
  const currentSet = state.sets[state.activeSetIndex];
  if (!currentSet) {
    return;
  }

  const questions = currentSet.questions;
  quizContainer.innerHTML = '';

  if (!questions || questions.length === 0) {
    quizContainer.innerHTML = '<div class="empty-state">No questions found in this set file.</div>';
    return;
  }

  questions.forEach((question, idx) => {
    const inputType = question.multiple ? 'checkbox' : 'radio';
    const optionsHtml = (question.options || [])
      .map((option) => `
        <label class="option-label">
          <input type="${inputType}" name="question-${idx}" value="${option.label}" class="option-input">
          <span class="option-text"><strong>${option.label}.</strong> ${option.text}</span>
        </label>
      `)
      .join('');

    quizContainer.insertAdjacentHTML(
      'beforeend',
      `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md question-card" data-index="${idx}">
          <p class="font-semibold text-white mb-4 text-base sm:text-lg">
            <span class="text-orange-400 font-mono mr-2">Q${idx + 1}.</span> ${question.question}
          </p>
          <div class="space-y-2 options-group">
            ${optionsHtml}
          </div>
        </div>
      `
    );
  });
}

function shuffleCurrentSet() {
  const currentSet = state.sets[state.activeSetIndex];
  if (!currentSet || !Array.isArray(currentSet.questions) || currentSet.questions.length < 2) {
    return;
  }

  currentSet.questions = shuffleQuestions(currentSet.questions);
  scoreDisplay.classList.add('hidden');
  renderExam();
}

function calculateScore() {
  const currentSet = state.sets[state.activeSetIndex];
  const questions = currentSet ? currentSet.questions : [];
  let score = 0;

  questions.forEach((question, idx) => {
    const card = document.querySelectorAll('.question-card')[idx];
    if (!card) return;

    const optionsGroup = card.querySelector('.options-group');
    optionsGroup.querySelectorAll('.option-label').forEach((label) => {
      label.classList.remove('option-correct', 'option-incorrect');
    });

    const selected = Array.from(document.querySelectorAll(`input[name="question-${idx}"]:checked`)).map((input) => input.value.toUpperCase());
    const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
    const isCorrect =
      correctAnswers.length === selected.length &&
      correctAnswers.every((letter) => selected.includes(letter)) &&
      selected.every((letter) => correctAnswers.includes(letter));

    if (isCorrect) score += 1;

    optionsGroup.querySelectorAll('.option-label').forEach((label) => {
      const input = label.querySelector('input');
      const optionLetter = input.value.toUpperCase();

      if (correctAnswers.includes(optionLetter)) {
        label.classList.add('option-correct');
      }

      if (selected.includes(optionLetter) && !correctAnswers.includes(optionLetter)) {
        label.classList.add('option-incorrect');
      }
    });
  });

  return { score, total: questions.length };
}

shuffleButton.addEventListener('click', shuffleCurrentSet);

submitButton.addEventListener('click', () => {
  const { score, total } = calculateScore();
  const percentage = total ? Math.round((score / total) * 100) : 0;
  scoreDisplay.textContent = `Score: ${score} / ${total} (${percentage}%) — ${percentage >= 70 ? '🎉 Pass!' : '📚 Keep Practicing!'}`;
  scoreDisplay.classList.remove('hidden');
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
});

function startTimer() {
  setInterval(() => {
    if (timeLeft > 0) {
      timeLeft -= 1;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.textContent = `⏱️ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }, 1000);
}

loadQuestions()
  .then(() => {
    startTimer();
  })
  .catch((error) => {
    quizContainer.innerHTML = `<div class="empty-state">${error.message}</div>`;
    console.error(error);
  });
