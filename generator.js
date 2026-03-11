const fs = require('fs');
const files = ['package.json', 'index.js', 'ecosystem.config.cjs', '.env.example'];
let script = 'const fs = require("fs");\n';
for (const f of files) {
    const b64 = fs.readFileSync('server/' + f).toString('base64');
    script += `fs.writeFileSync('/var/www/lenco-backend/${f}', Buffer.from('${b64}', 'base64'));\n`;
}
fs.writeFileSync('vps-upload.js', script);
