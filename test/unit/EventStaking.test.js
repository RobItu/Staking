const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("EventStaking Unit Tests", function () {
          let staking, hardhatStaking, entranceFee, percentage
          chainId = network.config.chainId
          percentage = networkConfig[chainId]["percentage"]

          beforeEach(async function () {
              await deployments.fixture(["all"])
              deployer = (await getNamedAccounts()).deployer
              staking = await ethers.getContract("EventStaking", deployer)
              entranceFee = await staking.getMinimumStakingAmount()
          })

          describe("Constructor", function () {
              it("Has correct entrance fee", async function () {
                  const minimumStakingAmount = await staking.getMinimumStakingAmount()
                  assert.equal(
                      minimumStakingAmount.toString(),
                      networkConfig[chainId]["minimumStakingAmount"]
                  )
              })
          })

          describe("Enter Staking", function () {
              it("Throws error if fund amount is too small", async function () {
                  expect(staking.fund()).to.be.revertedWith("You need more ETH!")
              })

              it("Records staker when they enter", async function () {
                  const fundContract = await staking.fund({ value: entranceFee })
                  const staker = await staking.getStaker(0)
                  assert.equal(staker.toString(), deployer)
              })

              it("Correctly funds contract", async function () {
                  const fundContract = await staking.fund({ value: entranceFee })
                  stakerAmount = await staking.getStakerAmount(deployer)
                  assert.equal(
                      stakerAmount.toString(),
                      networkConfig[chainId]["minimumStakingAmount"]
                  )
              })
              describe("Rewards", function () {
                  it("Correctly calculates percentage of amount to be awarded", async function () {
                      await staking.fund({ value: entranceFee })
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
                      await staking.fund({ value: entranceFee })
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
                      await staking.fund({ value: entranceFee })
                  })

                  it("Withdraws initial amount staked", async function () {
                      accounts = await ethers.getSigners()
                      stakerAccount = staking.connect(accounts[1])
                      await stakerAccount.fund({ value: entranceFee })
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
                      await stakerAccount.fund({ value: entranceFee })
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
      })
