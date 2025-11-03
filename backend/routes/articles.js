const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '../../data');

const getFilePath = (id) => path.join(DATA_DIR, `${id}.json`);

router.get('/', (req, res) => {
  const files = fs.readdirSync(DATA_DIR);
  const articles = files
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      return {
        id: data.id,
        title: data.title,
        createdAt: data.createdAt
      };
    });
  res.json(articles);
});

router.get('/:id', (req, res) => {
  const filePath = getFilePath(req.params.id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  res.json(JSON.parse(content));
});

router.post('/', (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const id = Date.now();
  const article = {
    id,
    title,
    content,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(getFilePath(id), JSON.stringify(article, null, 2));
  res.status(201).json(article);
});

router.put('/:id', (req, res) => {
  const { title, content } = req.body;
  const filePath = getFilePath(req.params.id);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const updated = {
    ...existing,
    title,
    content,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const filePath = getFilePath(req.params.id);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }

  fs.unlinkSync(filePath);
  res.json({ message: 'Article deleted successfully' });
});

module.exports = router;
