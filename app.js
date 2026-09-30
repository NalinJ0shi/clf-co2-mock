const fs = require('fs');
const path = require('path');

const inputFolder = path.join(__dirname, 'markdown-files');
const outputPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(inputFolder)) {
    console.log("Error: 'markdown-files' folder not found!");
    process.exit(1);
}

function parseMarkdownToMCQ(markdown) {
    const lines = markdown.split('\n');
    let questions = [];
    let currentQuestion = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('###') || /^(Q\d+|\d+\.)/.test(line)) {
            if (currentQuestion) questions.push(currentQuestion);
            currentQuestion = {
                question: line.replace(/^###\s*|^(Q\d+|\d+\.)\s*/, ''),
                options: [],
                answer: ''
            };
        } else if (/^[A-Da-d][\)\.]/.test(line)) {
            if (currentQuestion) currentQuestion.options.push(line);
        } else if (/^Answer\s*:/i.test(line)) {
            if (currentQuestion) {
                const match = line.match(/^Answer\s*:\s*([A-Da-d])/i);
                if (match) currentQuestion.answer = match[1].toUpperCase();
            }
        }
    }
    if (currentQuestion) questions.push(currentQuestion);
    return questions;
}

// Read your exact filenames: practice-exam-1.md and practice-exam-2.md
const set1Path = path.join(inputFolder, 'practice-exam-1.md');
const set2Path = path.join(inputFolder, 'practice-exam-2.md');

const set1Questions = fs.existsSync(set1Path) ? parseMarkdownToMCQ(fs.readFileSync(set1Path, 'utf8')) : [];
const set2Questions = fs.existsSync(set2Path) ? parseMarkdownToMCQ(fs.readFileSync(set2Path, 'utf8')) : [];

console.log(`Loaded Practice Exam 1: ${set1Questions.length} questions`);
console.log(`Loaded Practice Exam 2: ${set2Questions.length} questions`);

// Generate the final standalone index.html file
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AWS CLF-C02 Mock Exam</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <header class="mb-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <span class="bg-orange-500/10 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/20">AWS CLF-C02</span>
                    <h1 class="text-2xl font-extrabold text-white mt-2">Mock Exam Portal</h1>
                </div>
                <div id="timer" class="text-lg font-mono bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-xl text-orange-400 font-bold shadow-inner">
                    ⏱️ 60:00
                </div>
            </div>
            <div class="flex gap-3 border-t border-slate-800 pt-4">
                <button onclick="switchSet('set1')" id="tab-set1" class="px-5 py-2.5 rounded-xl font-bold text-sm transition bg-orange-600 text-white shadow-md shadow-orange-600/20">
                    Set 1 (${set1Questions.length})
                </button>
                <button onclick="switchSet('set2')" id="tab-set2" class="px-5 py-2.5 rounded-xl font-bold text-sm transition bg-slate-800 text-slate-400 hover:text-white">
                    Set 2 (${set2Questions.length})
                </button>
            </div>
        </header>

        <div id="quiz-container" class="space-y-6"></div>

        <div class="mt-8 flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl gap-4">
            <button id="submit-btn" class="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl transition duration-200 shadow-lg shadow-orange-600/20 cursor-pointer">
                Submit Current Set & Score
            </button>
            <div id="score-display" class="hidden text-xl font-bold text-orange-400 text-center sm:text-right"></div>
        </div>
    </div>

    <script>
        const set1Questions = ${JSON.stringify(set1Questions, null, 2)};
        const set2Questions = ${JSON.stringify(set2Questions, null, 2)};
        let currentActiveSet = 'set1';

        function switchSet(setName) {
            currentActiveSet = setName;
            document.getElementById('tab-set1').className = setName === 'set1' ? 'px-5 py-2.5 rounded-xl font-bold text-sm transition bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'px-5 py-2.5 rounded-xl font-bold text-sm transition bg-slate-800 text-slate-400 hover:text-white';
            document.getElementById('tab-set2').className = setName === 'set2' ? 'px-5 py-2.5 rounded-xl font-bold text-sm transition bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'px-5 py-2.5 rounded-xl font-bold text-sm transition bg-slate-800 text-slate-400 hover:text-white';
            document.getElementById('score-display').classList.add('hidden');
            renderExam();
        }

        function renderExam() {
            const container = document.getElementById('quiz-container');
            const questions = currentActiveSet === 'set1' ? set1Questions : set2Questions;
            container.innerHTML = '';
            
            if (questions.length === 0) {
                container.innerHTML = '<div class="text-center text-slate-400 py-12 bg-slate-900 border border-slate-800 rounded-2xl">No questions found in this set file.</div>';
                return;
            }

            questions.forEach((q, idx) => {
                let optionsHtml = '';
                q.options.forEach(opt => {
                    const optLetter = opt.charAt(0).toUpperCase();
                    optionsHtml += \`
                        <label class="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition">
                            <input type="radio" name="question-\${idx}" value="\${optLetter}" class="text-orange-500 focus:ring-orange-500 h-4 w-4 bg-slate-900 border-slate-700">
                            <span class="text-sm text-slate-200 font-medium">\${opt}</span>
                        </label>
                    \`;
                });

                container.innerHTML += \`
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md question-card" data-index="\${idx}">
                        <p class="font-semibold text-white mb-4 text-base sm:text-lg">
                            <span class="text-orange-400 font-mono mr-2">Q\${idx + 1}.</span> \${q.question}
                        </p>
                        <div class="space-y-2 options-group">
                            \${optionsHtml}
                        </div>
                    </div>
                \`;
            });
        }

        renderExam();

        document.getElementById('submit-btn').addEventListener('click', () => {
            const questions = currentActiveSet === 'set1' ? set1Questions : set2Questions;
            let score = 0;
            questions.forEach((q, idx) => {
                const selected = document.querySelector(\`input[name="question-\${idx}"]:checked\`);
                const card = document.querySelectorAll('.question-card')[idx];
                if (!card) return;
                const optionsGroup = card.querySelector('.options-group');
                optionsGroup.querySelectorAll('label').forEach(lbl => {
                    lbl.classList.remove('bg-emerald-950/50', 'border-emerald-600', 'bg-rose-950/50', 'border-rose-600');
                });
                if (selected) {
                    const userAns = selected.value;
                    optionsGroup.querySelectorAll('label').forEach(lbl => {
                        const radio = lbl.querySelector('input');
                        if (radio.value === q.answer) lbl.classList.add('bg-emerald-950/50', 'border-emerald-600');
                        if (radio.value === userAns && userAns !== q.answer) lbl.classList.add('bg-rose-950/50', 'border-rose-600');
                    });
                    if (userAns === q.answer) score++;
                }
            });
            const percentage = Math.round((score / questions.length) * 100);
            const scoreDisplay = document.getElementById('score-display');
            scoreDisplay.textContent = \`Score: \${score} / \${questions.length} (\${percentage}%) — \${percentage >= 70 ? '🎉 Pass!' : '📚 Keep Practicing!'}\`;
            scoreDisplay.classList.remove('hidden');
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });

        let timeLeft = 60 * 60;
        const timerEl = document.getElementById('timer');
        setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerEl.textContent = \`⏱️ \${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
            }
        }, 1000);
    </script>
</body>
</html>`;

fs.writeFileSync(outputPath, htmlTemplate);
console.log(`Successfully compiled practice exams into index.html!`);