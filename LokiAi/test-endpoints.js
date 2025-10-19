import fetch from 'node-fetch';

console.log('🧪 Testing Available Endpoints...\n');

async function testEndpoints() {
    const endpoints = [
        'http://localhost:5000/health',
        'http://localhost:5000/api/agents',
        'http://localhost:5000/api/production-agents',
        'http://localhost:5000/api/production-blockchain/system/health'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Testing: ${endpoint}`);
            const response = await fetch(endpoint);
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.status === 200) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    console.log(`   ✅ JSON Response received`);
                } else {
                    const text = await response.text();
                    console.log(`   📄 Text Response: ${text.substring(0, 100)}...`);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        console.log('');
    }
}

testEndpoints();