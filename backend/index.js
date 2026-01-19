const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');

const { initNotifications } = require('./modules/notifications');
const articlesRouter = require('./routes/articles');
const commentsRouter = require('./routes/comments'); 
const workspacesRouter = require('./routes/workspaces');
const authRouter = require('./routes/auth');
const { sequelize } = require('./models');
const authMiddleware = require('./middleware/auth');

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set. Create a .env file with JWT_SECRET=your_secret');
  process.exit(1);
}

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const httpServer = http.createServer(app);

initNotifications(httpServer);

app.use('/auth', authRouter);
app.use(authMiddleware);

app.use('/articles', articlesRouter);
app.use('/workspaces', workspacesRouter);
app.use('/comments', commentsRouter); 

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to database:', err);
  }
})();
