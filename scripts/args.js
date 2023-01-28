const { assert, expect } = require("chai")
const { parse } = require("dotenv")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

async function getNumber() {
    await deployments.fixture(["all"])
    deployer = (await getNamedAccounts()).deployer
    staking = await ethers.getContract("EventStaking", deployer)

    fundContract = await staking.fund({ value: ethers.utils.parseEther("0.01") })
    console.log("funding....")
    stakerAmount = await staking.getStakerAmount(deployer)
    console.log(`Staker amount: ${stakerAmount.toString()}`)

    issueRewards = await staking.rewards()
    console.log("issuing rewards...")
    newStakerAmount = await staking.getStakerAmount(deployer)
    console.log(`New Staker amount: ${newStakerAmount.toString()}`)

    console.log("Done!")
}

getNumber()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
