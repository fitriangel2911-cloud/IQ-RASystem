const fs = require('fs');
const path = 'd:/IQ-RASystem/src/components/dashboard/DPSDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Move CONTRACT_TYPE_LABELS out of component
const labelsCode = `const CONTRACT_TYPE_LABELS: Record<string, string> = {
  murabahah: 'Murabahah (Jual Beli)',
  mudharabah: 'Mudharabah (Bagi Hasil)',
  musyarakah: 'Musyarakah (Kemitraan)',
  ijarah: 'Ijarah (Sewa)',
  istishna: "Istishna' (Pemesanan)",
  qardhul_hasan: 'Qardhul Hasan (Sosial)'
};`;

content = content.replace(/const CONTRACT_TYPE_LABELS[^}]+\};\s*/g, '');
// Add it after the imports
content = content.replace(/(import .*;\n)+/, match => match + '\n' + labelsCode + '\n\n');

// 2. Add akadDistribution state
content = content.replace(/const \[auditedPlafond, setAuditedPlafond\] = useState\(1480000000\);/g, 
  `const [auditedPlafond, setAuditedPlafond] = useState(0);
  const [akadDistribution, setAkadDistribution] = useState<any[]>([]);`);

// Change default states
content = content.replace(/const \[shariaHealthScore, setShariaHealthScore\] = useState\(98\.6\);/g, 'const [shariaHealthScore, setShariaHealthScore] = useState(100);');
content = content.replace(/const \[nonHalalBalance, setNonHalalBalance\] = useState\(34250000\);/g, 'const [nonHalalBalance, setNonHalalBalance] = useState(0);');
content = content.replace(/const \[socialFundsBalance, setSocialFundsBalance\] = useState\(120450000\);/g, 'const [socialFundsBalance, setSocialFundsBalance] = useState(0);');

// 3. Fix fetchContracts math
content = content.replace(/setShariaHealthScore\(98\.6\); \/\/ Fallback standard/g, 'setShariaHealthScore(100);');
content = content.replace(/setAuditedPlafond\(totalAuditedPlafond \|\| 1480000000\); \/\/ Fallback mock/g, 'setAuditedPlafond(totalAuditedPlafond || 0);');

// Ziswaf / Non-Halal
content = content.replace(/setNonHalalBalance\(Math\.max\(0, 34250000 \+ \(calculatedNonHalalInflow - calculatedNonHalalOutflow\)\)\);/g, 'setNonHalalBalance(Math.max(0, calculatedNonHalalInflow - calculatedNonHalalOutflow));');
content = content.replace(/setSocialFundsBalance\(Math\.max\(0, 120450000 \+ \(calculatedSocialInflow - calculatedSocialOutflow\)\)\);/g, 'setSocialFundsBalance(Math.max(0, calculatedSocialInflow - calculatedSocialOutflow));');

// 4. Calculate Distribution inside fetchContracts
// Let's inject the distribution logic right after setAuditedPlafond
const distLogic = `
        // Dynamic Akad Distribution Calculation
        const distMap: Record<string, number> = {};
        let totalPlafondDist = 0;
        data.forEach((c: any) => {
          const type = c.contract_type || 'other';
          const amt = Number(c.amount || 0);
          if (!distMap[type]) distMap[type] = 0;
          distMap[type] += amt;
          totalPlafondDist += amt;
        });

        const distArray = Object.keys(distMap).map((type, idx) => {
          const colors = ['--text-gold', '--text-success', '--text-info', '--text-warning', '--text-danger', '--text-primary'];
          const name = CONTRACT_TYPE_LABELS[type] || type;
          const val = distMap[type];
          const pct = totalPlafondDist > 0 ? Math.round((val / totalPlafondDist) * 100) : 0;
          return { name, pct, val, color: colors[idx % colors.length] };
        }).sort((a, b) => b.val - a.val);

        setAkadDistribution(distArray);
`;

content = content.replace(/setAuditedPlafond\(totalAuditedPlafond \|\| 0\);/g, 'setAuditedPlafond(totalAuditedPlafond || 0);\n' + distLogic);

// 5. Fix JSX Chart
const hardcodedChart = `                {[
                  { name: 'Murabahah (Jual Beli)', pct: 62, val: 917600000, color: '--text-gold' },
                  { name: 'Mudharabah (Bagi Hasil)', pct: 20, val: 296000000, color: '--text-success' },
                  { name: 'Musyarakah (Kemitraan)', pct: 12, val: 177600000, color: '--text-info' },
                  { name: 'Ijarah Multijasa (Sewa Jasa)', pct: 6, val: 88800000, color: '--text-warning' }
                ].map(item => (`;

const dynamicChart = `                {akadDistribution.length === 0 && <div style={{color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0'}}>Belum ada data distribusi akad.</div>}
                {akadDistribution.map(item => (`;

content = content.replace(hardcodedChart, dynamicChart);

fs.writeFileSync(path, content, 'utf8');
console.log('Script ran successfully');
