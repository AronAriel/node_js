const express = require('express');
const router = express.Router();
const { addComment, deleteComment } = require('../modules/comment');

router.post('/:articleId', async (req, res) => {
  const { author, text } = req.body;
  if (!author?.trim()) return res.status(400).json({ error: 'Author is required' });
  if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' });

  try {
    const comment = await addComment(req.params.articleId, author, text);
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to add comment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const comment = await deleteComment(req.params.id);
    res.json({ id: comment.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to delete comment' });
  }
});

module.exports = router;
