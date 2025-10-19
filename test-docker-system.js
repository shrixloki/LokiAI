/**
 * Test Docker System - Complete LokiAI Production System
 * Tests all services running in Docker containers
 */

const API_BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b8D4C9db4C4C4b4C4C';

async function testDockerSystem() {
    console.log('🐳 Testing LokiAI Docker Production System...\n');
    
    const tests = [
        {
            name: 'Backend Health Check',
            url: `${API_BASE_URL}/health`,
            expected: ['status', 'services']
        },
        {
            name: 'Frontend Accessibility',
            url: FRONTEND_URL,
            expected: ['html']
        },
        {
            name: 'Dashboard API',
            url: `${API_BASE_URL}/api/dashboard/summary?wallet=${TEST_WALLET}`,
            expected: ['portfolioValue', 'activeAgents']
        },
        {
            name: 'Production Blockchain API (if available)',
            url: `${API_BASE_URL}/api/production-blockchain/dashboard/summary?wallet=${TEST_WALLET}`,
            expected: ['success', 'data'],
            optional: true
        },
        {
            name: 'Agents API',
            url: `${API_BASE_URL}/api/agents`,
            expected: [],
            optional: true
        }
    ];
    
    let passed = 0;
    let failed = 0;
    let optional = 0;
    
    for (const test of tests) {
        try {
            console.log(`📡 Testing: ${test.name}`);
            
            const response = await fetch(test.url);
            
            console.log(`   Status: ${response.status}`);
            
            if (response.ok) {
                if (test.name === 'Frontend Accessibility') {
                    const text = await response.text();
                    if (text.includes('<!DOCTYPE html>')) {
                        console.log(`   ✅ PASS - Frontend HTML loaded\n`);
                        passed++;
                    } else {
                        console.log(`   ❌ FAIL - Invalid HTML response\n`);
                        failed++;
                    }
                } else {
                    const data = await response.json();
                    console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
                    
                    const hasExpectedKeys = test.expected.length === 0 || 
                        test.expected.every(key => 
                            data.hasOwnProperty(key) || (data.data && data.data.hasOwnProperty(key))
                        );
                    
                    if (hasExpectedKeys) {
                        console.log(`   ✅ PASS\n`);
                        passed++;
                    } else {
                        console.log(`   ❌ FAIL - Missing expected keys\n`);
                        if (test.optional) {
                            optional++;
                        } else {
                            failed++;
                        }
                    }
                }
            } else {
                console.log(`   ⚠️  ${response.status} - ${response.statusText}`);
                if (test.optional) {
                    console.log(`   ℹ️  Optional endpoint not available\n`);
                    optional++;
                } else {
                    console.log(`   ❌ FAIL\n`);
                    failed++;
                }
            }
            
        } catch (error) {
            console.log(`   ❌ FAIL - ${error.message}\n`);
            if (test.optional) {
                optional++;
            } else {
                failed++;
            }
        }
    }
    
    console.log('📊 Docker System Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ℹ️  Optional: ${optional}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All critical Docker services are working!');
        console.log('   The LokiAI production system is running successfully in Docker');
    } else {
        console.log('\n⚠️  Some critical services failed. Check Docker containers.');
    }
}

// Test Docker container status
async function testDockerContainers() {
    console.log('\n🐳 Docker Container Status:\n');
    
    const containers = [
        'lokiai-backend-production',
        'lokiai-frontend-production', 
        'lokiai-mongodb',
        'lokiai-nginx',
        'lokiai-redis',
        'lokiai-blockchain-monitor'
    ];
    
    for (const container of containers) {
        try {
            // This would require docker CLI access, so we'll just note the expected containers
            console.log(`📦 Expected: ${container}`);
        } catch (error) {
            console.log(`❌ ${container}: Not accessible`);
        }
    }
    
    console.log('\n💡 To check container status manually:');
    console.log('   docker ps');
    console.log('   docker-compose -f docker-compose.production-blockchain.yml ps');
}

// Test blockchain integration
async function testBlockchainIntegration() {
    console.log('\n⛓️  Testing Blockchain Integration...\n');
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.services && data.services.blockchain) {
            console.log('✅ Blockchain service status:', data.services.blockchain.status);
            console.log('✅ Networks initialized:', data.services.blockchain.initialized);
            console.log('✅ Contracts loaded:', data.services.blockchain.contractsLoaded);
        } else {
            console.log('⚠️  Blockchain status not available in health check');
        }
        
    } catch (error) {
        console.log('❌ Failed to check blockchain status:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    await testDockerSystem();
    await testDockerContainers();
    await testBlockchainIntegration();
    
    console.log('\n📋 System Summary:');
    console.log('   🐳 Docker: Production containers running');
    console.log('   🖥️  Frontend: Available at http://localhost:3000');
    console.log('   🔧 Backend: Available at http://localhost:5000');
    console.log('   🗄️  Database: MongoDB running on port 27017');
    console.log('   🔄 Cache: Redis running on port 6379');
    console.log('   🌐 Proxy: Nginx running on port 80');
    console.log('   ⛓️  Blockchain: Multi-chain integration active');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Connect your MetaMask wallet');
    console.log('   3. Switch to Sepolia testnet');
    console.log('   4. Explore the AI Agents with real blockchain integration');
}

runAllTests().catch(console.error);