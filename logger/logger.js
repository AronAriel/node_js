const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  async ensureDirExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      console.error(`Failed to create directory: ${dirPath}`, err);
    }
  }

  async logToFile(filePath, level, message) {
    try {
      await this.ensureDirExists(path.dirname(filePath));
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
      };
      await fs.appendFile(filePath, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch (err) {
      console.error(`Failed to write log to ${filePath}`, err);
    }
  }

  info(filePath, message) {
    return this.logToFile(filePath, 'success', message);
  }

  warn(filePath, message) {
    return this.logToFile(filePath, 'warning', message);
  }

  error(filePath, message) {
    return this.logToFile(filePath, 'error', message);
  }
}

module.exports = Logger;
