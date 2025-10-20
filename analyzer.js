const fs = require('fs').promises;
const path = require('path');

const BASE_LOG_DIR = path.join(__dirname, 'logs');

async function printHelp() {
  console.log(`
Usage:
  node index.js [--type <success|error|warning>] [--help]

Examples:
  node index.js
  node index.js --type error
`);
}

async function readLogs(dir) {
  let logs = [];
  try {
    const folders = await fs.readdir(dir);
    for (const folder of folders) {
      const folderPath = path.join(dir, folder);
      const stat = await fs.stat(folderPath);
      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.trim().split('\n');
          for (const line of lines) {
            try {
              logs.push(JSON.parse(line));
            } catch {
              console.warn(`Invalid JSON in ${filePath}`);
            }
          }
        } catch (err) {
          console.warn(`Cannot read file: ${filePath}`, err.message);
        }
      }
    }
  } catch {
    console.error('No logs found. Please run log-generator first.');
  }

  return logs;
}

function analyzeLogs(logs, filterType) {
  const counts = { success: 0, warning: 0, error: 0 };
  logs.forEach(log => {
    if (counts.hasOwnProperty(log.level)) counts[log.level]++;
  });

  console.log('\n=== LOG STATISTICS ===');
  console.log(`Success: ${counts.success}`);
  console.log(`Warning: ${counts.warning}`);
  console.log(`Error:   ${counts.error}`);

  if (filterType && counts.hasOwnProperty(filterType)) {
    console.log(`\n Showing only "${filterType}" logs:\n`);
    logs
      .filter(l => l.level === filterType)
      .forEach(l => console.log(`${l.timestamp} — ${l.message}`));
  }
}

(async () => {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    await printHelp();
    return;
  }

  const typeIndex = args.indexOf('--type');
  const filterType =
    typeIndex !== -1 && args[typeIndex + 1]
      ? args[typeIndex + 1].toLowerCase()
      : null;

  const logs = await readLogs(BASE_LOG_DIR);
  analyzeLogs(logs, filterType);
})();
