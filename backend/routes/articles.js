const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '../../data');

function getFilePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(DATA_DIR);
    const articles = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
        return { id: data.id, title: data.title, createdAt: data.createdAt || null };
      });
    res.json(articles);
  } catch (err) {
    sendError(res, 500, 'Failed to read articles');
  }
});

router.get('/:id', (req, res) => {
  const filePath = getFilePath(req.params.id);
  if (!fs.existsSync(filePath)) return sendError(res, 404, 'Article not found');

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch {
    sendError(res, 500, 'Failed to load article');
  }
});

router.post('/', (req, res) => {
  const { title, content } = req.body;

  if (!title?.trim()) return sendError(res, 400, 'Title is required');
  if (!content?.trim()) return sendError(res, 400, 'Content cannot be empty');

  try {
    const id = Date.now().toString();
    const article = { id, title: title.trim(), content, createdAt: new Date().toISOString() };

    fs.writeFileSync(getFilePath(id), JSON.stringify(article, null, 2));
    res.status(201).json(article);
  } catch {
    sendError(res, 500, 'Failed to create article');
  }
});

router.put('/:id', (req, res) => {
  const filePath = getFilePath(req.params.id);
  if (!fs.existsSync(filePath)) return sendError(res, 404, 'Cannot edit non-existing article');

  const { title, content } = req.body;
  if (!title?.trim()) return sendError(res, 400, 'Title is required');
  if (!content?.trim()) return sendError(res, 400, 'Content cannot be empty');

  try {
    const oldArticle = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const updated = { ...oldArticle, title: title.trim(), content };
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    res.json(updated);
  } catch {
    sendError(res, 500, 'Failed to update article');
  }
});

router.delete('/:id', (req, res) => {
  const filePath = getFilePath(req.params.id);
  if (!fs.existsSync(filePath)) return sendError(res, 404, 'Cannot delete non-existing article');

  try {
    fs.unlinkSync(filePath);
    res.json({ message: 'Article deleted successfully' });
  } catch {
    sendError(res, 500, 'Failed to delete article');
  }
});

module.exports = router;
