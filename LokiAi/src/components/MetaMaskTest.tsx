import React, { useState } from 'react';

const MetaMaskTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [account, setAccount] = useState<string | null>(null);

  const testBasicConnection = async () => {
    setStatus('Testing MetaMask connection...');
    
    try {
      // Check if window.ethereum exists
      if (typeof window.ethereum === 'undefined') {
        setStatus('❌ window.ethereum is undefined - MetaMask not installed');
        return;
      }

      console.log('✅ window.ethereum found:', window.ethereum);
      setStatus('✅ window.ethereum found');

      // Check if it's MetaMask
      if (window.ethereum.isMetaMask) {
        setStatus('✅ MetaMask detected directly');
      } else if (window.ethereum.providers) {
        const metamaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask);
        if (metamaskProvider) {
          setStatus('✅ MetaMask found in providers array');
        } else {
          setStatus('❌ MetaMask not found in providers');
          return;
        }
      } else {
        setStatus('❌ MetaMask not detected');
        return;
      }

      // Try to connect
      setStatus('🔍 Requesting accounts...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setStatus(`✅ Connected: ${accounts[0]}`);
      } else {
        setStatus('❌ No accounts returned');
      }

    } catch (error: any) {
      console.error('Connection error:', error);
      setStatus(`❌ Error: ${error.message || error.code || 'Unknown error'}`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #3b82f6', 
      borderRadius: '8px', 
      backgroundColor: '#f0f9ff',
      margin: '20px 0'
    }}>
      <h3>MetaMask Connection Test</h3>
      <p><strong>Status:</strong> {status}</p>
      {account && <p><strong>Account:</strong> {account}</p>}
      
      <button 
        onClick={testBasicConnection}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Test MetaMask Connection
      </button>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#6b7280' }}>
        <p>This test will:</p>
        <ul>
          <li>Check if MetaMask is installed</li>
          <li>Attempt to connect to MetaMask</li>
          <li>Show detailed error messages</li>
        </ul>
      </div>
    </div>
  );
};

export default MetaMaskTest;
