const { ethers } = require("hardhat")

//Define network - addresses configurations
const networkConfig = {
    5: {
        name: "goerli",
        entranceFee: ethers.utils.parseEther("0.01"),
        interval: "30",
        endTime: "60",
    },
    31337: {
        name: "hardhat",
        minimumStakingAmount: ethers.utils.parseEther("0.01"),
        percentage: 5,
        interval: "30",
        endTime: "60",
    },
}

const developmentChains = ["hardhat", "localhost", 31337]

module.exports = {
    networkConfig,
    developmentChains,
}
