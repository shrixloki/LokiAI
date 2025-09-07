import React, { useEffect } from "react";
import { useMetaMask } from "@/hooks/useMetaMask";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface MetaMaskConnectProps {
  onConnect: (address: string) => void;
  onDisconnect?: () => void;
}

const MetaMaskConnect: React.FC<MetaMaskConnectProps> = ({ onConnect, onDisconnect }) => {
  const {
    isConnected,
    account,
    chainId,
    networkName,
    balance,
    isInstalled,
    isConnecting,
    isVerifying,
    error,
    connect,
    disconnect,
    signChallenge,
    switchToMainnet,
  } = useMetaMask();

  // Call onConnect when account changes
  useEffect(() => {
    if (account && isConnected) {
      onConnect(account);
    } else if (!isConnected && onDisconnect) {
      onDisconnect();
    }
  }, [account, isConnected, onConnect, onDisconnect]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleVerifyWallet = async () => {
    if (!account) return;
    await signChallenge();
  };

  const testMetaMaskConnection = () => {
    console.log("🔧 Testing MetaMask connection...");
    const ethAny = (window as any).ethereum;
    
    if (!ethAny) {
      alert("❌ window.ethereum is not available. MetaMask may not be installed or enabled.");
      return;
    }
    
    console.log("✅ window.ethereum found:", ethAny);
    
    if (ethAny.isMetaMask) {
      alert("✅ MetaMask detected directly on window.ethereum");
    } else if (ethAny.providers) {
      const metamaskProvider = ethAny.providers.find((p: any) => p.isMetaMask);
      if (metamaskProvider) {
        alert("✅ MetaMask found in providers array");
      } else {
        alert("❌ MetaMask not found in providers array");
      }
    } else {
      alert("❌ MetaMask not detected. Check if extension is enabled.");
    }
  };

  if (!isInstalled) {
    return (
      <div style={{ padding: "16px", border: "2px dashed #f59e0b", borderRadius: "8px", backgroundColor: "#fef3c7" }}>
        <h3 style={{ color: "#92400e", marginTop: 0 }}>MetaMask Not Detected</h3>
        <p style={{ color: "#b45309", marginBottom: "12px" }}>
          MetaMask is required to connect your wallet. Please install it to continue.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noreferrer"
            style={{ 
              color: "#2563eb", 
              textDecoration: "none",
              padding: "8px 16px",
              backgroundColor: "#dbeafe",
              borderRadius: "4px",
              border: "1px solid #3b82f6"
            }}
          >
            Install MetaMask
          </a>
          <button 
            onClick={testMetaMaskConnection} 
            style={{ 
              opacity: 0.7, 
              padding: "8px 12px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            🔧 Test Detection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
      <h3 style={{ marginTop: 0, color: "#374151" }}>MetaMask Wallet</h3>
      
      {isConnected && account ? (
        <div>
          <div style={{ marginBottom: "12px" }}>
            <p style={{ color: "#059669", fontWeight: "bold", margin: "4px 0" }}>
              ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
            {networkName && (
              <p style={{ color: "#6b7280", fontSize: "0.9em", margin: "4px 0" }}>
                Network: {networkName}
              </p>
            )}
            {balance && (
              <p style={{ color: "#6b7280", fontSize: "0.9em", margin: "4px 0" }}>
                Balance: {balance} ETH
              </p>
            )}
          </div>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button 
              onClick={handleVerifyWallet} 
              disabled={isVerifying}
              style={{
                padding: "8px 16px",
                backgroundColor: isVerifying ? "#d1d5db" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isVerifying ? "not-allowed" : "pointer"
              }}
            >
              {isVerifying ? "Verifying..." : "Verify Wallet"}
            </button>
            
            {chainId !== "0x1" && (
              <button 
                onClick={switchToMainnet}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Switch to Mainnet
              </button>
            )}
            
            <button 
              onClick={handleDisconnect}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: "#6b7280", marginBottom: "12px" }}>
            Connect your MetaMask wallet to continue
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button 
              onClick={handleConnect} 
              disabled={isConnecting}
              style={{
                padding: "12px 24px",
                backgroundColor: isConnecting ? "#d1d5db" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isConnecting ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
            
            <button 
              onClick={testMetaMaskConnection} 
              style={{ 
                opacity: 0.7, 
                fontSize: "0.9em",
                padding: "8px 12px",
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              🔧 Test MetaMask
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: "12px", 
          padding: "12px", 
          backgroundColor: "#fef2f2", 
          border: "1px solid #fecaca", 
          borderRadius: "4px" 
        }}>
          <p style={{ color: "#dc2626", margin: "0 0 8px 0", fontWeight: "bold" }}>
            ❌ {error}
          </p>
          {error.includes("pending") && (
            <p style={{ color: "#b45309", fontSize: "0.9em", margin: 0 }}>
              💡 Tip: Click the MetaMask extension icon in your browser toolbar to view and approve the request.
            </p>
          )}
          {error.includes("rejected") && (
            <p style={{ color: "#b45309", fontSize: "0.9em", margin: 0 }}>
              💡 Tip: Please approve the connection request in MetaMask to continue.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MetaMaskConnect;
