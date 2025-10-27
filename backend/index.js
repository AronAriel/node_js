const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const articlesRouter = require('./routes/articles');
app.use('/articles', articlesRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
