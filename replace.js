const fs = require('fs');

const path = 'd:/IQ-RASystem/src/components/dashboard/DPSDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add whiteSpace: 'nowrap' to the audit status badges
content = content.replace(
  /fontWeight: 900, border: '1px solid currentColor' }}/g,
  "fontWeight: 900, border: '1px solid currentColor', whiteSpace: 'nowrap' }}"
);

// 2. Reduce gap: '30px' to '16px' for grids and flex containers
content = content.replace(/gap: '30px'/g, "gap: '16px'");
// Reduce gap: '40px' to '24px' (just in case)
content = content.replace(/gap: '40px'/g, "gap: '24px'");
// Reduce padding: '36px' to '24px'
content = content.replace(/padding: '36px'/g, "padding: '24px'");
// Reduce gap: '24px' or '25px' to '16px'
content = content.replace(/gap: '24px'/g, "gap: '16px'");
content = content.replace(/gap: '25px'/g, "gap: '16px'");

// Reduce some padding: '40px' to '24px' except for specific places
content = content.replace(/padding: '40px'/g, "padding: '24px'");

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated file.');
