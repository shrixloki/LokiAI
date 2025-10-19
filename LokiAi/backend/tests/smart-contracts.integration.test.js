// Integration tests for smart contract interactions
import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import { ContractManager } from '../services/blockchain/contracts/contract-manager.js';
import { TransactionService } from '../services/blockchain/transaction-service.js';
import { ConnectionManager } from '../services/blockchain/connection-manager.js';

describe('Smart Contract Integration Tests', () => {
  let contractManager;
  let transactionService;
  let connectionManager;
  let mockProvider;
  let mockSigner;

  beforeEach(() => {
    // Create mock provider and signer
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'mainnet' }),
      getBlockNumber: jest.fn().mockResolvedValue(18000000),
      getGasPrice: jest.fn().mockResolvedValue(ethers.parseUnits('20', 'gwei')),
      estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
      getBalance: jest.fn().mockResolvedValue(ethers.parseEther('1.0')),
      call: jest.fn(),
      send: jest.fn()
    };

    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6'),
      signTransaction: jest.fn(),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: global.testUtils.createMockTxHash(),
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: BigInt(21000),
          effectiveGasPrice: ethers.parseUnits('20', 'gwei')
        })
      }),
      provider: mockProvider
    };

    connectionManager = new ConnectionManager();
    connectionManager.getProvider = jest.fn().mockReturnValue(mockProvider);
    connectionManager.getSigner = jest.fn().mockReturnValue(mockSigner);

    contractManager = new ContractManager(connectionManager);
    transactionService = new TransactionService(connectionManager);
  });

  describe('Contract Deployment and Interaction', () => {
    test('should deploy and interact with ERC20 token contract', async () => {
      // Mock contract deployment
      const mockContract = {
        target: '0x' + '1'.repeat(40),
        name: jest.fn().mockResolvedValue('Test Token'),
        symbol: jest.fn().mockResolvedValue('TEST'),
        decimals: jest.fn().mockResolvedValue(18),
        totalSupply: jest.fn().mockResolvedValue(ethers.parseEther('1000000')),
        balanceOf: jest.fn().mockResolvedValue(ethers.parseEther('1000')),
        transfer: jest.fn().mockResolvedValue({
          hash: global.testUtils.createMockTxHash(),
          wait: jest.fn().mockResolvedValue({ status: 1 })
        })
      };

      contractManager.getContract = jest.fn().mockReturnValue(mockContract);

      // Test contract interaction
      const contract = contractManager.getContract('ERC20', mockContract.target);
      
      const name = await contract.name();
      expect(name).toBe('Test Token');

      const balance = await contract.balanceOf(await mockSigner.getAddress());
      expect(balance).toBe(ethers.parseEther('1000'));

      // Test transaction execution
      const transferTx = await contract.transfer(
        '0x' + '2'.repeat(40),
        ethers.parseEther('100')
      );
      expect(transferTx.hash).toBeDefined();
    });

    test('should interact with Uniswap V2 router contract', async () => {
      const mockUniswapRouter = {
        target: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        getAmountsOut: jest.fn().mockResolvedValue([
          ethers.parseEther('1'),
          ethers.parseUnits('2000', 6) // 2000 USDC
        ]),
        swapExactTokensForTokens: jest.fn().mockResolvedValue({
          hash: global.testUtils.createMockTxHash(),
          wait: jest.fn().mockResolvedValue({ status: 1 })
        }),
        WETH: jest.fn().mockResolvedValue('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
      };

      contractManager.getContract = jest.fn().mockReturnValue(mockUniswapRouter);

      const router = contractManager.getContract('UniswapV2Router', mockUniswapRouter.target);
      
      // Test price quote
      const amounts = await router.getAmountsOut(
        ethers.parseEther('1'),
        ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xA0b86a33E6441c8C06DD2b7c94b7E0e8c0c8c8c8']
      );
      expect(amounts[1]).toBe(ethers.parseUnits('2000', 6));

      // Test swap execution
      const swapTx = await router.swapExactTokensForTokens(
        ethers.parseEther('1'),
        ethers.parseUnits('1900', 6), // Min amount out with slippage
        ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xA0b86a33E6441c8C06DD2b7c94b7E0e8c0c8c8c8'],
        await mockSigner.getAddress(),
        Math.floor(Date.now() / 1000) + 1800 // 30 minutes deadline
      );
      expect(swapTx.hash).toBeDefined();
    });

    test('should interact with Aave lending pool contract', async () => {
      const mockAaveLendingPool = {
        target: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
        deposit: jest.fn().mockResolvedValue({
          hash: global.testUtils.createMockTxHash(),
          wait: jest.fn().mockResolvedValue({ status: 1 })
        }),
        withdraw: jest.fn().mockResolvedValue({
          hash: global.testUtils.createMockTxHash(),
          wait: jest.fn().mockResolvedValue({ status: 1 })
        }),
        getUserAccountData: jest.fn().mockResolvedValue({
          totalCollateralETH: ethers.parseEther('10'),
          totalDebtETH: ethers.parseEther('5'),
          availableBorrowsETH: ethers.parseEther('4'),
          currentLiquidationThreshold: 8500,
          ltv: 7500,
          healthFactor: ethers.parseEther('1.7')
        })
      };

      contractManager.getContract = jest.fn().mockReturnValue(mockAaveLendingPool);

      const lendingPool = contractManager.getContract('AaveLendingPool', mockAaveLendingPool.target);
      
      // Test deposit
      const depositTx = await lendingPool.deposit(
        '0xA0b86a33E6441c8C06DD2b7c94b7E0e8c0c8c8c8', // Asset
        ethers.parseEther('1'), // Amount
        await mockSigner.getAddress(), // On behalf of
        0 // Referral code
      );
      expect(depositTx.hash).toBeDefined();

      // Test account data retrieval
      const accountData = await lendingPool.getUserAccountData(await mockSigner.getAddress());
      expect(accountData.totalCollateralETH).toBe(ethers.parseEther('10'));
      expect(accountData.healthFactor).toBe(ethers.parseEther('1.7'));
    });
  });

  describe('Transaction Execution and Confirmation', () => {
    test('should execute transaction with proper gas estimation', async () => {
      const mockTxRequest = {
        to: '0x' + '1'.repeat(40),
        value: ethers.parseEther('0.1'),
        data: '0x'
      };

      // Test gas estimation
      mockProvider.estimateGas.mockResolvedValue(BigInt(21000));
      
      const gasEstimate = await transactionService.estimateGas(mockTxRequest);
      expect(gasEstimate).toBe(BigInt(21000));

      // Test transaction execution
      const txResponse = await transactionService.sendTransaction(mockTxRequest);
      expect(txResponse.hash).toBeDefined();

      // Test transaction confirmation
      const receipt = await txResponse.wait();
      expect(receipt.status).toBe(1);
    });

    test('should handle transaction failures gracefully', async () => {
      const mockTxRequest = {
        to: '0x' + '1'.repeat(40),
        value: ethers.parseEther('100'), // More than balance
        data: '0x'
      };

      // Mock transaction failure
      mockSigner.sendTransaction.mockRejectedValue(new Error('Insufficient funds'));

      await expect(transactionService.sendTransaction(mockTxRequest))
        .rejects.toThrow('Insufficient funds');
    });

    test('should retry failed transactions with higher gas price', async () => {
      const mockTxRequest = {
        to: '0x' + '1'.repeat(40),
        value: ethers.parseEther('0.1'),
        data: '0x'
      };

      // Mock first attempt failure, second attempt success
      mockSigner.sendTransaction
        .mockRejectedValueOnce(new Error('Transaction underpriced'))
        .mockResolvedValueOnce({
          hash: global.testUtils.createMockTxHash(),
          wait: jest.fn().mockResolvedValue({ status: 1 })
        });

      const txResponse = await transactionService.sendTransactionWithRetry(mockTxRequest);
      expect(txResponse.hash).toBeDefined();
      expect(mockSigner.sendTransaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Contract Event Monitoring', () => {
    test('should listen to and parse contract events', async () => {
      const mockContract = {
        target: '0x' + '1'.repeat(40),
        on: jest.fn(),
        off: jest.fn(),
        queryFilter: jest.fn().mockResolvedValue([
          {
            event: 'Transfer',
            args: {
              from: '0x' + '1'.repeat(40),
              to: '0x' + '2'.repeat(40),
              value: ethers.parseEther('100')
            },
            blockNumber: 18000000,
            transactionHash: global.testUtils.createMockTxHash()
          }
        ])
      };

      contractManager.getContract = jest.fn().mockReturnValue(mockContract);

      const contract = contractManager.getContract('ERC20', mockContract.target);
      
      // Test event listener setup
      const eventCallback = jest.fn();
      contract.on('Transfer', eventCallback);
      expect(contract.on).toHaveBeenCalledWith('Transfer', eventCallback);

      // Test historical event querying
      const events = await contract.queryFilter('Transfer', 17999000, 18000000);
      expect(events).toHaveLength(1);
      expect(events[0].args.value).toBe(ethers.parseEther('100'));
    });

    test('should handle event parsing errors gracefully', async () => {
      const mockContract = {
        target: '0x' + '1'.repeat(40),
        queryFilter: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      contractManager.getContract = jest.fn().mockReturnValue(mockContract);

      const contract = contractManager.getContract('ERC20', mockContract.target);
      
      await expect(contract.queryFilter('Transfer', 17999000, 18000000))
        .rejects.toThrow('Network error');
    });
  });

  describe('Multi-chain Contract Interactions', () => {
    test('should switch networks and interact with contracts on different chains', async () => {
      // Mock Polygon network
      const polygonProvider = {
        getNetwork: jest.fn().mockResolvedValue({ chainId: 137, name: 'matic' }),
        getBlockNumber: jest.fn().mockResolvedValue(50000000)
      };

      connectionManager.switchNetwork = jest.fn().mockResolvedValue(polygonProvider);
      
      // Switch to Polygon
      await connectionManager.switchNetwork('polygon');
      expect(connectionManager.switchNetwork).toHaveBeenCalledWith('polygon');

      // Mock contract on Polygon
      const polygonContract = {
        target: '0x' + '3'.repeat(40),
        name: jest.fn().mockResolvedValue('Polygon Token'),
        balanceOf: jest.fn().mockResolvedValue(ethers.parseEther('500'))
      };

      contractManager.getContract = jest.fn().mockReturnValue(polygonContract);

      const contract = contractManager.getContract('ERC20', polygonContract.target);
      const balance = await contract.balanceOf(await mockSigner.getAddress());
      expect(balance).toBe(ethers.parseEther('500'));
    });
  });
});