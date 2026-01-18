const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { upload } = require('../modules/attachments');
const { notifyArticleCreated, notifyArticleUpdated, notifyArticleDeleted } = require('../modules/notifications');
const db = require('../models');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

router.get('/', async (req, res) => {
  const { workspaceId } = req.query;
  const where = workspaceId && workspaceId !== 'all'
    ? { workspaceId }
    : {};

  try {
    const articles = await db.Article.findAll({
      where,
      attributes: ['id', 'title', 'createdAt', 'workspaceId'],
      order: [['createdAt', 'DESC']],
    });
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const article = await db.Article.findByPk(req.params.id, {
      include: [
        { model: db.Comment, attributes: ['id', 'author', 'text', 'createdAt'] },
        { model: db.Workspace, attributes: ['id', 'name'] }
      ]
    });

    if (!article) return res.status(404).json({ error: 'Article not found' });
    if (!article.attachments) article.attachments = [];

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await db.ArticleVersion.findAll({
      where: { articleId: req.params.id },
      attributes: ['id', 'versionNumber', 'title', 'createdAt'],
      order: [['versionNumber', 'DESC']]
    });
    res.json(versions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});


router.get('/:id/versions/:versionId', async (req, res) => {
  try {
    const version = await db.ArticleVersion.findByPk(req.params.versionId);
    if (!version || String(version.articleId) !== String(req.params.id)) return res.status(404).json({ error: 'Version not found' });
    res.json(version);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch version' });
  }
});

router.post('/', upload.array('attachments'), async (req, res) => {
  const { title, content, workspaceId } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!content?.trim()) return res.status(400).json({ error: 'Content cannot be empty' });
  if (!workspaceId) return res.status(400).json({ error: 'WorkspaceId is required' });

  try {
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      path: `/uploads/${f.filename}`
    }));

    const article = await db.Article.create({
      title: title.trim(),
      content,
      attachments,
      workspaceId
    });

    notifyArticleCreated(article);
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.put('/:id', upload.array('attachments'), async (req, res) => {
  const { title, content, removedFiles } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!content?.trim()) return res.status(400).json({ error: 'Content cannot be empty' });

  try {
    const article = await db.Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });


    try {
      const maxVersion = await db.ArticleVersion.max('versionNumber', { where: { articleId: article.id } });
      const nextVersion = (maxVersion || 0) + 1;
      await db.ArticleVersion.create({
        articleId: article.id,
        versionNumber: nextVersion,
        title: article.title,
        content: article.content,
        attachments: article.attachments || []
      });
    } catch (verErr) {
      console.error('Failed to create article version:', verErr);
    }

    article.title = title.trim();
    article.content = content;

    if (removedFiles) {
      const filesToRemove = JSON.parse(removedFiles);

      for (const filename of filesToRemove) {
        const filePath = path.join(UPLOAD_DIR, filename);
        try {
          await fs.unlink(filePath);
        } catch (e) {}
      }

      article.attachments = article.attachments.filter(f => !filesToRemove.includes(f.filename));
    }

    if (req.files?.length > 0) {
      const newAttachments = req.files.map(f => ({
        filename: f.filename,
        path: `/uploads/${f.filename}`
      }));

      article.attachments = [...article.attachments, ...newAttachments];
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
      try {
        await fs.unlink(filePath);
      } catch (e) {}
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
