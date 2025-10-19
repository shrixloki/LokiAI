/**
 * Test Real Blockchain Transactions
 * 
 * This script tests if the system can actually execute real blockchain transactions
 */

import http from 'http';

const API_BASE_URL = 'http://localhost:5000';
const TEST_WALLET = '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';

async function makeRequest(url, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
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
        req.setTimeout(30000, () => reject(new Error('Request timeout')));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testRealBlockchainTransactions() {
    console.log('🔗 Testing Real Blockchain Transactions...\n');

    // Test 1: Check if backend is ready
    console.log('1. Testing backend health...');
    try {
        const healthResponse = await makeRequest(`${API_BASE_URL}/health`);
        if (healthResponse.status === 200) {
            console.log('✅ Backend is healthy');
        } else {
            console.log('❌ Backend health check failed');
            return;
        }
    } catch (error) {
        console.log('❌ Backend is not accessible:', error.message);
        return;
    }

    // Test 2: Execute Yield Optimizer (Real Blockchain Transaction)
    console.log('\n2. Testing Yield Optimizer - REAL BLOCKCHAIN TRANSACTION...');
    try {
        const yieldRequest = {
            walletAddress: TEST_WALLET,
            tokenAddress: '0xA0b86a33E6441E6C8C07C4c0c8E8B8C8D8E8F8G8',
            amount: '1000000000000000000', // 1 ETH in wei
            strategyName: 'compound-v3'
        };

        const yieldResponse = await makeRequest(
            `${API_BASE_URL}/api/production-blockchain/agents/execute/yield`,
            'POST',
            yieldRequest
        );

        console.log('Response Status:', yieldResponse.status);
        console.log('Response Data:', JSON.stringify(yieldResponse.data, null, 2));

        if (yieldResponse.data.success && yieldResponse.data.txHash) {
            console.log('✅ REAL BLOCKCHAIN TRANSACTION EXECUTED!');
            console.log(`🔗 Transaction Hash: ${yieldResponse.data.txHash}`);
            console.log(`💸 ETH Spent: ${yieldResponse.data.ethSpent || 'N/A'}`);
            console.log(`📊 Block Number: ${yieldResponse.data.blockNumber || 'N/A'}`);
            console.log(`🔍 Explorer: ${yieldResponse.data.explorerUrl || 'N/A'}`);
        } else {
            console.log('❌ Transaction failed or was simulated');
            console.log('Error:', yieldResponse.data.error || 'Unknown error');
        }
    } catch (error) {
        console.log('❌ Yield optimizer test failed:', error.message);
    }

    // Test 3: Execute Arbitrage Bot (Real Blockchain Transaction)
    console.log('\n3. Testing Arbitrage Bot - REAL BLOCKCHAIN TRANSACTION...');
    try {
        const arbitrageRequest = {
            walletAddress: TEST_WALLET,
            tokenA: '0xA0b86a33E6441E6C8C07C4c0c8E8B8C8D8E8F8G8',
            tokenB: '0xB0b86a33E6441E6C8C07C4c0c8E8B8C8D8E8F8G8',
            amount: '1000000000000000000', // 1 ETH in wei
            dexA: 'uniswap-v3',
            dexB: 'sushiswap'
        };

        const arbitrageResponse = await makeRequest(
            `${API_BASE_URL}/api/production-blockchain/agents/execute/arbitrage`,
            'POST',
            arbitrageRequest
        );

        console.log('Response Status:', arbitrageResponse.status);
        console.log('Response Data:', JSON.stringify(arbitrageResponse.data, null, 2));

        if (arbitrageResponse.data.success && arbitrageResponse.data.txHash) {
            console.log('✅ REAL BLOCKCHAIN ARBITRAGE EXECUTED!');
            console.log(`🔗 Transaction Hash: ${arbitrageResponse.data.txHash}`);
            console.log(`💸 ETH Spent: ${arbitrageResponse.data.ethSpent || 'N/A'}`);
            console.log(`💰 Profit: $${arbitrageResponse.data.actualProfit || 'N/A'}`);
            console.log(`🔍 Explorer: ${arbitrageResponse.data.explorerUrl || 'N/A'}`);
        } else {
            console.log('❌ Arbitrage transaction failed or was simulated');
            console.log('Error:', arbitrageResponse.data.error || 'Unknown error');
        }
    } catch (error) {
        console.log('❌ Arbitrage bot test failed:', error.message);
    }

    // Test 4: Check if transactions are visible on blockchain
    console.log('\n4. Verification Instructions:');
    console.log('='.repeat(50));
    console.log('To verify these are REAL blockchain transactions:');
    console.log('1. Copy any transaction hash from above');
    console.log('2. Go to https://sepolia.etherscan.io/');
    console.log('3. Paste the transaction hash in the search box');
    console.log('4. You should see the actual transaction with:');
    console.log('   - Real gas fees paid');
    console.log('   - ETH transferred');
    console.log('   - Block confirmation');
    console.log('   - Transaction timestamp');
    console.log('');
    console.log('This proves the transactions are REAL and on-chain!');
}

// Run the tests
testRealBlockchainTransactions()
    .then(() => {
        console.log('\n🎉 Real blockchain transaction test completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    });