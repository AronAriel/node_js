
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${cleanName}`);
  }
});

const upload = multer({ storage });

function saveAttachmentPathToArticle(article, file) {
  if (!file) return article;
  article.attachment = `/uploads/${file.filename}`;
  return article;
}

function deleteAttachmentIfExists(filePath) {
  try {
    if (filePath) {
      const absolutePath = path.join(__dirname, "../../", filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
  } catch (e) {
    console.error("Error deleting attachment:", e);
  }
}

module.exports = {
  upload,
  saveAttachmentPathToArticle,
  deleteAttachmentIfExists
};
