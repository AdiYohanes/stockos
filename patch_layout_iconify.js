const fs = require('fs');
const file = 'src/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('iconify-icon.min.js')) {
    content = content.replace(
        '</head>',
        '  <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" async></script>\n  </head>'
    );
    fs.writeFileSync(file, content);
}
