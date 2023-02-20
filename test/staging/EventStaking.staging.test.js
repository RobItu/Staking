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

          describe("Rewards", function () {
              it("Issues rewards after interval has passed on live network", async function () {
                  tx = await staking.enterPool({ value: entranceFee })
                  await tx.wait(1)
                  const originalStakingAmount = await staking.getStakerAmount(deployer)

                  await new Promise(async (resolve, reject) => {
                      staking.once("RewardsDistributed", async () => {
                          console.log("Rewards distributed...")
                          try {
                              setTimeout(async () => {
                                  const newStakingAmount = await staking.getStakerAmount(deployer)
                                  assert(
                                      newStakingAmount.toString(),
                                      originalStakingAmount +
                                          ((originalStakingAmount * percentage) / 100).toString()
                                  )
                                  resolve()
                              }, 15000)
                          } catch (error) {
                              console.log(error)
                              reject(e)
                          }
                      })
                  })
              })
          })
      })
