/**
 * Check Wallet Balance on Sepolia
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkWalletBalance() {
    try {
        console.log('🔍 Checking wallet balance on Sepolia...\n');
        
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
        
        console.log(`📍 Wallet Address: ${wallet.address}`);
        
        const balance = await provider.getBalance(wallet.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
        
        if (balance === 0n) {
            console.log('\n❌ WALLET HAS NO ETH!');
            console.log('🚰 Get test ETH from Sepolia faucet:');
            console.log('   https://sepoliafaucet.com/');
            console.log('   https://sepolia-faucet.pk910.de/');
            console.log('   https://www.infura.io/faucet/sepolia');
            console.log('\n📋 Steps:');
            console.log('1. Copy wallet address:', wallet.address);
            console.log('2. Go to any faucet above');
            console.log('3. Paste address and request test ETH');
            console.log('4. Wait for transaction confirmation');
            console.log('5. Run this script again to verify');
        } else {
            console.log('\n✅ Wallet has sufficient balance for transactions!');
            console.log('🚀 Ready to execute real blockchain transactions');
        }
        
        // Check network
        const network = await provider.getNetwork();
        console.log(`\n🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
        
        // Check latest block
        const blockNumber = await provider.getBlockNumber();
        console.log(`📦 Latest Block: ${blockNumber}`);
        
    } catch (error) {
        console.error('❌ Error checking wallet:', error.message);
    }
}

checkWalletBalance();