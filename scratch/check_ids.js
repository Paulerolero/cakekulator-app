const fs = require('fs');
const path = require('path');

const jsFiles = ['app.js', 'simulator.js', 'recipes.js', 'quotes.js', 'customers.js', 'ingredients.js', 'finance.js', 'market-radar.js', 'receipts.js', 'auth.js'];
const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
const idsUsed = new Set();

jsFiles.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, '../js', file), 'utf8');
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    idsUsed.add(match[1]);
  }
});

console.log('Total unique IDs referenced in core JS files:', idsUsed.size);

const htmlFiles = ['index.html', 'index-app.html', 'index-web.html', 'index-user.html'];
htmlFiles.forEach(hf => {
  const filePath = path.join(__dirname, '../', hf);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (hf === 'index-user.html') {
    const userJsFiles = ['user-app.js', 'user-auth.js', 'user-db.js', 'user-map.js', 'user-offers.js', 'user-profile.js', 'user-requests.js'];
    const userIds = new Set();
    userJsFiles.forEach(f => {
      const p = path.join(__dirname, '../js', f);
      if (fs.existsSync(p)) {
        const c = fs.readFileSync(p, 'utf8');
        let m;
        while ((m = idRegex.exec(c)) !== null) {
          userIds.add(m[1]);
        }
      }
    });
    console.log('User App unique IDs referenced:', userIds.size);
    const missingUserIds = [];
    userIds.forEach(id => {
      if (!content.includes(`id="${id}"`) && !content.includes(`id='${id}'`)) {
        missingUserIds.push(id);
      }
    });
    console.log(hf, 'Missing IDs from user JS files:', missingUserIds);
    return;
  }

  const criticalSectionIds = [
    'dashboard-view', 'quotes-view', 'customers-view', 'recipes-view', 
    'ingredients-view', 'simulator-view', 'market-radar-view', 'finance-view', 
    'settings-view', 'modals-root', 'mode-selection-modal', 'auth-header-container'
  ];
  const missing = [];
  criticalSectionIds.forEach(id => {
    if (!content.includes(`id="${id}"`) && !content.includes(`id='${id}'`)) {
      missing.push(id);
    }
  });
  console.log(hf, 'Missing critical section IDs:', missing);
});
