import React, { useState, useEffect } from "react";
import MetaMaskConnect from "@/components/MetaMaskConnect";
import MetaMaskTest from "@/components/MetaMaskTest";

// --- UserManagement component ---
interface User {
  id: number;
  name: string;
  email: string;
  wallet_address?: string | null;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletVerified, setIsWalletVerified] = useState(false);

  const handleWalletConnect = (address: string) => {
    console.log('🔍 Wallet connected in UserManagement:', address);
    setWalletAddress(address);
    setIsWalletVerified(false); // Reset verification status on new connection
    setMessage(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
  };

  const handleWalletDisconnect = () => {
    console.log('🔍 Wallet disconnected in UserManagement');
    setWalletAddress(null);
    setIsWalletVerified(false);
    setMessage("Wallet disconnected");
  };

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setMessage("Failed to fetch users: " + (err as Error).message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add new user handler
  const addUser = async () => {
    setMessage("");
    try {
      const payload: any = { name, email };
      if (walletAddress) {
        payload.walletAddress = walletAddress;
      }

      const response = await fetch("http://127.0.0.1:5000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage("User added successfully!");
        setName("");
        setEmail("");
        fetchUsers(); // Refresh list
      } else {
        const errorText = await response.text();
        setMessage("Failed to add user: " + errorText);
      }
    } catch (err) {
      setMessage("Error: " + (err as Error).message);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ color: "#374151", marginBottom: 30 }}>User Management System</h1>

      {/* MetaMask Debug Test */}
      <MetaMaskTest />

      {/* MetaMask connection UI */}
      <div style={{ marginBottom: 30 }}>
        <MetaMaskConnect 
          onConnect={handleWalletConnect} 
          onDisconnect={handleWalletDisconnect}
        />
      </div>

      {/* User Registration Form */}
      <div style={{ 
        marginBottom: 30, 
        padding: 20, 
        border: "1px solid #e5e7eb", 
        borderRadius: 8, 
        backgroundColor: "#ffffff" 
      }}>
        <h2 style={{ color: "#374151", marginTop: 0 }}>Register New User</h2>
        
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ 
              padding: "10px 12px", 
              border: "1px solid #d1d5db", 
              borderRadius: 4,
              minWidth: 200,
              fontSize: "14px"
            }}
          />
          <input
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              padding: "10px 12px", 
              border: "1px solid #d1d5db", 
              borderRadius: 4,
              minWidth: 200,
              fontSize: "14px"
            }}
          />
          <button 
            onClick={addUser}
            disabled={!name || !email}
            style={{
              padding: "10px 20px",
              backgroundColor: (!name || !email) ? "#d1d5db" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: (!name || !email) ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            Register User
          </button>
        </div>

        {walletAddress && (
          <div style={{ 
            padding: 12, 
            backgroundColor: "#f0fdf4", 
            border: "1px solid #bbf7d0", 
            borderRadius: 4,
            marginBottom: 16
          }}>
            <p style={{ margin: 0, color: "#166534", fontSize: "14px" }}>
              💡 Your wallet will be automatically linked to the new user account
            </p>
          </div>
        )}

        {message && (
          <div style={{ 
            padding: 12, 
            backgroundColor: message.includes("successfully") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.includes("successfully") ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 4,
            marginTop: 12
          }}>
            <p style={{ 
              margin: 0, 
              color: message.includes("successfully") ? "#166534" : "#dc2626",
              fontSize: "14px"
            }}>
              {message}
            </p>
          </div>
        )}
      </div>

      {/* Users List */}
      <div style={{ 
        padding: 20, 
        border: "1px solid #e5e7eb", 
        borderRadius: 8, 
        backgroundColor: "#ffffff" 
      }}>
        <h2 style={{ color: "#374151", marginTop: 0 }}>Registered Users</h2>
        
        {users.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: 40, 
            color: "#6b7280",
            backgroundColor: "#f9fafb",
            borderRadius: 4,
            border: "1px dashed #d1d5db"
          }}>
            <p style={{ margin: 0, fontSize: "16px" }}>No users registered yet</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>Register the first user above to get started</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {users.map((user) => (
              <div 
                key={user.id}
                style={{
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  backgroundColor: "#f9fafb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 4px 0", color: "#374151", fontSize: "16px" }}>
                    {user.name}
                  </h3>
                  <p style={{ margin: "0 0 4px 0", color: "#6b7280", fontSize: "14px" }}>
                    📧 {user.email}
                  </p>
                  {user.wallet_address ? (
                    <p style={{ margin: 0, color: "#059669", fontSize: "14px", fontFamily: "monospace" }}>
                      🔗 {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </p>
                  ) : (
                    <p style={{ margin: 0, color: "#9ca3af", fontSize: "14px" }}>
                      No wallet linked
                    </p>
                  )}
                </div>
                
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  ID: {user.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
