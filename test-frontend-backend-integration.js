import fetch from 'node-fetch';

console.log('🧪 Testing Frontend-Backend Integration...\n');

async function testIntegration() {
    const testWallet = '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';
    
    const tests = [
        {
            name: 'Backend Health',
            url: 'http://localhost:5000/health'
        },
        {
            name: 'Dashboard Summary',
            url: `http://localhost:5000/api/dashboard/summary?wallet=${testWallet}`
        },
        {
            name: 'Agents Status',
            url: `http://localhost:5000/api/agents/status?wallet=${testWallet}`
        },
        {
            name: 'Production Blockchain Health',
            url: 'http://localhost:5000/api/production-blockchain/system/health'
        },
        {
            name: 'Frontend',
            url: 'http://localhost:3000'
        }
    ];
    
    console.log('🔍 Testing API endpoints...\n');
    
    for (const test of tests) {
        try {
            console.log(`📡 Testing ${test.name}...`);
            
            const response = await fetch(test.url, {
                headers: {
                    'Origin': 'http://localhost:3000'
                }
            });
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    console.log(`   ✅ JSON Response: ${data.success ? 'Success' : 'Available'}`);
                    if (data.data) {
                        console.log(`   📊 Data keys: ${Object.keys(data.data).join(', ')}`);
                    }
                } else {
                    console.log(`   ✅ HTML/Text Response received`);
                }
            } else {
                console.log(`   ❌ Failed with status ${response.status}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log('');
    }
    
    // Test CORS specifically
    console.log('🔒 Testing CORS configuration...\n');
    
    try {
        const corsTest = await fetch('http://localhost:5000/api/dashboard/summary', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log(`📡 CORS Preflight: ${corsTest.status}`);
        console.log(`   Access-Control-Allow-Origin: ${corsTest.headers.get('access-control-allow-origin')}`);
        console.log(`   Access-Control-Allow-Methods: ${corsTest.headers.get('access-control-allow-methods')}`);
        
        if (corsTest.status === 200 || corsTest.status === 204) {
            console.log('   ✅ CORS configured correctly');
        } else {
            console.log('   ❌ CORS configuration issue');
        }
        
    } catch (error) {
        console.log(`   ❌ CORS test failed: ${error.message}`);
    }
}

testIntegration().catch(console.error);