const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const minimumStakingAmount = networkConfig[chainId]["minimumStakingAmount"]
    const interval = networkConfig[chainId]["interval"]
    const endTime = networkConfig[chainId]["endTime"]
    const percentage = networkConfig[chainId]["percentage"]
    const maxCap = networkConfig[chainId]["maxCap"]

    const args = [minimumStakingAmount, interval, endTime, percentage, maxCap]

    const testHelper = await deploy("TestHelper", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1,
        //value: ethers.utils.parseEther("3"),
    })
}

module.exports.tags = ["test"]
