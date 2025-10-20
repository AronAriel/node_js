const fs = require('fs').promises;
const path = require('path');
const Logger = require('./logger/logger');

const BASE_LOG_DIR = path.join(__dirname, 'logs');
const logger = new Logger(BASE_LOG_DIR);

let currentFolder = '';

async function createNewFolder() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  currentFolder = path.join(BASE_LOG_DIR, timestamp);
  await logger.ensureDirExists(currentFolder);
  console.log(`Created new folder: ${currentFolder}`);
}

async function generateRandomLog() {
  if (!currentFolder) return;

  const logFile = path.join(currentFolder, `${Date.now()}.log`);
  const random = Math.random();

  if (random < 0.6) {
    await logger.info(logFile, 'Operation completed successfully');
  } else if (random < 0.85) {
    await logger.warn(logFile, 'Operation completed with warnings');
  } else {
    await logger.error(logFile, 'Operation failed due to an error');
  }

  console.log(`Log written: ${path.basename(logFile)}`);
}

(async () => {
  await createNewFolder();
  setInterval(createNewFolder, 60 * 1000);
  setInterval(generateRandomLog, 10 * 1000);
})();
