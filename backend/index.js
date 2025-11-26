const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const httpServer = require("http").createServer(app);

const { initNotifications } = require('./modules/notifications');
initNotifications(httpServer);

const articlesRouter = require('./routes/articles');
app.use('/articles', articlesRouter);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
