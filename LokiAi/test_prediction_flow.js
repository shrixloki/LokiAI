#!/usr/bin/env node
/**
 * Test script to verify ML predictions and trade instruction flow
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://127.0.0.1:25001';
const ML_API_URL = 'http://127.0.0.1:8000';

// Mock wallet address
const MOCK_WALLET = '0x0000000000000000000000000000000000000001';

// Test market data
const MARKET_DATA = {
    price: 1650.25,
    volume_24h: 2500000.0,
    volatility: 0.035,
    rsi: 62.5,
    liquidity_usd: 12000000.0
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMLApiDirectly() {
    console.log('🧪 Testing ML API directly...');
    
    try {
        const response = await fetch(`${ML_API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token_symbol: 'ETH',
                agent_type: 'yield',
                market_data: MARKET_DATA
            })
        });
        
        if (!response.ok) {
            throw new Error(`ML API error: ${response.status} ${response.statusText}`);
        }
        
        const prediction = await response.json();
        console.log('✅ ML API Prediction:', JSON.stringify(prediction, null, 2));
        return prediction;
        
    } catch (error) {
        console.error('❌ ML API test failed:', error.message);
        return null;
    }
}

async function testBackendHealth() {
    console.log('🏥 Testing backend health...');
    
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const health = await response.json();
        console.log('✅ Backend Health:', JSON.stringify(health, null, 2));
        return health;
    } catch (error) {
        console.error('❌ Backend health check failed:', error.message);
        return null;
    }
}

async function deployTestAgent() {
    console.log('🚀 Deploying test agent...');
    
    try {
        const agentConfig = {
            type: 'yield',
            tokenSymbol: 'ETH',
            network: 'sepolia',
            name: 'Test Yield Agent',
            description: 'Test agent for prediction flow'
        };
        
        const response = await fetch(`${BACKEND_URL}/agents/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentConfig: agentConfig,
                walletAddress: MOCK_WALLET
            })
        });
        
        if (!response.ok) {
            throw new Error(`Deploy failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Agent deployed:', result.agentId);
        return result;
        
    } catch (error) {
        console.error('❌ Agent deployment failed:', error.message);
        return null;
    }
}

async function executeAgentPrediction(agentId) {
    console.log(`⚡ Executing agent prediction for ${agentId}...`);
    
    try {
        const response = await fetch(`${BACKEND_URL}/agents/${agentId}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                marketData: MARKET_DATA,
                walletAddress: MOCK_WALLET
            })
        });
        
        if (!response.ok) {
            throw new Error(`Execution failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Agent execution result:', JSON.stringify(result, null, 2));
        return result;
        
    } catch (error) {
        console.error('❌ Agent execution failed:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('🎯 Starting prediction flow tests...\n');
    
    // Test 1: Direct ML API call
    const mlResult = await testMLApiDirectly();
    await sleep(2000);
    
    // Test 2: Backend health check
    const healthResult = await testBackendHealth();
    await sleep(2000);
    
    // Test 3: Deploy agent
    const deployResult = await deployTestAgent();
    if (!deployResult) {
        console.error('❌ Cannot continue without deployed agent');
        return;
    }
    await sleep(2000);
    
    // Test 4: Execute agent prediction (full flow)
    const execResult = await executeAgentPrediction(deployResult.agentId);
    await sleep(2000);
    
    console.log('\n📊 Test Summary:');
    console.log(`- ML API Direct Test: ${mlResult ? '✅' : '❌'}`);
    console.log(`- Backend Health: ${healthResult ? '✅' : '❌'}`);
    console.log(`- Agent Deployment: ${deployResult ? '✅' : '❌'}`);
    console.log(`- Full Prediction Flow: ${execResult ? '✅' : '❌'}`);
    
    if (execResult && execResult.success) {
        console.log('\n🎉 SUCCESS: ML predictions are working and generating trade instructions!');
        console.log('📈 Prediction ID:', execResult.prediction?.prediction_id);
        console.log('📋 Trade Instruction ID:', execResult.tradeInstruction?.id);
        console.log('🔗 Transaction ready for MetaMask:', !!execResult.execution?.transaction);
    } else {
        console.log('\n⚠️  Some issues detected. Check logs for details.');
    }
}

// Run the tests
runTests().catch(console.error);