const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '../../data');
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type — only JPG, PNG, PDF allowed'), false);
};

const upload = multer({ storage, fileFilter });

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
    const article = { 
      id, 
      title: title.trim(), 
      content, 
      createdAt: new Date().toISOString(),
      attachments: []     
    };

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

    const io = req.app.get("io");
    if (io) {
      io.emit("articleUpdated", { id: updated.id, title: updated.title });
    }
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

router.post('/:id/attachments', upload.array('files', 10), (req, res) => {
  const filePath = getFilePath(req.params.id);
  if (!fs.existsSync(filePath)) return sendError(res, 404, 'Article not found');

  try {
    const article = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const uploaded = req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      mime: file.mimetype,
      url: `/uploads/${file.filename}`
    }));

    article.attachments.push(...uploaded);
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2));

    res.json({ message: 'Files uploaded', attachments: article.attachments });

    const io = req.app.get("io");
    if (io) {
      io.emit("attachmentAdded", { id: req.params.id, attachments: uploaded });
    }
  } catch (err) {
    sendError(res, 500, 'Failed to upload attachments');
  }
  
});

module.exports = router;
