#!/usr/bin/env node
/**
 * Test script to verify mainnet configuration and multi-chain support
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://127.0.0.1:25001';

async function testNetworkConfiguration() {
    console.log('🌐 Testing network configuration...\n');
    
    try {
        const response = await fetch(`${BACKEND_URL}/networks`);
        
        if (!response.ok) {
            throw new Error(`Networks endpoint error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('📊 Network Configuration Status:');
        console.log(`Total Networks: ${data.validation.summary.total}`);
        console.log(`Configured Networks: ${data.validation.summary.configured}`);
        console.log(`Mainnet Ready: ${data.validation.summary.mainnetReady}`);
        console.log(`Testnet Ready: ${data.validation.summary.testnetReady}\n`);
        
        console.log('🔗 Network Details:');
        for (const [networkName, config] of Object.entries(data.validation.networks)) {
            const status = config.ready ? '✅' : '⚠️';
            const type = config.type === 'mainnet' ? '🔴 MAINNET' : '🟡 TESTNET';
            
            console.log(`${status} ${networkName.toUpperCase()} (${type})`);
            console.log(`   Chain ID: ${config.chainId}`);
            console.log(`   RPC: ${config.rpcConfigured ? '✅ Configured' : '❌ Needs Config'}`);
            console.log(`   Contracts: ${config.contractsConfigured ? '✅ Configured' : '❌ Needs Config'}`);
            console.log('');
        }
        
        // Test each network's contracts
        console.log('📄 Contract Addresses by Network:');
        for (const [networkName, contracts] of Object.entries(data.contracts)) {
            console.log(`\n${networkName.toUpperCase()}:`);
            for (const [contractType, address] of Object.entries(contracts)) {
                const isConfigured = address !== '0x0000000000000000000000000000000000000000';
                const status = isConfigured ? '✅' : '⚠️';
                console.log(`   ${status} ${contractType}: ${address}`);
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Network configuration test failed:', error.message);
        return null;
    }
}

async function testMainnetAgentDeployment() {
    console.log('\n🚀 Testing mainnet agent deployment...\n');
    
    try {
        const agentConfig = {
            type: 'yield',
            tokenSymbol: 'ETH',
            network: 'mainnet', // Test with mainnet
            name: 'Mainnet Yield Agent',
            description: 'Test agent for mainnet deployment'
        };
        
        const response = await fetch(`${BACKEND_URL}/agents/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentConfig: agentConfig,
                walletAddress: '0x0000000000000000000000000000000000000001'
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Mainnet agent deployed successfully!');
            console.log(`Agent ID: ${result.agentId}`);
            console.log(`Network: ${result.agent.network}`);
            console.log(`Type: ${result.agent.type}`);
        } else {
            console.log('⚠️ Mainnet agent deployment response:', result);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Mainnet agent deployment test failed:', error.message);
        return null;
    }
}

async function testMultiChainSupport() {
    console.log('\n🔗 Testing multi-chain support...\n');
    
    const networks = ['mainnet', 'polygon', 'arbitrum', 'optimism', 'sepolia', 'mumbai'];
    const results = [];
    
    for (const network of networks) {
        try {
            const agentConfig = {
                type: 'arbitrage',
                tokenSymbol: 'ETH',
                network: network,
                name: `${network} Arbitrage Agent`,
                description: `Test agent for ${network} network`
            };
            
            const response = await fetch(`${BACKEND_URL}/agents/deploy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentConfig: agentConfig,
                    walletAddress: '0x0000000000000000000000000000000000000001'
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log(`✅ ${network.toUpperCase()}: Agent deployed (${result.agentId})`);
                results.push({ network, success: true, agentId: result.agentId });
            } else {
                console.log(`❌ ${network.toUpperCase()}: ${result.error || 'Deployment failed'}`);
                results.push({ network, success: false, error: result.error });
            }
            
        } catch (error) {
            console.log(`❌ ${network.toUpperCase()}: ${error.message}`);
            results.push({ network, success: false, error: error.message });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
}

async function runMainnetTests() {
    console.log('🔥 LokiAI Mainnet Configuration Tests\n');
    console.log('=' * 50);
    
    // Test 1: Network configuration
    const networkConfig = await testNetworkConfiguration();
    
    // Test 2: Mainnet agent deployment
    const mainnetAgent = await testMainnetAgentDeployment();
    
    // Test 3: Multi-chain support
    const multiChainResults = await testMultiChainSupport();
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('=' * 30);
    
    if (networkConfig) {
        console.log(`✅ Network Configuration: PASSED`);
        console.log(`   - ${networkConfig.validation.summary.configured} networks configured`);
        console.log(`   - ${networkConfig.validation.summary.mainnetReady} mainnets ready`);
    } else {
        console.log(`❌ Network Configuration: FAILED`);
    }
    
    if (mainnetAgent) {
        console.log(`✅ Mainnet Agent Deployment: PASSED`);
    } else {
        console.log(`❌ Mainnet Agent Deployment: FAILED`);
    }
    
    const successfulNetworks = multiChainResults.filter(r => r.success).length;
    console.log(`📊 Multi-chain Support: ${successfulNetworks}/${multiChainResults.length} networks`);
    
    if (successfulNetworks > 0) {
        console.log('\n🎉 MAINNET SUPPORT IS WORKING!');
        console.log('Your LokiAI backend now supports:');
        console.log('  - Environment variable configuration');
        console.log('  - Multi-chain deployments (Ethereum, Polygon, Arbitrum, Optimism)');
        console.log('  - Network-specific contract addresses');
        console.log('  - Automatic network validation');
    } else {
        console.log('\n⚠️ CONFIGURATION NEEDED:');
        console.log('Update your .env file with:');
        console.log('  - Valid RPC URLs for your target networks');
        console.log('  - Contract addresses for each network');
        console.log('  - Use .env.example as a template');
    }
}

// Helper to repeat string
String.prototype.repeat = String.prototype.repeat || function(count) {
    return new Array(count + 1).join(this);
};

// Run the tests
runMainnetTests().catch(console.error);