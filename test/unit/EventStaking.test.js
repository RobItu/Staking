const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("EventStaking Unit Tests", function () {
          let staking, entranceFee, percentage, endTime, interval
          chainId = network.config.chainId

          beforeEach(async function () {
              await deployments.fixture(["all"])
              deployer = (await getNamedAccounts()).deployer
              staking = await ethers.getContract("EventStaking", deployer)
              entranceFee = await staking.getMinimumStakingAmount()
              interval = await staking.getInterval()
              percentage = await staking.getPercentage()
              endTime = await staking.getEndTime()
          })

          describe("Constructor", function () {
              it("Has correct minimum staking requirement", async function () {
                  const minimumStakingAmount = await staking.getMinimumStakingAmount()
                  assert.equal(
                      minimumStakingAmount.toString(),
                      networkConfig[chainId]["minimumStakingAmount"]
                  )
              })

              it("Sets correct interval", async function () {
                  contractInterval = await staking.getInterval()
                  assert.equal(contractInterval, networkConfig[chainId]["interval"])
              })

              it("Sets correct endStakingTime", async function () {
                  contractEndTime = await staking.getEndTime()
                  assert.equal(contractEndTime, networkConfig[chainId]["endTime"])
              })

              it("Sets Staking state to OPEN", async function () {
                  contractStakingState = await staking.getStakingState()
                  assert.equal(contractStakingState.toString(), "0")
              })

              it("Sets correct starting block number", async function () {
                  contractBlockNumber = await staking.getBlockTime()
                  blockNumBefore = await ethers.provider.getBlockNumber()
                  blockBefore = await ethers.provider.getBlock(blockNumBefore)
                  assert.equal(contractBlockNumber.toString(), blockBefore.timestamp)
              })
              it("Sets rewards percentage correctly", async function () {
                  contractPercentage = await staking.getPercentage()
                  assert.equal(contractPercentage.toString(), networkConfig[chainId]["percentage"])
              })

              it("Sets staking pool's max cap correctly", async function () {
                  contractMaxCap = await staking.getMaxCap()
                  assert.equal(contractMaxCap.toString(), networkConfig[chainId]["maxCap"])
              })
          })

          describe("Enter Staking Pool", function () {
              it("Throws error if entrance amount is too small", async function () {
                  await expect(staking.enterPool()).to.be.revertedWith(
                      "EventStaking_NotEnoughEthEntered"
                  )
              })

              it("Throws error if staking pool is not open", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 3; i++) {
                      await staking.connect(accounts[i]).enterPool({ value: entranceFee })
                  }
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await staking.performUpkeep([])

                  await expect(staking.enterPool({ value: entranceFee })).to.be.revertedWith(
                      "EventStaking_PoolNotOpen"
                  )
              })

              it("Throws error if staking pool is full", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 4; i++) {
                      await staking.connect(accounts[i]).enterPool({ value: entranceFee })
                  }
                  await expect(staking.enterPool({ value: entranceFee })).to.be.revertedWith(
                      "EventStaking_PoolIsFull"
                  )
              })

              it("Records staker when they enter", async function () {
                  await staking.enterPool({ value: entranceFee })
                  const staker = await staking.getStaker(0)
                  assert.equal(staker.toString(), deployer)
              })

              it("Correctly enters contract", async function () {
                  await staking.enterPool({ value: entranceFee })
                  stakerAmount = await staking.getStakerAmount(deployer)
                  assert.equal(
                      stakerAmount.toString(),
                      networkConfig[chainId]["minimumStakingAmount"]
                  )
              })

              //TEST: Event emitted after staker enters
          })
          describe("CheckUpkeep", function () {
              it("returns false if staking pool is close", async function () {
                  await network.provider.send("evm_increaseTime", [endTime.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })
              //TEST: Contract state changes to OPEN when enough time has passed and pool has not ended
              //TEST: Returns false if Staking pool is not OPEN
              //TEST: Returns false if there are no stakers
              //TEST: Returns false if there's insufficient funds
              //TEST: Returns false if not enough time has passed
              //TEST: Returns true if all conditions are met
          })
          describe("Rewards", function () {
              it("Correctly calculates percentage of amount to be awarded", async function () {
                  await staking.enterPool({ value: entranceFee })
                  originalStakingAmount = await staking.getStakerAmount(deployer)
                  await staking.rewards()
                  newStakingAmount = await staking.getStakerAmount(deployer)
                  assert.equal(
                      (
                          ((newStakingAmount - originalStakingAmount) * 100) /
                          originalStakingAmount
                      ).toString(),
                      percentage
                  )
              })

              it("Distributes the rewards to stakers", async function () {
                  await staking.enterPool({ value: entranceFee })
                  originalStakingAmount = await staking.getStakerAmount(deployer)
                  await staking.rewards()
                  newStakingAmount = await staking.getStakerAmount(deployer)
                  assert(
                      newStakingAmount.toString(),
                      originalStakingAmount +
                          ((originalStakingAmount * percentage) / 100).toString()
                  )
              })
          })
          describe("Withdraw", function () {
              beforeEach(async function () {
                  await staking.enterPool({ value: entranceFee })
              })

              it("Withdraws initial amount staked", async function () {
                  accounts = await ethers.getSigners()
                  stakerAccount = staking.connect(accounts[1])
                  await stakerAccount.enterPool({ value: entranceFee })
                  startingBalance = await accounts[1].getBalance()

                  transactionResponse = await stakerAccount.withdraw(entranceFee)
                  transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  endingBalance = await accounts[1].getBalance()

                  assert.equal(
                      startingBalance.add(entranceFee).toString(),
                      endingBalance.add(gasCost).toString()
                  )
              })
              it("Withdraws starting amount and rewards", async function () {
                  accounts = await ethers.getSigners()
                  stakerAccount = staking.connect(accounts[1])
                  await stakerAccount.enterPool({ value: entranceFee })
                  startingAccountBalance = await accounts[1].getBalance()
                  stakerBalance = await stakerAccount.getStakerAmount(accounts[1].address)

                  triggerRewards = staking.connect(accounts[0])
                  transactionResponse0 = await triggerRewards.rewards()

                  stakerBalanceWithRewards = await stakerAccount.getStakerAmount(
                      accounts[1].address
                  )

                  transactionResponse = await stakerAccount.withdraw(stakerBalanceWithRewards)
                  transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  endingAccountBalance = await accounts[1].getBalance()
                  rewardAmount = ((stakerBalance * percentage) / 100).toString()

                  assert.equal(
                      startingAccountBalance.add(entranceFee).add(rewardAmount).toString(),
                      endingAccountBalance.add(gasCost).toString()
                  )
              })
          })
      })
