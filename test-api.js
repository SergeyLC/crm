const http = require('http');

// Simple test script to check API endpoints
const testAPI = async () => {
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/deals/archived',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log('API Response Status:', res.statusCode);
          console.log('Number of deals returned:', Array.isArray(parsedData) ? parsedData.length : 'Not an array');
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log('First deal status:', parsedData[0].status);
            console.log('First deal stage:', parsedData[0].stage);
          }
          resolve(parsedData);
        } catch (e) {
          console.log('Raw response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      reject(e);
    });

    req.end();
  });
};

// Test the API
testAPI().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
