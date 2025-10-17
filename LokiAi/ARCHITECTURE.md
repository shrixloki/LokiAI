# 🏗️ LokiAI System Architecture

## Overview

LokiAI is a production-ready, fully Dockerized decentralized AI agent platform with biometric security.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                      (MetaMask Wallet)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                           │
│                         Port 80/443                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │    /     │  │  /api/   │  │/socket.io│  │ /biometrics/ │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└────┬────────────────┬────────────┬──────────────────┬──────────┘
     │                │            │                  │
     ▼                ▼            ▼                  ▼
┌─────────┐    ┌──────────────────────┐      ┌──────────────┐
│Frontend │    │      Backend         │      │  Biometrics  │
│ React   │    │  Node.js + Express   │      │   FastAPI    │
│  Vite   │    │    + Socket.IO       │      │   Python     │
│Port 5175│    │  Port 5000/5050      │      │  Port 25000  │
└─────────┘    └──────────┬───────────┘      └──────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │     MongoDB      │
                │   Port 27017     │
                │  Collections:    │
                │  - users         │
                │  - agents        │
                │  - transactions  │
                │  - biometrics    │
                │  - activity_log  │
                └──────────────────┘
```

---

## 🔄 Data Flow

### 1. User Authentication Flow

```
User Browser
    │
    │ 1. Connect Wallet
    ▼
MetaMask Extension
    │
    │ 2. Request SIWE Message
    ▼
Backend API (/api/auth/message)
    │
    │ 3. Generate Challenge
    ▼
User Signs Message
    │
    │ 4. Submit Signature
    ▼
Backend API (/api/auth/verify)
    │
    │ 5. Verify with ethers.js
    ▼
MongoDB (users collection)
    │
    │ 6. Create/Update User
    ▼
Return JWT Token
```

### 2. Biometric Enrollment Flow

```
User Browser
    │
    │ 1. Capture Keystroke/Voice
    ▼
Frontend (BiometricSetupModal)
    │
    │ 2. Extract Features
    ▼
Backend API (/api/biometrics/train)
    │
    │ 3. Proxy Request
    ▼
Biometrics Service (/api/biometrics/keystroke/train)
    │
    │ 4. Train ML Model
    ▼
scikit-learn (Autoencoder/MLP)
    │
    │ 5. Encrypt Model
    ▼
MongoDB (biometrics collection)
    │
    │ 6. Store Encrypted Model
    ▼
Return Success + Checksum
```

### 3. AI Agent Execution Flow

```
Backend Server
    │
    │ 1. Fetch Agent Config
    ▼
MongoDB (agents collection)
    │
    │ 2. Get Agent Parameters
    ▼
Blockchain RPC (Alchemy)
    │
    │ 3. Fetch On-Chain Data
    ▼
Agent Logic (DeFi/Arbitrage/Rebalance)
    │
    │ 4. Execute Strategy
    ▼
MongoDB (transactions collection)
    │
    │ 5. Log Transaction
    ▼
Socket.IO
    │
    │ 6. Emit Real-Time Update
    ▼
Frontend Dashboard
```

### 4. Real-Time Updates Flow

```
Backend Server (Every 10s)
    │
    │ 1. Query Active Agents
    ▼
MongoDB (agents collection)
    │
    │ 2. Get Performance Data
    ▼
Socket.IO Server
    │
    │ 3. Emit 'updateAgent' Event
    ▼
Socket.IO Client (Frontend)
    │
    │ 4. Update UI State
    ▼
React Dashboard Components
```

---

## 🗄️ Database Schema

### users Collection
```javascript
{
    _id: ObjectId,
    walletAddress: String (indexed, unique),
    biometricsVerified: Boolean,
    biometricAuth: Boolean,
    lastLogin: Date,
    createdAt: Date,
    updatedAt: Date
}
```

### agents Collection
```javascript
{
    _id: ObjectId,
    walletAddress: String (indexed),
    name: String,
    type: String, // 'yield' | 'arbitrage' | 'rebalancer' | 'risk'
    status: String, // 'active' | 'paused' | 'stopped'
    chains: [String],
    performance: {
        apy: Number,
        totalPnl: Number,
        winRate: Number,
        totalTrades: Number
    },
    config: Object,
    createdAt: Date,
    updatedAt: Date
}
```

### transactions Collection
```javascript
{
    _id: ObjectId,
    walletAddress: String (indexed),
    hash: String (unique),
    fromChain: String,
    toChain: String,
    token: String,
    amount: Number,
    fee: Number,
    status: String, // 'completed' | 'pending' | 'failed'
    timestamp: Date (indexed)
}
```

### biometrics Collection
```javascript
{
    _id: ObjectId,
    walletAddress: String (indexed),
    type: String, // 'keystroke' | 'voice'
    encryptedData: String, // AES-256-CBC encrypted
    iv: String, // Initialization vector
    checksum: String, // SHA-256 hash
    samplesCount: Number,
    trainedAt: Date,
    version: Number
}
```

### activity_log Collection
```javascript
{
    _id: ObjectId,
    walletAddress: String (indexed),
    type: String,
    action: String,
    description: String,
    status: String,
    timestamp: Date (indexed),
    metadata: Object
}
```

### portfolio_history Collection
```javascript
{
    _id: ObjectId,
    walletAddress: String (indexed),
    totalValue: Number,
    timestamp: Date (indexed)
}
```

---

## 🔐 Security Architecture

### Authentication Layers

```
┌─────────────────────────────────────────┐
│         Layer 1: Wallet Auth            │
│  MetaMask + SIWE + Signature Verify     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    Layer 2: Biometric Auth (Optional)   │
│  Keystroke Dynamics + Voice Biometrics  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Layer 3: Session Management        │
│         JWT Tokens + CORS               │
└─────────────────────────────────────────┘
```

### Data Encryption

```
Biometric Data
    │
    │ 1. Capture Features
    ▼
Feature Vector (Array)
    │
    │ 2. AES-256-CBC Encryption
    ▼
Encrypted Data + IV
    │
    │ 3. SHA-256 Checksum
    ▼
MongoDB Storage
    │
    │ 4. Encrypted at Rest
    ▼
Secure Storage
```

---

## 🌐 Network Architecture

### Docker Network Topology

```
┌─────────────────────────────────────────────────────────┐
│              lokiai-network (Bridge)                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  nginx   │  │ frontend │  │ backend  │  │mongodb │ │
│  │  :80     │  │  :5175   │  │:5000/5050│  │ :27017 │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │             │             │             │      │
│       └─────────────┴─────────────┴─────────────┘      │
│                          │                              │
│                          ▼                              │
│                  ┌──────────────┐                       │
│                  │  biometrics  │                       │
│                  │   :25000     │                       │
│                  └──────────────┘                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                  External Networks
                  (Blockchain RPCs)
```

### Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| NGINX | 80 | 80 | HTTP |
| NGINX | 443 | 443 | HTTPS (optional) |
| Frontend | 80 | 5175 | HTTP |
| Backend | 5000 | 5000 | HTTP |
| Backend | 5050 | 5050 | WebSocket |
| Biometrics | 25000 | 25000 | HTTP |
| MongoDB | 27017 | 27017 | TCP |

---

## 🔄 Service Dependencies

```
┌──────────┐
│  NGINX   │ (Depends on: frontend, backend, biometrics)
└────┬─────┘
     │
     ├─────► ┌──────────┐
     │       │ Frontend │ (Depends on: backend)
     │       └──────────┘
     │
     ├─────► ┌──────────┐
     │       │ Backend  │ (Depends on: mongodb, biometrics)
     │       └────┬─────┘
     │            │
     │            ├─────► ┌──────────┐
     │            │       │ MongoDB  │ (No dependencies)
     │            │       └──────────┘
     │            │
     │            └─────► ┌──────────────┐
     │                    │  Biometrics  │ (No dependencies)
     │                    └──────────────┘
     │
     └─────► ┌──────────────┐
             │  Biometrics  │
             └──────────────┘
```

---

## 📊 API Architecture

### REST API Endpoints

```
/api/
├── auth/
│   ├── GET  /message          # Generate SIWE message
│   └── POST /verify           # Verify signature
├── dashboard/
│   └── GET  /summary          # Dashboard overview
├── agents/
│   ├── GET  /status           # Get all agents
│   └── POST /update           # Update agent
├── analytics/
│   ├── GET  /performance      # Performance metrics
│   └── GET  /risk             # Risk analysis
├── crosschain/
│   ├── GET  /activity         # Cross-chain txs
│   └── GET  /bridges          # Available bridges
└── activity/
    ├── GET  /history          # Activity log
    └── GET  /stats            # Statistics

/biometrics/
├── GET  /status               # Check setup
├── POST /keystroke/train      # Train keystroke
├── POST /keystroke/verify     # Verify keystroke
├── POST /voice/train          # Train voice
└── POST /voice/verify         # Verify voice
```

### WebSocket Events

```
Client → Server:
    - subscribe(walletAddress)
    - disconnect()

Server → Client:
    - updateAgent(agentData)
    - updatePortfolio(portfolioData)
    - updateActivity(activityData)
```

---

## 🧠 ML Architecture

### Keystroke Dynamics

```
Input: Keystroke Features (35 dimensions)
    │
    │ Hold Times (11)
    │ DD Times (10)
    │ UD Times (10)
    │ Additional (4)
    ▼
StandardScaler (Normalization)
    ▼
MLP Classifier (64-32-64)
    │
    │ Hidden Layer 1: 64 neurons (ReLU)
    │ Hidden Layer 2: 32 neurons (ReLU)
    │ Hidden Layer 3: 64 neurons (ReLU)
    ▼
Output: Authentication Score
```

### Voice Biometrics

```
Input: Audio Sample (WAV/WebM)
    │
    │ Sample Rate: 16kHz
    ▼
Feature Extraction (librosa)
    │
    │ MFCC (13 coefficients)
    │ Pitch (F0)
    │ Energy (RMS)
    │ Zero Crossing Rate
    ▼
Feature Vector (16 dimensions)
    ▼
StandardScaler (Normalization)
    ▼
MLP Classifier (32-16-32)
    │
    │ Hidden Layer 1: 32 neurons (ReLU)
    │ Hidden Layer 2: 16 neurons (ReLU)
    │ Hidden Layer 3: 32 neurons (ReLU)
    ▼
Output: Similarity Score
```

---

## 🔄 Deployment Pipeline

```
1. Build Phase
   ├── docker-compose build --no-cache
   ├── Build backend image
   ├── Build biometrics image
   └── Build frontend image

2. Start Phase
   ├── docker-compose up -d
   ├── Start MongoDB
   ├── Start Biometrics (wait for health)
   ├── Start Backend (wait for health)
   ├── Start Frontend
   └── Start NGINX

3. Initialize Phase
   ├── MongoDB collections
   ├── Create indexes
   └── Seed sample data (optional)

4. Verify Phase
   ├── Health checks
   ├── API tests
   └── Integration tests
```

---

## 📈 Scalability

### Horizontal Scaling

```
NGINX Load Balancer
    │
    ├─────► Backend Instance 1
    ├─────► Backend Instance 2
    └─────► Backend Instance 3
                │
                ▼
         MongoDB Replica Set
```

### Vertical Scaling

- Increase Docker container resources
- Optimize MongoDB indexes
- Cache frequently accessed data
- Use Redis for session storage

---

## 🔍 Monitoring & Logging

### Health Checks

```
Service         Endpoint                    Interval
-------         --------                    --------
Backend         /health                     30s
Biometrics      /health                     30s
MongoDB         db.adminCommand('ping')     10s
NGINX           /health (proxy)             30s
```

### Logging Strategy

```
Application Logs
    ├── Backend: /app/logs/backend.log
    ├── Biometrics: stdout (Docker logs)
    └── NGINX: /var/log/nginx/

Docker Logs
    └── docker-compose logs -f [service]

Monitoring
    └── monitor-services.ps1 (Real-time)
```

---

## 🎯 Production Considerations

### Performance Optimization

- NGINX gzip compression
- Static asset caching
- Database query optimization
- Connection pooling
- Lazy loading in frontend

### Security Hardening

- Change default passwords
- Enable SSL/TLS
- Restrict CORS origins
- Rate limiting
- Input validation
- Regular security audits

### Backup Strategy

- MongoDB daily backups
- Biometric model backups
- Configuration backups
- Disaster recovery plan

---

**LokiAI Architecture** - Production-Ready Decentralized AI Platform

**Version**: 1.0.0

**Status**: ✅ Production Ready
