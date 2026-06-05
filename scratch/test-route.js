async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/audit-logs');
    console.log('STATUS:', res.status);
    const json = await res.json();
    console.log('JSON:', json);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();
