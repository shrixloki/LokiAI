/**
 * Check Agent Status in MongoDB
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';
const WALLET = '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';

async function checkAgents() {
    let client;
    
    try {
        console.log('📡 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        console.log('✅ Connected\n');

        const agentsCollection = db.collection('agents');
        const agents = await agentsCollection.find({ 
            walletAddress: WALLET.toLowerCase() 
        }).toArray();
        
        console.log(`Found ${agents.length} agents:\n`);
        
        agents.forEach((agent, index) => {
            console.log(`${index + 1}. ${agent.name}`);
            console.log(`   Type: ${agent.type}`);
            console.log(`   Status: ${agent.status}`);
            console.log(`   P&L: $${agent.performance?.totalPnl || 0}`);
            console.log(`   APY: ${agent.performance?.apy || 0}%`);
            console.log(`   Win Rate: ${agent.performance?.winRate || 0}%`);
            console.log(`   Trades: ${agent.performance?.totalTrades || 0}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

checkAgents();
