const fs = require('fs');
let c = fs.readFileSync('src/components/dashboard/DPSDashboard.tsx', 'utf8');

const stateStr = `export default function DPSDashboard({ activeMenu, profile }: DPSDashboardProps) {
  const [toastInfo, setToastInfo] = useState<{ message: string, type: 'success'|'error'|'warning'|'info', isVisible: boolean }>({ message: '', type: 'info', isVisible: false });
  const showToast = (message: string, type: 'success'|'error'|'warning'|'info' = 'success') => {
    setToastInfo({ message, type, isVisible: true });
  };
  const [confirmInfo, setConfirmInfo] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
`;

c = c.replace('export default function DPSDashboard({ activeMenu, profile }: DPSDashboardProps) {', stateStr);
fs.writeFileSync('src/components/dashboard/DPSDashboard.tsx', c);
