const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { upload } = require('../modules/attachments');
const { notifyArticleCreated, notifyArticleUpdated, notifyArticleDeleted } = require('../modules/notifications');
const db = require('../models');
const { Op } = require('sequelize');
const { requireOwnerOrAdmin } = require('../middleware/roles');
const PDFDocument = require('pdfkit');
const { htmlToText } = require('html-to-text');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

router.get('/', async (req, res) => {
  const { workspaceId, q } = req.query;
  const where = {};

  if (workspaceId && workspaceId !== 'all') {
    where.workspaceId = workspaceId;
  }

  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    where[Op.or] = [
      { title: { [Op.iLike]: like } },
      { content: { [Op.iLike]: like } }
    ];
  }

  try {
    const articles = await db.Article.findAll({
      where,
      attributes: ['id', 'title', 'createdAt', 'workspaceId', 'authorId'],
      include: [
        { model: db.User, attributes: ['id', 'email'] }
      ],
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
        { model: db.Workspace, attributes: ['id', 'name'] },
        { model: db.User, attributes: ['id', 'email', 'role'] }
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

router.get('/:id/export', async (req, res) => {
  try {
    const article = await db.Article.findByPk(req.params.id, {
      include: [
        { model: db.User, attributes: ['id', 'email'] },
        { model: db.Workspace, attributes: ['id', 'name'] }
      ]
    });

    if (!article) return res.status(404).json({ error: 'Article not found' });

    const doc = new PDFDocument({ autoFirstPage: false });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="article_${article.id}.pdf"`);

    doc.pipe(res);

    doc.addPage({ margin: 50 });
    doc.fontSize(20).text(article.title || 'Untitled', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('grey').text(`Created: ${article.createdAt ? new Date(article.createdAt).toLocaleString() : 'Unknown'}`);
    if (article.User?.email) doc.text(`Author: ${article.User.email}`);
    if (article.Workspace?.name) doc.text(`Workspace: ${article.Workspace.name}`);
    doc.moveDown(1);

    const contentText = article.content ? htmlToText(article.content, { wordwrap: 130 }) : '';

    doc.fillColor('black').fontSize(12).text(contentText, {
      align: 'left'
    });

    if (article.attachments?.length) {
      doc.addPage({ margin: 50 });
      doc.fontSize(16).text('Attachments', { underline: true });
      doc.moveDown(0.5);
      article.attachments.forEach(att => {
        doc.fontSize(12).text(att.filename || att.path);
      });
    }

    doc.end();

  } catch (err) {
    console.error('Failed to generate PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
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
      workspaceId,
      authorId: req.user?.id || null
    });

    notifyArticleCreated(article);
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.put('/:id', upload.array('attachments'), requireOwnerOrAdmin('Article'), async (req, res) => {
  const { title, content, removedFiles } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!content?.trim()) return res.status(400).json({ error: 'Content cannot be empty' });

  try {
    const article = req.resource;

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

router.delete('/:id', requireOwnerOrAdmin('Article'), async (req, res) => {
  try {
    const article = req.resource;

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
