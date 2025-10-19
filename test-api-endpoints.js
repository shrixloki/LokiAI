import fetch from 'node-fetch';

console.log('🧪 Testing LokiAI Production API Endpoints...\n');

async function testEndpoints() {
    const tests = [
        {
            name: 'Initialize System',
            method: 'POST',
            url: 'http://localhost:5000/api/production-blockchain/system/initialize'
        },
        {
            name: 'Start Agents',
            method: 'POST', 
            url: 'http://localhost:5000/api/production-blockchain/system/start'
        },
        {
            name: 'System Health',
            method: 'GET',
            url: 'http://localhost:5000/api/production-blockchain/system/health'
        },
        {
            name: 'System Status',
            method: 'GET',
            url: 'http://localhost:5000/api/production-blockchain/system/status'
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`🔍 ${test.name}...`);
            
            const options = {
                method: test.method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            const response = await fetch(test.url, options);
            const data = await response.json();
            
            console.log(`   Status: ${response.status}`);
            console.log(`   Success: ${data.success || 'N/A'}`);
            if (data.message) console.log(`   Message: ${data.message}`);
            if (data.error) console.log(`   Error: ${data.error}`);
            
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }
}

testEndpoints();