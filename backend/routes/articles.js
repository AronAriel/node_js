const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

const { upload, saveAttachmentPathToArticle, deleteAttachmentIfExists } = require('../modules/attachments');
const { notifyArticleCreated, notifyArticleUpdated, notifyArticleDeleted } = require('../modules/notifications');
const db = require('../models');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

router.get('/', async (req, res) => {
  try {
    const articles = await db.Article.findAll({
      attributes: ['id', 'title', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const article = await db.Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

router.post('/', upload.single('attachment'), async (req, res) => {
  const { title, content } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!content?.trim()) return res.status(400).json({ error: 'Content cannot be empty' });

  try {
    const attachments = req.file ? [{ filename: req.file.filename, path: `/uploads/${req.file.filename}` }] : [];

    const article = await db.Article.create({
      title: title.trim(),
      content,
      attachments
    });

    notifyArticleCreated(article);
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.put('/:id', upload.single('attachment'), async (req, res) => {
  const { title, content, removedFiles } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!content?.trim()) return res.status(400).json({ error: 'Content cannot be empty' });

  try {
    const article = await db.Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    article.title = title.trim();
    article.content = content;

    if (removedFiles) {
      const filesToRemove = JSON.parse(removedFiles);
      for (const filename of filesToRemove) {
        const filePath = path.join(UPLOAD_DIR, filename);
        try { await fs.unlink(filePath); } catch (e) {}
      }
      article.attachments = article.attachments.filter(f => !filesToRemove.includes(f.filename));
    }

    if (req.file) {
      const newAttachment = { filename: req.file.filename, path: `/uploads/${req.file.filename}` };
      article.attachments = [...article.attachments, newAttachment];
    }

    await article.save();
    notifyArticleUpdated(article);

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const article = await db.Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    for (const file of article.attachments || []) {
      const filePath = path.join(UPLOAD_DIR, file.filename);
      try { await fs.unlink(filePath); } catch (e) {}
    }

    await article.destroy();
    notifyArticleDeleted(article.id);

    res.json({ id: article.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

module.exports = router;
