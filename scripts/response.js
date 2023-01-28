const { ethers, getNamedAccounts } = require("hardhat")

async function getNumber() {
    await deployments.fixture(["all"])
    //const { deployer } = await getNamedAccounts()
    const staking = await ethers.getContractFactory("EventStaking")
    const hardhatStaking = await staking.deploy()
    const ethRequirement = await hardhatStaking.getEth()

    console.log(`Got contract EventStaking at ${hardhatStaking.address}`)
    //  await ethRequirement.wait()
    console.log(ethRequirement.toString())
    console.log("Done!")
}

getNumber()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
