const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '../../data');

router.get('/', (req, res) => {
    const files = fs.readdirSync(DATA_DIR);
    const articles = files.map(file => {
        const content = fs.readFileSync(path.join(DATA_DIR, file));
        return JSON.parse(content);
    });
    res.json(articles);
});

router.get('/:id', (req, res) => {
    const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Article not found' });
    
    const content = fs.readFileSync(filePath);
    res.json(JSON.parse(content));
});

router.post('/', (req, res) => {
    const { title, content } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const id = Date.now(); 
    const article = { id, title, content };

    fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(article, null, 2));
    res.status(201).json(article);
});

module.exports = router;
