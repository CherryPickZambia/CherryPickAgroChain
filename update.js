const fs = require('fs');
const content = fs.readFileSync('server/index.js').toString('base64');
fs.writeFileSync('update-index.txt', `node -e "require('fs').writeFileSync('/var/www/lenco-backend/index.js', Buffer.from('${content}', 'base64'))"`);
