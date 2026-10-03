const fs = require('fs');
const path = require('path');

const inputFolder = path.join(__dirname, 'markdown-files');
const outputFolder = path.join(__dirname, 'data');
const outputPath = path.join(outputFolder, 'questions.json');

if (!fs.existsSync(inputFolder)) {
  fs.mkdirSync(inputFolder, { recursive: true });
  console.log("Created 'markdown-files' folder. Drop your .md files inside it and run the script again!");
  process.exit(0);
}

function parseMarkdownToMCQ(markdown) {
  const blocks = markdown
    .split(/\r?\n(?=\s*(?:Q\s*)?\d+\s*[\.)]|\s*###\s+)/i)
    .map((block) => block.trim())
    .filter(Boolean);

  const questions = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    const questionMatch = lines[0].match(/^(?:Q\s*)?(\d+)\s*[\.)]\s*(.*)$/i);
    if (!questionMatch) continue;

    const question = {
      question: (questionMatch[2] || '').trim(),
      options: [],
      answer: [],
      multiple: false,
    };

    for (const line of lines.slice(1)) {
      const optionMatch = line.match(/^(?:[-*]\s*)?([A-E])\s*[\.)]\s*(.+)$/i);
      if (optionMatch) {
        question.options.push({
          label: optionMatch[1].toUpperCase(),
          text: optionMatch[2].trim(),
        });
        continue;
      }

      const answerMatch = line.match(/Correct answer:\s*([A-E](?:\s*,\s*[A-E])*)/i);
      if (answerMatch) {
        question.answer = answerMatch[1]
          .split(',')
          .map((letter) => letter.trim().replace(/\.$/, '').toUpperCase())
          .filter(Boolean);
        question.multiple = question.answer.length > 1;
        break;
      }
    }

    if (question.options.length > 0) {
      questions.push(question);
    }
  }

  return questions;
}

const mdFiles = fs.readdirSync(inputFolder)
  .filter((file) => path.extname(file).toLowerCase() === '.md')
  .sort();

if (mdFiles.length === 0) {
  console.log("No .md files found in the 'markdown-files' folder. Add some and try again!");
  process.exit(0);
}

fs.mkdirSync(outputFolder, { recursive: true });

const sets = mdFiles.map((file) => {
  const filePath = path.join(inputFolder, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const questions = parseMarkdownToMCQ(content);
  console.log(`Processed ${file}: Found ${questions.length} questions.`);
  return {
    id: file.replace(/\.md$/i, ''),
    title: file.replace(/\.md$/i, '').replace(/[-_]/g, ' '),
    questions,
  };
});

fs.writeFileSync(outputPath, JSON.stringify({ sets }, null, 2));
console.log(`\nSuccessfully compiled ${sets.reduce((total, set) => total + set.questions.length, 0)} total questions into data/questions.json!`);
