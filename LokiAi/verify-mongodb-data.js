/**
 * Verify MongoDB Data
 * Quick script to check if data was seeded correctly
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';
const WALLET = '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';

async function verify() {
    let client;
    
    try {
        console.log('📡 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        console.log('✅ Connected');
        console.log('');

        // Check agents
        const agentsCollection = db.collection('agents');
        const totalAgents = await agentsCollection.countDocuments({ 
            walletAddress: WALLET.toLowerCase() 
        });
        const activeAgents = await agentsCollection.countDocuments({ 
            walletAddress: WALLET.toLowerCase(),
            status: 'active'
        });
        
        console.log('🤖 Agents:');
        console.log(`  Total: ${totalAgents}`);
        console.log(`  Active: ${activeAgents}`);
        
        if (totalAgents > 0) {
            const agents = await agentsCollection.find({ 
                walletAddress: WALLET.toLowerCase() 
            }).toArray();
            const totalPnL = agents.reduce((sum, agent) => sum + (agent.performance?.totalPnl || 0), 0);
            console.log(`  Total P&L: $${totalPnL.toFixed(2)}`);
        }
        console.log('');

        // Check transactions
        const transactionsCollection = db.collection('transactions');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const txCount = await transactionsCollection.countDocuments({
            walletAddress: WALLET.toLowerCase(),
            timestamp: { $gte: thirtyDaysAgo }
        });
        
        console.log('🌉 Transactions (last 30 days):');
        console.log(`  Count: ${txCount}`);
        console.log('');

        // Summary
        console.log('📊 Summary:');
        console.log(`  Database: ${DB_NAME}`);
        console.log(`  Wallet: ${WALLET}`);
        console.log(`  Agents: ${activeAgents}/${totalAgents}`);
        console.log(`  Transactions: ${txCount}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

verify();
