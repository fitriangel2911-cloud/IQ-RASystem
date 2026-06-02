const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

content = content.replace(/width: isSidebarOpen \? '320px' : '0px',/g, "width: isSidebarOpen ? '280px' : '0px',");
content = content.replace(/padding: isSidebarOpen \? '40px 24px' : '0px',/g, "padding: isSidebarOpen ? '24px 16px' : '0px',");
content = content.replace(/padding: isSidebarOpen \? '32px 24px' : '0',/g, "padding: isSidebarOpen ? '24px 16px' : '0px',");
content = content.replace(/padding: isSpecial \? '18px 20px' : '15px 18px',/g, "padding: isSpecial ? '12px 16px' : '10px 14px',");
content = content.replace(/fontSize: isSpecial \? '18px' : '16px',/g, "fontSize: isSpecial ? '15px' : '14px',");
content = content.replace(/fontSize: isSpecial \? '24px' : '22px',/g, "fontSize: isSpecial ? '20px' : '18px',");
content = content.replace(/gap: '12px',/g, "gap: '10px',");
content = content.replace(/overflow: 'hidden'/g, "overflowY: 'auto', overflowX: 'hidden'");

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Sidebar regex fixed.');
