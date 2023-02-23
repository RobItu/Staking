const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const blockConfirmations = networkConfig[chainId]["blockConfirmations"]

    const minimumStakingAmount = networkConfig[chainId]["minimumStakingAmount"]
    const interval = networkConfig[chainId]["interval"]
    const endTime = networkConfig[chainId]["endTime"]
    const percentage = networkConfig[chainId]["percentage"]
    const maxCap = networkConfig[chainId]["maxCap"]
    const minimumContractBalance = networkConfig[chainId]["minimumContractBalance"]

    const args = [
        minimumStakingAmount,
        interval,
        endTime,
        percentage,
        maxCap,
        minimumContractBalance,
    ]

    const stakingContract = await deploy("EventStaking", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: blockConfirmations || 1,
        value: ethers.utils.parseEther("0.01"),
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(stakingContract.address, args)
    }
}

module.exports.tags = ["all"]
