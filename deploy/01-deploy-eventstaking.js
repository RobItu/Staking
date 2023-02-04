const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    minimumStakingAmount = networkConfig[chainId]["minimumStakingAmount"]
    interval = networkConfig[chainId]["interval"]
    endTime = networkConfig[chainId]["endTime"]

    args = [minimumStakingAmount, interval, endTime]

    stakingContract = await deploy("EventStaking", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1,
    })
}

module.exports.tags = ["all"]
