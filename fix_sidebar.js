const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Fix Sidebar Container (Edge to Edge, Compact, Scrollable)
content = content.replace(
  "width: isSidebarOpen ? '320px' : '0px',\n          opacity: isSidebarOpen ? 1 : 0,\n          background: 'var(--bg-sidebar)',\n          backdropFilter: 'blur(25px)',\n          borderRight: isSidebarOpen ? '4px solid var(--gold-intense)' : 'none',\n          display: 'flex',\n          flexDirection: 'column',\n          padding: isSidebarOpen ? '40px 24px' : '0px',\n          position: 'fixed',\n          top: 0,\n          left: 0,\n          height: '100vh',\n          zIndex: 100,\n          boxShadow: isSidebarOpen ? '10px 0 30px var(--shadow-color)' : 'none',\n          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',\n          overflow: 'hidden'",
  "width: isSidebarOpen ? '280px' : '0px',\n          opacity: isSidebarOpen ? 1 : 0,\n          background: 'var(--bg-sidebar)',\n          backdropFilter: 'blur(25px)',\n          borderRight: isSidebarOpen ? '4px solid var(--gold-intense)' : 'none',\n          display: 'flex',\n          flexDirection: 'column',\n          padding: isSidebarOpen ? '24px 16px' : '0px',\n          position: 'fixed',\n          top: 0,\n          left: 0,\n          height: '100vh',\n          zIndex: 100,\n          boxShadow: isSidebarOpen ? '10px 0 30px var(--shadow-color)' : 'none',\n          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',\n          overflowY: 'auto',\n          overflowX: 'hidden'"
);

// Fix DashboardMenuButton (Compact)
content = content.replace(
  "padding: isSpecial ? '18px 20px' : '15px 18px',\n        borderRadius: '14px',\n        color: active ? 'var(--bg-page)' : 'var(--text-primary)',\n        fontWeight: isSpecial ? 900 : 800,\n        fontSize: isSpecial ? '18px' : '16px',\n        cursor: 'pointer',\n        display: 'flex',\n        alignItems: 'center',\n        gap: '12px',\n        transform: !active && isHovered ? 'translateX(6px)' : 'translateX(0)',\n        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',\n        boxShadow: active ? '0 8px 20px var(--shadow-color)' : 'none',\n        width: '100%'",
  "padding: isSpecial ? '14px 16px' : '12px 14px',\n        borderRadius: '10px',\n        color: active ? 'var(--bg-page)' : 'var(--text-primary)',\n        fontWeight: isSpecial ? 900 : 800,\n        fontSize: isSpecial ? '16px' : '14px',\n        cursor: 'pointer',\n        display: 'flex',\n        alignItems: 'center',\n        gap: '10px',\n        transform: !active && isHovered ? 'translateX(4px)' : 'translateX(0)',\n        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',\n        boxShadow: active ? '0 4px 12px var(--shadow-color)' : 'none',\n        width: '100%'"
);

content = content.replace(
  "fontSize: isSpecial ? '24px' : '22px',\n        opacity: active ? 1 : 0.8,\n        transform: isHovered ? 'scale(1.15)' : 'scale(1)',",
  "fontSize: isSpecial ? '20px' : '18px',\n        opacity: active ? 1 : 0.8,\n        transform: isHovered ? 'scale(1.1)' : 'scale(1)',"
);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Sidebar UI fixed.');
