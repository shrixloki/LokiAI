// MongoDB Initialization Script for LokiAI
// This script creates collections and indexes

db = db.getSiblingDB('loki_agents');

// Create collections
db.createCollection('users');
db.createCollection('agents');
db.createCollection('transactions');
db.createCollection('analytics');
db.createCollection('notifications');
db.createCollection('biometrics');
db.createCollection('activity_log');
db.createCollection('portfolio_history');

// Create indexes for users
db.users.createIndex({ walletAddress: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Create indexes for agents
db.agents.createIndex({ walletAddress: 1 });
db.agents.createIndex({ type: 1 });
db.agents.createIndex({ status: 1 });
db.agents.createIndex({ walletAddress: 1, name: 1 }, { unique: true });

// Create indexes for transactions
db.transactions.createIndex({ walletAddress: 1 });
db.transactions.createIndex({ timestamp: -1 });
db.transactions.createIndex({ hash: 1 }, { unique: true, sparse: true });
db.transactions.createIndex({ fromChain: 1, toChain: 1 });
db.transactions.createIndex({ status: 1 });

// Create indexes for analytics
db.analytics.createIndex({ walletAddress: 1 });
db.analytics.createIndex({ timestamp: -1 });

// Create indexes for biometrics
db.biometrics.createIndex({ walletAddress: 1, type: 1 }, { unique: true });

// Create indexes for activity log
db.activity_log.createIndex({ walletAddress: 1 });
db.activity_log.createIndex({ timestamp: -1 });
db.activity_log.createIndex({ type: 1 });

// Create indexes for portfolio history
db.portfolio_history.createIndex({ walletAddress: 1 });
db.portfolio_history.createIndex({ timestamp: -1 });

print('✅ MongoDB collections and indexes created successfully');
