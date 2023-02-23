const { ethers, getNamedAccounts } = require("hardhat")

async function fund() {
    deployer = (await getNamedAccounts()).deployer
    staking = await ethers.getContract("EventStaking", deployer)
    await staking.enterPool({ value: ethers.utils.parseEther("0.01") })
}

fund()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
