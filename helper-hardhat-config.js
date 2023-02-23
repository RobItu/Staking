const { ethers } = require("hardhat")

//Define network - addresses configurations
const networkConfig = {
    5: {
        name: "goerli",
        minimumStakingAmount: ethers.utils.parseEther("0.01"),
        interval: 30,
        endTime: 60,
        percentage: 5,
        maxCap: ethers.utils.parseEther("0.03"),
        minimumContractBalance: ethers.utils.parseEther("0.0005"),
        blockConfirmations: 5,
    },
    31337: {
        name: "hardhat",
        minimumStakingAmount: ethers.utils.parseEther("0.01"),
        percentage: 5,
        interval: 30,
        endTime: 60,
        maxCap: ethers.utils.parseEther("0.03"),
        minimumContractBalance: ethers.utils.parseEther("0.0005"),
        blockConfirmations: 1,
    },
}

const developmentChains = ["hardhat", "localhost", 31337]

module.exports = {
    networkConfig,
    developmentChains,
}
