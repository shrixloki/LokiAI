const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting LokiAI Smart Contracts Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Fee recipient (can be changed later)
  const feeRecipient = deployer.address;

  const deployedContracts = {};
  const deploymentResults = [];

  try {
    // Deploy YieldOptimizer
    console.log("📦 Deploying YieldOptimizer...");
    const YieldOptimizer = await hre.ethers.getContractFactory("YieldOptimizer");
    const yieldOptimizer = await YieldOptimizer.deploy(feeRecipient);
    await yieldOptimizer.waitForDeployment();
    
    const yieldOptimizerAddress = await yieldOptimizer.getAddress();
    deployedContracts.YieldOptimizer = yieldOptimizerAddress;
    
    console.log("✅ YieldOptimizer deployed to:", yieldOptimizerAddress);
    deploymentResults.push({
      name: "YieldOptimizer",
      address: yieldOptimizerAddress,
      txHash: yieldOptimizer.deploymentTransaction().hash
    });

    // Deploy ArbitrageBot
    console.log("\n📦 Deploying ArbitrageBot...");
    const ArbitrageBot = await hre.ethers.getContractFactory("ArbitrageBot");
    const arbitrageBot = await ArbitrageBot.deploy(feeRecipient);
    await arbitrageBot.waitForDeployment();
    
    const arbitrageBotAddress = await arbitrageBot.getAddress();
    deployedContracts.ArbitrageBot = arbitrageBotAddress;
    
    console.log("✅ ArbitrageBot deployed to:", arbitrageBotAddress);
    deploymentResults.push({
      name: "ArbitrageBot",
      address: arbitrageBotAddress,
      txHash: arbitrageBot.deploymentTransaction().hash
    });

    // Deploy RiskManager
    console.log("\n📦 Deploying RiskManager...");
    const RiskManager = await hre.ethers.getContractFactory("RiskManager");
    const riskManager = await RiskManager.deploy(deployer.address); // Emergency manager
    await riskManager.waitForDeployment();
    
    const riskManagerAddress = await riskManager.getAddress();
    deployedContracts.RiskManager = riskManagerAddress;
    
    console.log("✅ RiskManager deployed to:", riskManagerAddress);
    deploymentResults.push({
      name: "RiskManager",
      address: riskManagerAddress,
      txHash: riskManager.deploymentTransaction().hash
    });

    // Deploy PortfolioRebalancer
    console.log("\n📦 Deploying PortfolioRebalancer...");
    const PortfolioRebalancer = await hre.ethers.getContractFactory("PortfolioRebalancer");
    const portfolioRebalancer = await PortfolioRebalancer.deploy(feeRecipient);
    await portfolioRebalancer.waitForDeployment();
    
    const portfolioRebalancerAddress = await portfolioRebalancer.getAddress();
    deployedContracts.PortfolioRebalancer = portfolioRebalancerAddress;
    
    console.log("✅ PortfolioRebalancer deployed to:", portfolioRebalancerAddress);
    deploymentResults.push({
      name: "PortfolioRebalancer",
      address: portfolioRebalancerAddress,
      txHash: portfolioRebalancer.deploymentTransaction().hash
    });

    // Test contract interactions
    console.log("\n🧪 Testing contract interactions...");
    
    // Test YieldOptimizer
    console.log("Testing YieldOptimizer...");
    const yieldTx = await yieldOptimizer.executeOptimization(
      deployer.address,
      "0x1234567890123456789012345678901234567890", // Mock token
      hre.ethers.parseEther("100")
    );
    await yieldTx.wait();
    console.log("✅ YieldOptimizer test successful");

    // Test ArbitrageBot
    console.log("Testing ArbitrageBot...");
    const arbTx = await arbitrageBot.detectOpportunity(
      "0x1234567890123456789012345678901234567890", // Mock tokenA
      "0x0987654321098765432109876543210987654321"  // Mock tokenB
    );
    await arbTx.wait();
    console.log("✅ ArbitrageBot test successful");

    // Test RiskManager
    console.log("Testing RiskManager...");
    const riskTx = await riskManager.evaluateRisk(deployer.address);
    await riskTx.wait();
    console.log("✅ RiskManager test successful");

    // Test PortfolioRebalancer
    console.log("Testing PortfolioRebalancer...");
    // Create a simple allocation for testing
    const allocations = [
      {
        token: "0x1234567890123456789012345678901234567890",
        targetPercentage: 5000, // 50%
        currentPercentage: 0,
        currentValue: 0,
        deviation: 0
      },
      {
        token: "0x0987654321098765432109876543210987654321",
        targetPercentage: 5000, // 50%
        currentPercentage: 0,
        currentValue: 0,
        deviation: 0
      }
    ];
    
    const rebalanceTx = await portfolioRebalancer.createStrategy(
      deployer.address,
      "Test Strategy",
      allocations,
      500, // 5% threshold
      true  // auto-rebalance
    );
    await rebalanceTx.wait();
    console.log("✅ PortfolioRebalancer test successful");

    // Save deployment information
    const deploymentInfo = {
      network: hre.network.name,
      chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      results: deploymentResults
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save to file
    const filename = `deployment-${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    // Also save as latest
    const latestPath = path.join(deploymentsDir, `latest-${hre.network.name}.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n🎉 Deployment Summary:");
    console.log("=".repeat(50));
    console.log(`Network: ${hre.network.name}`);
    console.log(`Chain ID: ${deploymentInfo.chainId}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Timestamp: ${deploymentInfo.timestamp}`);
    console.log("\n📋 Deployed Contracts:");
    
    for (const [name, address] of Object.entries(deployedContracts)) {
      console.log(`${name}: ${address}`);
    }

    console.log(`\n💾 Deployment info saved to: ${filename}`);
    
    // Generate environment variables
    console.log("\n🔧 Environment Variables for Backend Integration:");
    console.log("=".repeat(50));
    console.log(`YIELD_OPTIMIZER_ADDRESS="${deployedContracts.YieldOptimizer}"`);
    console.log(`ARBITRAGE_BOT_ADDRESS="${deployedContracts.ArbitrageBot}"`);
    console.log(`RISK_MANAGER_ADDRESS="${deployedContracts.RiskManager}"`);
    console.log(`PORTFOLIO_REBALANCER_ADDRESS="${deployedContracts.PortfolioRebalancer}"`);
    
    if (hre.network.name === "sepolia") {
      console.log(`SEPOLIA_RPC_URL="${process.env.SEPOLIA_RPC_URL}"`);
      console.log(`SEPOLIA_PRIVATE_KEY="${process.env.SEPOLIA_PRIVATE_KEY}"`);
    }

    console.log("\n🔗 Etherscan Links:");
    console.log("=".repeat(50));
    const explorerBase = hre.network.name === "sepolia" 
      ? "https://sepolia.etherscan.io" 
      : "https://etherscan.io";
    
    for (const [name, address] of Object.entries(deployedContracts)) {
      console.log(`${name}: ${explorerBase}/address/${address}`);
    }

    console.log("\n✅ All contracts deployed and tested successfully!");
    console.log("🚀 Ready for backend integration!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });