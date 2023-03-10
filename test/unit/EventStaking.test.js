const { latest } = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time")
const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("EventStaking Unit Tests", function () {
          let staking, entranceFee, percentage, endTime, interval
          const chainId = network.config.chainId

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
                  const contractInterval = await staking.getInterval()
                  assert.equal(contractInterval, networkConfig[chainId]["interval"])
              })

              it("Sets correct endTime", async function () {
                  const contractEndTime = await staking.getEndTime()
                  assert.equal(contractEndTime, networkConfig[chainId]["endTime"])
              })

              it("Sets Staking state to OPEN", async function () {
                  const contractStakingState = await staking.getStakingState()
                  assert.equal(contractStakingState.toString(), "0")
              })

              it("Sets correct starting block number", async function () {
                  const contractBlockNumber = await staking.getLatestTimestamp()
                  const blockNumBefore = await ethers.provider.getBlockNumber()
                  const blockBefore = await ethers.provider.getBlock(blockNumBefore)
                  assert.equal(contractBlockNumber.toString(), blockBefore.timestamp)
              })
              it("Sets rewards percentage correctly", async function () {
                  const contractPercentage = await staking.getPercentage()
                  assert.equal(contractPercentage.toString(), networkConfig[chainId]["percentage"])
              })

              it("Sets staking pool's max cap correctly", async function () {
                  const contractMaxCap = await staking.getMaxCap()
                  assert.equal(contractMaxCap.toString(), networkConfig[chainId]["maxCap"])
              })
          })

          describe("Enter Staking Pool", function () {
              it("Throws error if entrance amount is too small", async function () {
                  await expect(staking.enterPool()).to.be.revertedWith(
                      "EventStaking__NotEnoughEthEntered"
                  )
              })

              it("Throws error if staking pool is not open", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 0; i < 1; i++) {
                      await staking.connect(accounts[i]).enterPool({ value: entranceFee })
                  }
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await staking.performUpkeep([])

                  await expect(staking.enterPool({ value: entranceFee })).to.be.revertedWith(
                      "EventStaking__PoolNotOpen"
                  )
              })

              it("Throws error if staking pool is full", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 3; i++) {
                      await staking.connect(accounts[i]).enterPool({ value: entranceFee })
                  }
                  await expect(staking.enterPool({ value: entranceFee })).to.be.revertedWith(
                      "EventStaking__PoolIsFull"
                  )
              })

              it("Records staker when they enter", async function () {
                  await staking.enterPool({ value: entranceFee })
                  const staker = await staking.getStaker(0)
                  assert.equal(staker.toString(), deployer)
              })

              it("Contract receives correct amount upon entry", async function () {
                  await staking.enterPool({ value: entranceFee })
                  const stakerAmount = await staking.getStakerAmount(deployer)
                  assert.equal(
                      stakerAmount.toString(),
                      networkConfig[chainId]["minimumStakingAmount"]
                  )
              })

              it("Emits event after staker enters pool", async function () {
                  await expect(staking.enterPool({ value: entranceFee })).to.emit(
                      staking,
                      "StakingEnter"
                  )
              })
          })
          describe("CheckUpkeep", function () {
              it("returns false if staking pool is not open", async function () {
                  await network.provider.send("evm_increaseTime", [endTime.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })
              it("contract state changes to OPEN when pool is full and pool has not ended", async function () {
                  const accounts = await ethers.getSigners()
                  let initialStakingState = await staking.getStakingState()
                  assert.equal(initialStakingState.toString(), "0")

                  for (i = 1; i < 3; i++) {
                      await staking.connect(accounts[i]).enterPool({ value: entranceFee })
                  }
                  const preUpkeepStakingState = await staking.getStakingState()
                  assert.equal(preUpkeepStakingState.toString(), "1")

                  await network.provider.send("evm_increaseTime", [endTime.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await staking.checkUpkeep("0x")
                  const { upkeepNeeded } = await staking.callStatic.checkUpkeep("0x")
                  const postUpkeepStakingState = await staking.getStakingState()

                  assert.equal(postUpkeepStakingState.toString(), "0")
                  await assert(upkeepNeeded)
              })
              it("returns false if there are no stakers", async function () {
                  await network.provider.send("evm_increaseTime", [endTime.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await staking.callStatic.checkUpkeep("0x")
                  await assert(!upkeepNeeded)
              })
              it("returns false if not enough time has passed", async function () {
                  await network.provider.send("evm_increaseTime", [1])
                  await network.provider.send("evm_mine", [])
                  await staking.enterPool({ value: entranceFee })
                  const { upkeepNeeded } = await staking.callStatic.checkUpkeep("0x")
                  await assert(!upkeepNeeded)
              })
              it("returns true if all conditions have been met", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await staking.enterPool({ value: entranceFee })
                  const { upkeepNeeded } = await staking.callStatic.checkUpkeep("0x")
                  await assert(upkeepNeeded)
              })
          })
          describe("PerformUpkeep", function () {
              it("Reverts with error if upkeep not needed", async function () {
                  await staking.enterPool({ value: entranceFee })
                  await expect(staking.performUpkeep([])).to.be.revertedWith(
                      "EventStaking__UpkeepNotNeeded"
                  )
              })

              it("Only runs when upkeep is true", async function () {
                  await staking.enterPool({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await staking.performUpkeep([])
                  assert(tx)
              })

              it("Changes staking state to close", async function () {
                  const initialStakingState = await staking.getStakingState()
                  assert.equal(initialStakingState.toString(), "0")
                  await staking.enterPool({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await staking.performUpkeep([])
                  const finalStakingState = await staking.getStakingState()
                  assert.equal(finalStakingState.toString(), "1")
              })

              it("Triggers reward function", async function () {
                  await staking.enterPool({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await expect(staking.performUpkeep([])).to.emit(staking, "RewardsDistributed")
              })

              it("Updates latest timestamp", async function () {
                  const initialTimeStamp = await staking.getLatestTimestamp()
                  await staking.enterPool({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await staking.performUpkeep([])
                  const latestTimeStamp = await staking.getLatestTimestamp()
                  const blockNumBefore = await ethers.provider.getBlockNumber()
                  const blockBefore = await ethers.provider.getBlock(blockNumBefore)
                  assert(initialTimeStamp < latestTimeStamp)
                  assert.equal(latestTimeStamp.toString(), blockBefore.timestamp)
              })

              it("Triggers withdraw function once end staking interval passes", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 2; i++) {
                      await staking.connect(accounts[i]).enterPool({ value: entranceFee })
                  }
                  await network.provider.send("evm_increaseTime", [endTime.toNumber() + 10])
                  await network.provider.send("evm_mine", [])
                  await expect(staking.performUpkeep([])).to.emit(staking, "Withdrawal")
              })
          })
          describe("Rewards", function () {
              it("Correctly calculates percentage of amount to be awarded", async function () {
                  await staking.enterPool({ value: entranceFee })
                  const originalStakingAmount = await staking.getStakerAmount(deployer)
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 10])
                  await network.provider.send("evm_mine", [])
                  await staking.performUpkeep([])
                  const newStakingAmount = await staking.getStakerAmount(deployer)
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
                  const originalStakingAmount = await staking.getStakerAmount(deployer)
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 10])
                  await network.provider.send("evm_mine", [])
                  await staking.performUpkeep([])
                  const newStakingAmount = await staking.getStakerAmount(deployer)
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
              it("Withdraws starting amount and rewards", async function () {
                  const accounts = await ethers.getSigners()
                  await staking.connect(accounts[1]).enterPool({ value: entranceFee })
                  const startingAccountBalance = await accounts[1].getBalance()

                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 10])
                  await network.provider.send("evm_mine", [])
                  await staking.connect(accounts[0]).performUpkeep([])

                  const stakerBalance = await staking.getStakerAmount(accounts[1].address)

                  await network.provider.send("evm_increaseTime", [endTime.toNumber() + 10])
                  await network.provider.send("evm_mine", [])

                  await staking.connect(accounts[0]).performUpkeep([])

                  const endingAccountBalance = await accounts[1].getBalance()

                  assert.equal(
                      startingAccountBalance.add(stakerBalance).toString(),
                      endingAccountBalance.toString()
                  )
              })
              it("Reverts with error if transfer fails", async function () {
                  await deployments.fixture(["test"])
                  const player = (await getNamedAccounts()).player
                  const testHelper = await ethers.getContract("TestHelper", player)
                  await testHelper.fundMe({ value: ethers.utils.parseEther("0.03") })
                  await testHelper.fundContract(ethers.utils.parseEther("0.02"))

                  await network.provider.send("evm_increaseTime", [endTime.toNumber() + 10])
                  await network.provider.send("evm_mine", [])

                  await expect(testHelper.withdraw()).to.be.revertedWith(
                      "EventStaking__TransferFailed"
                  )
              })
          })
      })
