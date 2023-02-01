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
    console.log(`player balance before funding: ${startingBalance}`)

    for (let i = 0; i < 4; i++) {
        const accountConnected = staking.connect(accounts[i])
        let transactionResponse = await accountConnected.fund({
            value: ethers.utils.parseEther("0.01"),
        })
        let transactionReceipt = await transactionResponse.wait(1)
        let { gasUsed, effectiveGasPrice } = transactionReceipt
        let gasCost = gasUsed.mul(effectiveGasPrice)
        console.log(`Gas used to fund: ${gasCost}`)
    }

    const endingBalance = await accounts[1].getBalance()
    console.log(
        `player balance after funding: ${endingBalance.add(ethers.utils.parseEther("0.01"))}`
    )

    contractBalance = await staking.getContractBalance()
    console.log(`Contract balance: ${contractBalance.toString()}`)

    console.log("Initiating Withdrawal.....")
    console.log("account[1] will withdraw 0.01 ETH only")

    const transactionResponse = await staking
        .connect(accounts[1])
        .withdraw(ethers.utils.parseEther("0.01"))

    const transactionReceipt = await transactionResponse.wait(1)
    const { gasUsed, effectiveGasPrice } = transactionReceipt

    const gasCost = gasUsed.mul(effectiveGasPrice)
    console.log(gasCost.toString())

    const accountBalance = await accounts[1].getBalance()
    finalBalance = accountBalance.add(gasCost)
    console.log(`player balance after withdrawing: ${finalBalance}`)

    contractBalance = await staking.getContractBalance()
    console.log(`Contract balance: ${contractBalance.toString()}`)
}

getNumber()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
