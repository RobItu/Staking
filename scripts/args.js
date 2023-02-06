const { assert, expect } = require("chai")
const { parse } = require("dotenv")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

async function getNumber() {
    await deployments.fixture(["all"])
    deployer = (await getNamedAccounts()).deployer
    staking = await ethers.getContract("EventStaking", deployer)
    const accounts = await ethers.getSigners()

    const startingBalance = await accounts[1].getBalance()

    contractBalance = await staking.getContractBalance()
    console.log(`Contract balance: ${contractBalance.toString()}`)
}

getNumber()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
