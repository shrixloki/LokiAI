/**
 * Test Complete Blockchain Integration
 * 
 * This script tests the complete blockchain integration to ensure:
 * 1. Backend API is responding
 * 2. Blockchain agents endpoints work
 * 3. Frontend can access APIs through proxy
 * 4. Smart contract addresses are configured
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:5000';

// Test wallet address
const TEST_WALLET = '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';

async function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = res.headers['content-type']?.includes('application/json') 
                        ? JSON.parse(data) 
                        : data;
                    resolve({ status: res.statusCode, data: parsed });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Request timeout')));
    });
}

async function testBlockchainIntegration() {
    console.log('🚀 Testing Complete Blockchain Integration...\n');

    const tests = [
        {
            name: 'Backend Health Check',
            url: `${API_BASE_URL}/health`,
            expected: (result) => result.status === 200 && result.data.status === 'healthy'
        },
        {
            name: 'Frontend Accessibility',
            url: `${BASE_URL}`,
            expected: (result) => result.status === 200
        },
        {
            name: 'Blockchain Agents API (Direct)',
            url: `${API_BASE_URL}/api/production-blockchain/agents/status?wallet=${TEST_WALLET}`,
            expected: (result) => result.status === 200 && result.data.success === true
        },
        {
            name: 'Blockchain Agents API (Through Proxy)',
            url: `${BASE_URL}/api/production-blockchain/agents/status?wallet=${TEST_WALLET}`,
            expected: (result) => result.status === 200 && result.data.success === true
        },
        {
            name: 'Smart Contract Stats',
            url: `${BASE_URL}/api/production-blockchain/contracts/stats`,
            expected: (result) => result.status === 200
        },
        {
            name: 'System Status',
            url: `${BASE_URL}/api/production-blockchain/system/status`,
            expected: (result) => result.status === 200
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}...`);
            const result = await makeRequest(test.url);
            
            if (test.expected(result)) {
                console.log(`✅ ${test.name} - PASSED`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - FAILED`);
                console.log(`   Status: ${result.status}`);
                console.log(`   Response: ${JSON.stringify(result.data).substring(0, 200)}...`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name} - ERROR: ${error.message}`);
            failed++;
        }
        console.log('');
    }

    // Test specific blockchain features
    console.log('🔗 Testing Blockchain-Specific Features...\n');

    try {
        const agentsResponse = await makeRequest(`${BASE_URL}/api/production-blockchain/agents/status?wallet=${TEST_WALLET}`);
        
        if (agentsResponse.status === 200 && agentsResponse.data.success) {
            const agents = agentsResponse.data.agents;
            console.log(`✅ Found ${agents.length} blockchain agents:`);
            
            agents.forEach(agent => {
                console.log(`   - ${agent.name} (${agent.type})`);
                console.log(`     Contract: ${agent.contractAddress || 'Not specified'}`);
                console.log(`     Status: ${agent.isActive ? 'Active' : 'Inactive'}`);
                console.log(`     Performance: $${agent.performance?.totalProfit || 0} profit`);
            });
            
            console.log('');
            
            // Check if smart contract addresses are configured
            const hasContracts = agentsResponse.data.contracts && 
                                agentsResponse.data.contracts.addresses;
            
            if (hasContracts) {
                console.log('✅ Smart Contract Addresses Configured:');
                const contracts = agentsResponse.data.contracts.addresses;
                Object.entries(contracts).forEach(([name, address]) => {
                    console.log(`   - ${name}: ${address}`);
                });
            } else {
                console.log('⚠️  Smart contract addresses not found in response');
            }
            
            passed++;
        } else {
            console.log('❌ Failed to fetch blockchain agents');
            failed++;
        }
    } catch (error) {
        console.log(`❌ Blockchain features test failed: ${error.message}`);
        failed++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Blockchain integration is working correctly.');
        console.log('\n📋 Next Steps:');
        console.log('1. Open http://localhost:3000 in your browser');
        console.log('2. Navigate to "Blockchain Agents" in the sidebar');
        console.log('3. Connect your MetaMask wallet');
        console.log('4. Switch to Sepolia testnet');
        console.log('5. Execute blockchain agents and verify transactions on Etherscan');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the system status and try again.');
        console.log('\nTroubleshooting:');
        console.log('- Ensure Docker containers are running: docker-compose ps');
        console.log('- Check backend logs: docker-compose logs backend');
        console.log('- Verify frontend is accessible: curl http://localhost:3000');
    }

    return failed === 0;
}

// Run the tests
testBlockchainIntegration()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });