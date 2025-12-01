const db = require('../models');

async function addComment(articleId, author, text) {
  const article = await db.Article.findByPk(articleId);
  if (!article) throw new Error('Article not found');

  const comment = await db.Comment.create({
    articleId: article.id,
    author: author.trim(),
    text
  });

  return comment;
}

async function deleteComment(commentId) {
  const comment = await db.Comment.findByPk(commentId);
  if (!comment) throw new Error('Comment not found');

  await comment.destroy();
  return comment;
}

async function getCommentsByArticle(articleId) {
  return db.Comment.findAll({
    where: { articleId },
    attributes: ['id', 'author', 'text', 'createdAt'],
    order: [['createdAt', 'ASC']]
  });
}

module.exports = {
  addComment,
  deleteComment,
  getCommentsByArticle
};
