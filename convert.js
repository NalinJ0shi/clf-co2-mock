const fs = require('fs');
const path = require('path');

const inputFolder = path.join(__dirname, 'markdown-files');
const outputPath = path.join(__dirname, 'output-quiz.json');

// Ensure the input folder exists
if (!fs.existsSync(inputFolder)) {
    fs.mkdirSync(inputFolder);
    console.log("Created 'markdown-files' folder. Drop your .md files inside it and run the script again!");
    process.exit(0);
}

function parseMarkdownToMCQ(markdown) {
    const lines = markdown.split('\n');
    let questions = [];
    let currentQuestion = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Detect Question
        if (line.startsWith('###') || /^(Q\d+|\d+\.)/.test(line)) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                question: line.replace(/^###\s*|^(Q\d+|\d+\.)\s*/, ''),
                options: [],
                answer: ''
            };
        } 
        // Detect Options (A, B, C, D)
        else if (/^[A-Da-d][\)\.]/.test(line)) {
            if (currentQuestion) {
                currentQuestion.options.push(line);
            }
        } 
        // Detect Answer
        else if (/^Answer\s*:/i.test(line)) {
            if (currentQuestion) {
                const match = line.match(/^Answer\s*:\s*([A-Da-d])/i);
                if (match) {
                    currentQuestion.answer = match[1].toUpperCase();
                }
            }
        }
    }

    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    return questions;
}

// Read all files in the markdown-files directory
fs.readdir(inputFolder, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const mdFiles = files.filter(file => path.extname(file).toLowerCase() === '.md');

    if (mdFiles.length === 0) {
        console.log("No .md files found in the 'markdown-files' folder. Add some and try again!");
        return;
    }

    let allQuestions = [];

    mdFiles.forEach(file => {
        const filePath = path.join(inputFolder, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const questions = parseMarkdownToMCQ(content);
        
        console.log(`Processed ${file}: Found ${questions.length} questions.`);
        allQuestions = allQuestions.concat(questions);
    });

    // Save all combined questions to a single JSON file
    fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));
    console.log(`\nSuccessfully compiled ${allQuestions.length} total questions into output-quiz.json!`);
});