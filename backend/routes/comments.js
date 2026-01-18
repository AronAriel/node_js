const express = require('express');
const router = express.Router();
const {
  addComment,
  getCommentsByArticle,
  getSingleComment,
  updateComment,
  deleteComment
} = require('../modules/comment');

router.post('/:articleId', async (req, res) => {
  const { author, text } = req.body;

  if (!author?.trim()) {
    return res.status(400).json({ error: 'Author is required' });
  }
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const comment = await addComment(req.params.articleId, author.trim(), text.trim());
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to add comment' });
  }
});

router.get('/article/:articleId', async (req, res) => {
  try {
    const comments = await getCommentsByArticle(req.params.articleId);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comment = await getSingleComment(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load comment' });
  }
});

router.put('/:id', async (req, res) => {
  const { author, text } = req.body;

  if (!author?.trim()) {
    return res.status(400).json({ error: 'Author is required' });
  }
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const updated = await updateComment(req.params.id, author.trim(), text.trim());
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteComment(req.params.id);
    res.json({ id: deleted.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
