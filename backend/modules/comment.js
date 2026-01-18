const db = require('../models');

async function addComment(articleId, author, text) {
  const article = await db.Article.findByPk(articleId);
  if (!article) throw new Error('Article not found');

  const comment = await db.Comment.create({
    articleId: article.id,
    author: author.trim(),
    text: text.trim()
  });

  return comment;
}

async function getCommentsByArticle(articleId) {
  return db.Comment.findAll({
    where: { articleId },
    attributes: ['id', 'author', 'text', 'createdAt'],
    order: [['createdAt', 'ASC']]
  });
}

async function getSingleComment(commentId) {
  return db.Comment.findByPk(commentId, {
    attributes: ['id', 'author', 'text', 'createdAt', 'articleId']
  });
}

async function updateComment(commentId, author, text) {
  const comment = await db.Comment.findByPk(commentId);
  if (!comment) throw new Error('Comment not found');

  comment.author = author.trim();
  comment.text = text.trim();
  await comment.save();

  return comment;
}

async function deleteComment(commentId) {
  const comment = await db.Comment.findByPk(commentId);
  if (!comment) throw new Error('Comment not found');

  await comment.destroy();
  return comment;
}

module.exports = {
  addComment,
  deleteComment,
  getCommentsByArticle,
  getSingleComment,
  updateComment
};
