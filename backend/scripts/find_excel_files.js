const fs = require('fs');
const path = require('path');

function findExcelFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        results.push(...findExcelFiles(fullPath));
      }
    } else {
      if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = findExcelFiles('d:\\Private Project\\Helpdesk MRA');
console.log('=== EXCEL FILES FOUND ===');
files.forEach(f => console.log(f));
