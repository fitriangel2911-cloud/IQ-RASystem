const http = require('http');
const https = require('https');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const CONCURRENT_USERS = 20;
const TEST_DURATION_MS = 10000; // 10 seconds

const endpoints = [
  { method: 'GET', path: '/api/admin/parameters' },
  { method: 'GET', path: '/api/users/me' }, // Will 401 without auth, but good for load testing network
  { method: 'POST', path: '/api/accounting/record-v2', payload: {} } // Will fail validation, but tests API overhead
];

let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;
let totalTime = 0;
let maxTime = 0;

const makeRequest = (endpoint) => {
  return new Promise((resolve) => {
    const isHttps = TARGET_URL.startsWith('https');
    const client = isHttps ? https : http;
    const url = new URL(endpoint.path, TARGET_URL);
    
    const start = Date.now();
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const time = Date.now() - start;
        totalTime += time;
        if (time > maxTime) maxTime = time;
        
        totalRequests++;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successRequests++;
        } else {
          failedRequests++;
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      failedRequests++;
      totalRequests++;
      resolve();
    });

    if (endpoint.payload) {
      req.write(JSON.stringify(endpoint.payload));
    }
    
    req.end();
  });
};

const runWorker = async (endTime) => {
  while (Date.now() < endTime) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    await makeRequest(endpoint);
  }
};

console.log(`🚀 Starting Load Test on ${TARGET_URL}`);
console.log(`👥 Concurrent Users: ${CONCURRENT_USERS}`);
console.log(`⏱️ Duration: ${TEST_DURATION_MS / 1000}s`);
console.log('---');

const endTime = Date.now() + TEST_DURATION_MS;
const workers = [];

for (let i = 0; i < CONCURRENT_USERS; i++) {
  workers.push(runWorker(endTime));
}

Promise.all(workers).then(() => {
  console.log('\n✅ Load Test Completed!');
  console.log('--- Results ---');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful:     ${successRequests}`);
  console.log(`Failed/Errors:  ${failedRequests}`);
  console.log(`Avg Latency:    ${Math.round(totalTime / totalRequests)} ms`);
  console.log(`Max Latency:    ${maxTime} ms`);
  console.log(`Req/Sec:        ${Math.round(totalRequests / (TEST_DURATION_MS / 1000))}`);
});
