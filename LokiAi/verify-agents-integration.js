/**
 * Verify AI Agents Integration
 * 
 * Comprehensive verification of the entire integration
 */

const WALLET_ADDRESS = process.argv[2] || '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';
const API_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;

function pass(message) {
    console.log(`✅ ${message}`);
    passed++;
}

function fail(message) {
    console.log(`❌ ${message}`);
    failed++;
}

async function verifyIntegration() {
    console.log('🔍 Verifying AI Agents Integration');
    console.log(`📍 Wallet: ${WALLET_ADDRESS}`);
    console.log('');

    // Test 1: Backend Health
    console.log('Test 1: Backend Health Check');
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            pass('Backend is running');
        } else {
            fail('Backend health check failed');
        }
    } catch (error) {
        fail(`Backend not accessible: ${error.message}`);
    }
    console.log('');

    // Test 2: Agents API Endpoint
    console.log('Test 2: Agents API Endpoint');
    try {
        const response = await fetch(`${API_URL}/api/agents/status?wallet=${WALLET_ADDRESS}`);
        if (response.ok) {
            pass('Agents API endpoint accessible');
            
            const data = await response.json();
            
            if (data.success) {
                pass('API returns success response');
            } else {
                fail('API returns error response');
            }
            
            if (Array.isArray(data.agents)) {
                pass('API returns agents array');
                
                if (data.agents.length > 0) {
                    pass(`Found ${data.agents.length} agents`);
                    
                    // Test 3: Agent Data Structure
                    console.log('');
                    console.log('Test 3: Agent Data Structure');
                    
                    const agent = data.agents[0];
                    const requiredFields = ['name', 'type', 'apy', 'pnl', 'winRate', 'trades', 'status', 'chains'];
                    
                    requiredFields.forEach(field => {
                        if (agent[field] !== undefined) {
                            pass(`Agent has ${field} field`);
                        } else {
                            fail(`Agent missing ${field} field`);
                        }
                    });
                    
                    // Test 4: Specific Agents
                    console.log('');
                    console.log('Test 4: Required Agents Present');
                    
                    const agentNames = data.agents.map(a => a.name);
                    
                    if (agentNames.includes('Cross-Chain Arbitrage Bot')) {
                        pass('Cross-Chain Arbitrage Bot found');
                    } else {
                        fail('Cross-Chain Arbitrage Bot not found');
                    }
                    
                    if (agentNames.includes('Portfolio Rebalancer')) {
                        pass('Portfolio Rebalancer found');
                    } else {
                        fail('Portfolio Rebalancer not found');
                    }
                    
                    // Test 5: Data Validation
                    console.log('');
                    console.log('Test 5: Data Validation');
                    
                    data.agents.forEach(agent => {
                        if (typeof agent.apy === 'number' && agent.apy >= 0) {
                            pass(`${agent.name}: APY is valid number`);
                        } else {
                            fail(`${agent.name}: APY is invalid`);
                        }
                        
                        if (typeof agent.pnl === 'number') {
                            pass(`${agent.name}: P&L is valid number`);
                        } else {
                            fail(`${agent.name}: P&L is invalid`);
                        }
                        
                        if (typeof agent.winRate === 'number' && agent.winRate >= 0 && agent.winRate <= 100) {
                            pass(`${agent.name}: Win Rate is valid`);
                        } else {
                            fail(`${agent.name}: Win Rate is invalid`);
                        }
                        
                        if (typeof agent.trades === 'number' && agent.trades >= 0) {
                            pass(`${agent.name}: Trade count is valid`);
                        } else {
                            fail(`${agent.name}: Trade count is invalid`);
                        }
                        
                        if (Array.isArray(agent.chains) && agent.chains.length > 0) {
                            pass(`${agent.name}: Chains array is valid`);
                        } else {
                            fail(`${agent.name}: Chains array is invalid`);
                        }
                    });
                    
                } else {
                    fail('No agents found - run seed script');
                }
            } else {
                fail('API does not return agents array');
            }
        } else {
            fail('Agents API endpoint not accessible');
        }
    } catch (error) {
        fail(`Agents API error: ${error.message}`);
    }
    
    // Summary
    console.log('');
    console.log('========================================');
    console.log('Verification Summary');
    console.log('========================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('');
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Integration is working correctly.');
        console.log('');
        console.log('Next steps:');
        console.log('1. Start frontend: npm run dev');
        console.log('2. Connect MetaMask');
        console.log('3. Navigate to AI Agents page');
        console.log('4. Verify agents display correctly');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
        console.log('');
        console.log('Common fixes:');
        console.log('1. Ensure MongoDB is running: docker ps | grep mongodb');
        console.log('2. Seed data: node seed-docker-mongodb.js <wallet>');
        console.log('3. Restart backend: node backend-server.js');
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

verifyIntegration();
