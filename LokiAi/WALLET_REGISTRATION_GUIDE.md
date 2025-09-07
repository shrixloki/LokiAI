# Wallet-Based User Registration System

## Overview
This system implements secure wallet-based user registration using MetaMask integration with cryptographic signature verification. Users must connect their MetaMask wallet, verify ownership through message signing, and then complete registration with their wallet address linked to their user account.

## Architecture

### Backend (Rust + Actix-web)
- **Database**: PostgreSQL with `wallet_address` field (unique, nullable)
- **Signature Verification**: Real Ethereum signature validation using `ethers` crate
- **Endpoints**:
  - `POST /challenge` - Generate challenge message for wallet verification
  - `POST /verify-wallet` - Verify wallet signature cryptographically
  - `POST /users` - Create user with wallet address

### Frontend (React + TypeScript)
- **MetaMask Integration**: Real wallet connection using `window.ethereum`
- **Signature Flow**: Challenge-response pattern for wallet ownership proof
- **User Registration**: Multi-step process with wallet verification

## API Endpoints

### 1. Generate Challenge
```http
POST http://127.0.0.1:25000/challenge
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D"
}
```

**Response:**
```json
{
  "message": "Please sign this message to verify your wallet ownership.\n\nWallet: 0x742d35Cc6634C0532925a3b8D\nTimestamp: 1704463200\nNonce: 12345678"
}
```

### 2. Verify Wallet Signature
```http
POST http://127.0.0.1:25000/verify-wallet
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D",
  "signature": "0x1234567890abcdef...",
  "message": "Please sign this message to verify..."
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Wallet signature verified successfully"
}
```

### 3. Create User with Wallet
```http
POST http://127.0.0.1:25000/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "walletAddress": "0x742d35Cc6634C0532925a3b8D"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b8D"
}
```

## Frontend Components

### 1. UserRegistration Component
Located: `src/components/auth/user-registration.tsx`

**Features:**
- 3-step registration process
- MetaMask connection with real popup
- Wallet signature verification
- Form validation and error handling
- Success/error state management

### 2. Register Page
Located: `src/pages/Register.tsx`

**Route:** `/register`

**Features:**
- Full-page registration experience
- Navigation controls
- Success redirect to dashboard

## Testing Guide

### Prerequisites
1. **MetaMask Extension**: Install MetaMask browser extension
2. **Test Wallet**: Have a test wallet with some ETH for gas fees
3. **Backend Running**: Rust server at `http://127.0.0.1:25000`
4. **Frontend Running**: React app at `http://127.0.0.1:5173`

### Step-by-Step Test

#### 1. Start Backend Server
```bash
cd loki
cargo run
```
Expected output: "Starting server on http://127.0.0.1:25000"

#### 2. Start Frontend Server
```bash
npm run dev
```
Expected output: Server running at `http://127.0.0.1:5173`

#### 3. Test Registration Flow

1. **Navigate to Registration**
   - Go to `http://127.0.0.1:5173/register`
   - Should see 3-step registration form

2. **Step 1: Connect Wallet**
   - Click "Connect MetaMask"
   - MetaMask popup should appear
   - Approve connection
   - Should see "Wallet Connected" with address

3. **Step 2: Verify Wallet**
   - Click "Verify Wallet Ownership"
   - MetaMask signature popup should appear
   - Sign the challenge message
   - Should see "Wallet Verified" status

4. **Step 3: Complete Registration**
   - Fill in name and email
   - Click "Create Account"
   - Should see success message
   - Automatic redirect to dashboard

#### 4. Verify Database Storage
Check that user was created with wallet address:
```bash
# Connect to your PostgreSQL database
psql -d your_database_name

# Query users table
SELECT id, name, email, wallet_address FROM users ORDER BY id DESC LIMIT 5;
```

### Error Testing

#### Test Invalid Signatures
1. Modify signature in browser dev tools
2. Should see "Invalid signature" error

#### Test Duplicate Wallet
1. Try registering same wallet address twice
2. Should see database constraint error

#### Test Without MetaMask
1. Disable MetaMask extension
2. Should see "MetaMask not installed" message

## Security Features

### 1. Cryptographic Signature Verification
- Uses Ethereum's `personal_sign` method
- Verifies signature against wallet address
- Prevents signature replay attacks with timestamps/nonces

### 2. Database Constraints
- `wallet_address` field is UNIQUE
- Prevents duplicate wallet registrations
- Proper error handling for constraint violations

### 3. Frontend Validation
- Wallet connection verification
- Signature verification before registration
- Form validation for user inputs

## Troubleshooting

### Common Issues

#### MetaMask Not Connecting
- Check if MetaMask is unlocked
- Verify correct network (Ethereum mainnet/testnet)
- Clear browser cache and try again

#### Signature Verification Fails
- Ensure message is signed exactly as provided
- Check wallet address format (0x prefix, 42 characters)
- Verify MetaMask is using correct account

#### Backend Errors
- Check PostgreSQL connection
- Verify DATABASE_URL environment variable
- Check server logs for detailed errors

#### CORS Issues
- Backend allows `http://127.0.0.1:5173` and `http://localhost:5173`
- Check browser console for CORS errors

### Debug Commands

#### Test Backend Endpoints
```bash
# Test health check
curl http://127.0.0.1:25000/health

# Test challenge generation
curl -X POST http://127.0.0.1:25000/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b8D"}'

# List users
curl http://127.0.0.1:25000/users
```

#### Check Database
```sql
-- Check table structure
\d users

-- Check recent users
SELECT * FROM users ORDER BY id DESC LIMIT 10;

-- Check wallet addresses
SELECT wallet_address, COUNT(*) FROM users 
WHERE wallet_address IS NOT NULL 
GROUP BY wallet_address;
```

## Next Steps

### Enhancements
1. **Session Management**: Implement JWT tokens for authenticated sessions
2. **Role-Based Access**: Add user roles and permissions
3. **Multi-Wallet Support**: Support for other wallets (Phantom, WalletConnect)
4. **Wallet Switching**: Handle wallet changes in MetaMask
5. **Network Validation**: Ensure users are on correct blockchain network

### Production Considerations
1. **Rate Limiting**: Add rate limits to prevent abuse
2. **Input Sanitization**: Enhanced validation and sanitization
3. **Logging**: Comprehensive audit logging
4. **Monitoring**: Health checks and performance monitoring
5. **Backup Strategy**: Database backup and recovery procedures

## File Structure

```
src/
├── components/auth/
│   ├── user-registration.tsx     # Main registration component
│   └── wallet-connection-modal.tsx # Wallet connection modal
├── hooks/
│   └── useMetaMask.ts           # MetaMask integration hook
├── pages/
│   ├── Register.tsx             # Registration page
│   └── Index.tsx                # Updated with wallet integration
└── App.tsx                      # Updated with /register route

loki/
├── src/main.rs                  # Enhanced with signature verification
├── Cargo.toml                   # Added ethers and hex dependencies
└── migrations/
    └── 20250904110700_add_wallet_address_to_users.sql
```

This system provides a secure, user-friendly wallet-based registration flow with proper cryptographic verification and comprehensive error handling.
