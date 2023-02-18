const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("EventStaking Staging Tests", function () {
          let staking, entranceFee, percentage, endTime, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              staking = await ethers.getContract("EventStaking", deployer)
              entranceFee = await staking.getMinimumStakingAmount()
              interval = await staking.getInterval()
              percentage = await staking.getPercentage()
              endTime = await staking.getEndTime()
          })

          describe("")
      })
