const http = require('http');

async function testGet() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/api/audit-logs', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('GET STATUS:', res.statusCode);
        console.log('GET BODY:', data);
        resolve();
      });
    }).on('error', (err) => {
      console.error('GET ERROR:', err.message);
      resolve();
    });
  });
}

async function testPost() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      action_type: 'TEST_ACTION',
      target_id: 'test-target',
      description: 'Testing the audit logs route'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/audit-logs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('POST STATUS:', res.statusCode);
        console.log('POST BODY:', data);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('POST ERROR:', err.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  await testPost();
  await testGet();
}
main();
