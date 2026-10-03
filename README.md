# AWS CLF-C02 Mock Exam

This project keeps the exam source in markdown files and generates a JSON dataset that the browser loads at runtime.

## Run locally

1. Generate the data file from the markdown files:
   `node convert.js`
2. Serve the project:
   `python -m http.server 8000`
3. Open `http://localhost:8000/` in your browser.

The source questions live in the `markdown-files` folder, and the generated dataset is written to `data/questions.json`.
