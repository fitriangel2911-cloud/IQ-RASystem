const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Remove emojis from icon prop
c = c.replace(/icon="[^"]+"/g, 'icon=""');

// Remove emojis generally used in the file
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F916}\u{1F4CB}\u{1F4D2}\u{2705}\u{1FA7A}\u{1F4E6}\u{1F465}\u{1F6E1}\u{1F6E0}\u{1F3E6}]/gu;
c = c.replace(emojiRegex, '');

// The user also mentioned fixing the "pewarnaan yang memicu tidak ada wibawanya"
// Let's ensure the styling of the active button is very professional and dark/gold instead of bright colors.
// I will check the DashboardMenuButton definition and strip out playful animations and bright colors.
c = c.replace(/transform: isHovered \? 'scale\(1.1\)' : 'scale\(1\)',/g, "transform: isHovered ? 'scale(1.02)' : 'scale(1)',");
c = c.replace(/transform: !active && isHovered \? 'translateX\(4px\)' : 'translateX\(0\)',/g, "transform: 'none',");

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Emojis purged and UI tightened.');
