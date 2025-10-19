// Mock dependencies before importing
jest.mock('../services/blockchain/smart-contracts-service.js', () => ({
    default: {
        executeYieldOptimization: jest.fn().mockResolvedValue({
            success: true,
            txHash: '0x123456789abcdef',
            apy: '450',
            protocol: 'Aave USDC'
        })
    }
}));

jest.mock('../services/blockchain/wallet-service.js', () => ({
    default: {
        getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D0C9964E5Bfe8d4e'),
        getSigner: jest.fn().mockResolvedValue({
            getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D0C9964E5Bfe8d4e'),
            sendTransaction: jest.fn().mockResolvedValue({ hash: '0x123456789abcdef' })
        }),
        getBalance: jest.fn().mockResolvedValue(10000)
    }
}));

jest.mock('../services/blockchain/protocols/defi-integrations.js', () => ({
    default: {
        initialize: jest.fn().mockResolvedValue(true),
        supplyToAave: jest.fn().mockResolvedValue({ hash: '0x123456789abcdef' }),
        withdrawFromAave: jest.fn().mockResolvedValue({ hash: '0x123456789abcdef' }),
        aave: {
            getMarkets: jest.fn().mockResolvedValue([
                { asset: 'USDC', supplyAPY: 0.045 }
            ]),
            getSupplyAPY: jest.fn().mockResolvedValue(0.045),
            getAvailableLiquidity: jest.fn().mockResolvedValue(1000000)
        }
    }
}));

const YieldOptimizerAgentBlockchain = require('../services/agents/yield-optimizer-agent-blockchain.js').default;

describe('YieldOptimizerAgentBlockchain', () => {
    let agent;

    beforeEach(async () => {
        agent = new YieldOptimizerAgentBlockchain();
        await agent.init();
    });

    afterEach(async () => {
        if (agent.isRunning) {
            await agent.stop();
        }
    });

    describe('Initialization', () => {
        it('should initialize with correct default configuration', () => {
            expect(agent.agentId).toBe('yield-optimizer-blockchain');
            expect(agent.name).toBe('Yield Optimizer (Blockchain)');
            expect(agent.config.minYieldThreshold).toBe(0.05);
            expect(agent.config.maxRiskLevel).toBe(0.7);
            expect(agent.config.autoCompound).toBe(true);
        });

        it('should have empty positions initially', () => {
            expect(agent.positions.size).toBe(0);
        });
    });

    describe('Staking Operations', () => {
        it('should validate stake transaction parameters', async () => {
            const opportunity = {
                protocol: 'aave-v3',
                asset: 'USDC',
                apy: 0.03, // Below threshold
                riskScore: 0.5
            };

            await expect(
                agent.validateStakeTransaction(opportunity, 1000)
            ).rejects.toThrow('APY 0.03 below minimum threshold 0.05');
        });

        it('should execute stake transaction successfully', async () => {
            const opportunity = {
                protocol: 'aave-v3',
                asset: 'USDC',
                apy: 0.06,
                riskScore: 0.3,
                liquidity: 1000000
            };

            const txHash = await agent.executeStakeTransaction(opportunity, 1000);
            
            expect(txHash).toBe('0x123456789abcdef');
            expect(agent.positions.size).toBe(1);
            
            const position = Array.from(agent.positions.values())[0];
            expect(position.protocol).toBe('aave-v3');
            expect(position.asset).toBe('USDC');
            expect(position.amount).toBe(1000);
            expect(position.status).toBe('active');
        });

        it('should calculate expected yield correctly', () => {
            const expectedYield = agent.calculateExpectedYield(1000, 0.06);
            
            expect(expectedYield.annual).toBe(60);
            expect(expectedYield.monthly).toBe(5);
            expect(expectedYield.daily).toBeCloseTo(0.164, 3);
            expect(expectedYield.apy).toBe(0.06);
        });
    });

    describe('Unstaking Operations', () => {
        beforeEach(async () => {
            // Create a test position
            const opportunity = {
                protocol: 'aave-v3',
                asset: 'USDC',
                apy: 0.06,
                riskScore: 0.3,
                liquidity: 1000000
            };
            
            await agent.executeStakeTransaction(opportunity, 1000);
        });

        it('should execute unstake transaction successfully', async () => {
            const positionId = Array.from(agent.positions.keys())[0];
            
            const txHash = await agent.executeUnstake(positionId, null, 'manual');
            
            expect(txHash).toBe('0x123456789abcdef');
            
            const position = agent.positions.get(positionId);
            expect(position.status).toBe('closed');
            expect(position.exitReason).toBe('manual');
        });

        it('should validate unstake decision for auto unstaking', async () => {
            const positionId = Array.from(agent.positions.keys())[0];
            const position = agent.positions.get(positionId);
            
            // Mock current yield with loss
            const currentYield = { totalReturn: -0.1 }; // -10% loss
            
            const shouldUnstake = await agent.validateUnstakeDecision(
                position, 
                'performance', 
                currentYield
            );
            
            expect(shouldUnstake).toBe(true);
        });
    });

    describe('Yield Harvesting', () => {
        beforeEach(async () => {
            // Create a test position
            const opportunity = {
                protocol: 'aave-v3',
                asset: 'USDC',
                apy: 0.06,
                riskScore: 0.3,
                liquidity: 1000000
            };
            
            await agent.executeStakeTransaction(opportunity, 1000);
        });

        it('should harvest yield successfully', async () => {
            const positionId = Array.from(agent.positions.keys())[0];
            
            // Mock rewards
            jest.spyOn(agent, 'getPositionRewards').mockResolvedValue({
                amount: 50,
                tokens: ['USDC']
            });
            
            const result = await agent.harvestYield(positionId, false);
            
            expect(result.txHash).toBe('0x123456789abcdef');
            expect(result.rewards.amount).toBe(50);
            expect(result.reinvest).toBe(false);
            
            const position = agent.positions.get(positionId);
            expect(position.totalHarvested).toBe(50);
            expect(position.harvestCount).toBe(1);
        });

        it('should compound rewards successfully', async () => {
            const positionId = Array.from(agent.positions.keys())[0];
            const position = agent.positions.get(positionId);
            
            const rewards = { amount: 25, tokens: ['USDC'] };
            
            await agent.executeCompound(position, rewards);
            
            expect(position.totalCompounded).toBe(25);
            expect(position.compoundCount).toBe(1);
            expect(agent.totalYieldEarned).toBe(25);
        });
    });

    describe('Performance Tracking', () => {
        it('should capture performance snapshot', async () => {
            // Create test positions
            const opportunity = {
                protocol: 'aave-v3',
                asset: 'USDC',
                apy: 0.06,
                riskScore: 0.3,
                liquidity: 1000000
            };
            
            await agent.executeStakeTransaction(opportunity, 1000);
            
            // Mock position current value
            jest.spyOn(agent, 'getPositionCurrentValue').mockResolvedValue(1050);
            
            const snapshot = await agent.capturePerformanceSnapshot();
            
            expect(snapshot).toBeDefined();
            expect(snapshot.portfolio.totalPositions).toBe(1);
            expect(snapshot.portfolio.totalInitialValue).toBe(1000);
            expect(snapshot.portfolio.totalCurrentValue).toBe(1050);
            expect(snapshot.portfolio.totalReturn).toBe(0.05);
        });

        it('should get agent metrics', async () => {
            const metrics = await agent.getAgentMetrics();
            
            expect(metrics.agent.id).toBe('yield-optimizer-blockchain');
            expect(metrics.positions.total).toBe(0);
            expect(metrics.performance.totalYieldEarned).toBe(0);
            expect(metrics.config).toBeDefined();
        });
    });

    describe('Automated Operations', () => {
        it('should start and stop successfully', async () => {
            expect(agent.isRunning).toBe(false);
            
            await agent.start();
            expect(agent.isRunning).toBe(true);
            expect(agent.isActive).toBe(true);
            
            await agent.stop();
            expect(agent.isRunning).toBe(false);
            expect(agent.isActive).toBe(false);
        });

        it('should check automated unstaking conditions', async () => {
            // Create a position with high risk
            const opportunity = {
                protocol: 'aave-v3',
                asset: 'USDC',
                apy: 0.06,
                riskScore: 0.3,
                liquidity: 1000000
            };
            
            await agent.executeStakeTransaction(opportunity, 1000);
            
            // Mock high risk assessment
            jest.spyOn(agent, 'assessPositionRisk').mockResolvedValue(0.8); // Above max risk
            jest.spyOn(agent, 'executeUnstake').mockResolvedValue('0x123456789abcdef');
            
            await agent.checkAutomatedUnstaking();
            
            expect(agent.executeUnstake).toHaveBeenCalledWith(
                expect.any(String),
                null,
                'risk'
            );
        });
    });

    describe('Manual Operations', () => {
        it('should execute manual stake', async () => {
            const txHash = await agent.manualStake('aave-v3', 'USDC', 1000, {
                expectedAPY: 0.06,
                riskScore: 0.3
            });
            
            expect(txHash).toBe('0x123456789abcdef');
            expect(agent.positions.size).toBe(1);
        });

        it('should get position details', async () => {
            // Create a position first
            await agent.manualStake('aave-v3', 'USDC', 1000, {
                expectedAPY: 0.06,
                riskScore: 0.3
            });
            
            const positionId = Array.from(agent.positions.keys())[0];
            
            // Mock methods
            jest.spyOn(agent, 'calculatePositionYield').mockResolvedValue({
                totalReturn: 0.05,
                annualizedReturn: 0.06,
                timeHeld: 30,
                profit: 50
            });
            jest.spyOn(agent, 'assessPositionRisk').mockResolvedValue(0.3);
            jest.spyOn(agent, 'getPositionRewards').mockResolvedValue({
                amount: 10,
                tokens: ['USDC']
            });
            
            const details = await agent.getPositionDetails(positionId);
            
            expect(details.performance.roi).toBe(5);
            expect(details.performance.annualizedReturn).toBe(6);
            expect(details.currentRisk).toBe(0.3);
            expect(details.availableRewards.amount).toBe(10);
        });
    });

    describe('Error Handling', () => {
        it('should handle stake validation errors', async () => {
            const opportunity = {
                protocol: 'aave-v3',
                asset: 'USDC',
                apy: 0.02, // Below threshold
                riskScore: 0.3
            };

            await expect(
                agent.executeStakeTransaction(opportunity, 1000)
            ).rejects.toThrow('APY 0.02 below minimum threshold 0.05');
        });

        it('should handle position not found errors', async () => {
            await expect(
                agent.executeUnstake('non-existent-id')
            ).rejects.toThrow('Position non-existent-id not found');
        });

        it('should handle harvest with no rewards', async () => {
            // Create a position first
            await agent.manualStake('aave-v3', 'USDC', 1000, {
                expectedAPY: 0.06,
                riskScore: 0.3
            });
            
            const positionId = Array.from(agent.positions.keys())[0];
            
            // Mock no rewards
            jest.spyOn(agent, 'getPositionRewards').mockResolvedValue({
                amount: 0,
                tokens: []
            });
            
            const result = await agent.harvestYield(positionId);
            expect(result).toBeNull();
        });
    });
});