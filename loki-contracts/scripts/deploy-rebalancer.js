const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PortfolioRebalancer...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy PortfolioRebalancer with lower gas settings
  const PortfolioRebalancer = await hre.ethers.getContractFactory("PortfolioRebalancer");
  
  const portfolioRebalancer = await PortfolioRebalancer.deploy(deployer.address, {
    gasLimit: 2000000,  // Lower gas limit
    gasPrice: hre.ethers.parseUnits("10", "gwei")  // Lower gas price
  });
  
  await portfolioRebalancer.waitForDeployment();
  
  const portfolioRebalancerAddress = await portfolioRebalancer.getAddress();
  console.log("✅ PortfolioRebalancer deployed to:", portfolioRebalancerAddress);

  // Test the contract
  console.log("🧪 Testing contract...");
  const stats = await portfolioRebalancer.getStats();
  console.log("✅ Contract test successful");

  console.log("\n🎉 Deployment Complete!");
  console.log("PortfolioRebalancer:", portfolioRebalancerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });