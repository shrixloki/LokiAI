# Cross-Chain AI Agent Network - Settings Persistence System

## Overview

This system provides robust, wallet-verified settings persistence for the Cross-Chain AI Agent Network dashboard. All user preferences are stored in PostgreSQL and verified through MetaMask wallet signatures to prevent spoofing.

## Architecture

### Backend (Rust - Port 25000)
- **Framework**: Actix-web with PostgreSQL integration
- **Authentication**: Ethereum wallet signature verification using ethers library
- **Database**: PostgreSQL with comprehensive settings schema
- **API Endpoints**: RESTful API for settings CRUD operations

### Frontend (React/TypeScript)
- **MetaMask Integration**: Automatic wallet connection and signature prompts
- **Real-time Updates**: Live settings synchronization with backend
- **Batch Operations**: Efficient bulk settings updates with single signature
- **Auto-loading**: Automatic settings retrieval on wallet connect/switch

## Features

### ✅ Complete Implementation

1. **Wallet-Based Storage**: Each wallet address has isolated settings
2. **MetaMask Verification**: All saves require wallet signature verification
3. **Real-time Sync**: Settings automatically load on wallet connect/switch
4. **Batch Updates**: Multiple setting changes saved in single transaction
5. **No Mock Data**: All settings come from live PostgreSQL database
6. **Persistent Sessions**: Settings survive page refresh and reconnection

### Settings Categories

- **Profile & Account**: Display name, email, timezone, language
- **Trading Preferences**: Slippage, gas strategy, DEX preferences, auto-approve
- **Security**: 2FA, biometric auth, session timeout, IP whitelist
- **Privacy**: Data sharing, analytics, marketing preferences
- **Interface**: Theme, currency, developer mode, beta features
- **Notifications**: Email, push, SMS, trade alerts, security alerts

## API Endpoints

### Settings Management
- `GET /api/settings/:wallet_address` - Fetch settings for wallet
- `POST /api/settings/:wallet_address` - Save/update settings (requires signature)
- `DELETE /api/settings/:wallet_address` - Delete all settings (requires signature)
- `POST /api/settings/:wallet_address/reset` - Reset to defaults (requires signature)
- `GET /api/settings/:wallet_address/export` - Export settings as JSON

## Database Schema

```sql
CREATE TABLE wallet_settings (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    
    -- Profile Information
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    
    -- Security Settings
    two_factor_enabled BOOLEAN DEFAULT false,
    biometric_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30,
    ip_whitelist TEXT[],
    
    -- Privacy Settings
    data_sharing_enabled BOOLEAN DEFAULT false,
    analytics_enabled BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    trade_alerts BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    
    -- Trading Preferences
    default_slippage DECIMAL(5,2) DEFAULT 0.50,
    auto_approve_enabled BOOLEAN DEFAULT false,
    gas_price_preference VARCHAR(20) DEFAULT 'standard',
    preferred_dex VARCHAR(50) DEFAULT 'uniswap',
    
    -- Display Preferences
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Advanced Settings
    developer_mode BOOLEAN DEFAULT false,
    beta_features BOOLEAN DEFAULT false,
    custom_rpc_urls JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

### Wallet Signature Verification
- All write operations require MetaMask signature
- Message format: `"Chainflow Sentinel Settings {action}\n\nWallet: {address}\nTimestamp: {timestamp}\nNonce: {nonce}"`
- Backend cryptographically verifies signature matches wallet address
- Prevents unauthorized settings modifications

### Data Protection
- Settings isolated by wallet address
- No cross-wallet data access
- Secure signature verification prevents spoofing
- IP whitelisting support for additional security

## Usage Flow

### 1. User Connects Wallet
```typescript
// Automatic settings loading
useEffect(() => {
  if (isConnected && account) {
    fetchSettings(); // Loads settings from backend
  }
}, [isConnected, account]);
```

### 2. User Modifies Settings
```typescript
// Local state management for pending changes
const handleLocalChange = (key: string, value: any) => {
  setPendingChanges(prev => ({ ...prev, [key]: value }));
  setHasUnsavedChanges(true);
};
```

### 3. User Saves Changes
```typescript
// Batch save with MetaMask signature
const handleSaveChanges = async () => {
  const success = await saveSettings(pendingChanges);
  // Prompts MetaMask for signature verification
  // Saves all changes in single transaction
};
```

### 4. Automatic Persistence
- Settings persist through page refresh
- Auto-load on wallet reconnection
- Sync across browser sessions
- No data loss on MetaMask disconnect/reconnect

## Running the System

### 1. Start Rust Backend
```bash
cd loki/loki1
cargo run
# Server starts on http://127.0.0.1:25000
```

### 2. Start Frontend
```bash
npm run dev
# Frontend starts on http://127.0.0.1:5173
```

### 3. Setup Database
```bash
# Run migrations
sqlx migrate run
```

## Key Files

### Backend
- `loki1/src/main.rs` - Main server setup
- `loki1/src/handlers/settings.rs` - Settings API endpoints
- `loki1/src/models/settings.rs` - Settings data models
- `loki1/src/auth/mod.rs` - Wallet signature verification
- `migrations/20250905120000_create_wallet_settings.sql` - Database schema

### Frontend
- `src/pages/Settings.tsx` - Main settings UI
- `src/hooks/useWalletSettings.ts` - Settings state management
- `src/hooks/useMetaMask.ts` - Wallet connection logic

## Testing

1. Connect MetaMask wallet
2. Navigate to Settings page
3. Modify any setting (profile, trading, security, interface)
4. Click "Save Changes" - MetaMask will prompt for signature
5. Refresh page - settings should persist
6. Switch wallets - different settings should load
7. Reconnect wallet - settings should auto-load

## Benefits

- **Zero Data Loss**: All settings permanently stored in PostgreSQL
- **Wallet Security**: Cryptographic verification prevents unauthorized access
- **Seamless UX**: Automatic loading and batch saving
- **Cross-Session**: Settings persist across browser sessions and devices
- **Scalable**: Supports unlimited wallets with isolated settings
- **Production Ready**: Full error handling and validation

The system ensures every Profile, Trading, Security, and Interface edit is verified via MetaMask, saved in PostgreSQL, and reliably loaded for every visit, refresh, or session.
