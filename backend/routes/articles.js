const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");


const {
  upload,
  saveAttachmentPathToArticle,
  deleteAttachmentIfExists
} = require("../modules/attachments");

const {
  notifyArticleCreated,
  notifyArticleUpdated,
  notifyArticleDeleted
} = require("../modules/notifications");

const dataFile = path.join(__dirname, "../data/articles.json");

function loadArticles() {
  if (!fs.existsSync(dataFile)) return [];
  const raw = fs.readFileSync(dataFile);
  return JSON.parse(raw);
}

function saveArticles(articles) {
  fs.writeFileSync(dataFile, JSON.stringify(articles, null, 2));
}

router.post("/", upload.single("attachment"), (req, res) => {
  const articles = loadArticles();

  const newArticle = {
    id: Date.now().toString(),
    title: req.body.title,
    content: req.body.content,
    attachment: null
  };

  saveAttachmentPathToArticle(newArticle, req.file);
  articles.push(newArticle);
  saveArticles(articles);

  notifyArticleCreated(newArticle);

  res.status(201).json(newArticle);
});

router.put("/:id", upload.single("attachment"), (req, res) => {
  const articles = loadArticles();
  const index = articles.findIndex(a => a.id === req.params.id);

  if (index === -1) return res.status(404).json({ error: "Not found" });

  const oldAttachment = articles[index].attachment;

  articles[index].title = req.body.title;
  articles[index].content = req.body.content;

  if (req.file) {
    deleteAttachmentIfExists(oldAttachment);
    saveAttachmentPathToArticle(articles[index], req.file);
  }

  saveArticles(articles);

  notifyArticleUpdated(articles[index]);

  res.json(articles[index]);
});

router.delete("/:id", (req, res) => {
  const articles = loadArticles();
  const index = articles.findIndex(a => a.id === req.params.id);

  if (index === -1) return res.status(404).json({ error: "Not found" });

  deleteAttachmentIfExists(articles[index].attachment);

  const deletedId = articles[index].id;

  articles.splice(index, 1);
  saveArticles(articles);

  notifyArticleDeleted(deletedId);

  res.json({ id: deletedId });
});

module.exports = router;
