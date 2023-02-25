# Event Staking

This project is a platform for staking ETH using Chainlink's Automation for securely timing reward distributions. Currently only the back-end has been developed, the front-end implementation will be coming soon. This project comes with unit and staging tests, as well as scripts that allow for easy funding and contract verification for Etherscan. Created using Solidity and Javascript built with the HardHat framework.

## How it works

Users can stake their ETH and be rewarded with timely interest. After a certain time all users funds and rewards will be transferred back to their owner's wallets. The minimum amount of ETH required to enter the pool, the amount of interest, the interval at which the rewards will be distributed, and the period until funds are withdrawn are dependent on the contract's owner discretion.

Chainlink Automation is used to distribute rewards whenever certain conditions (including meeting the time interval requirement set by the contract owner) are met.

## How to run it (for development)

*THIS PROJECT HAS BEEN TESTED ONLY ON GOERLI'S TESTNET AND HAS NOT BEEN AUDITED FOR PROFESSIONAL USE*

1. Git Clone this repo
2. Create a `.env` file that includes these three variables:
    - `GOERLI_KEY`: Goerli's RPC node API key. I got mine from Alchemy [here](https://dashboard.alchemy.com/)
    - `PRIVATE_KEY`: Private key from TEST ONLY wallet. Make sure there are no real funds anywhere in this wallet.
    - `ETHERSCAN_API_KEY`: API key from Goerli.Etherscan.io. Only needed when trying to verify the contract. 

3. In the `hardhat-helper-config.js` file you will find all the necessary variables needed to costumize the functionality of the contract. Change them to your needs.
    - `minimumStakingAmount`: How much ETH required to enter the staking pool
    - `interval`: How often (in seconds) rewards will be distributed.   
    - `endTime`: The time until staking pool ends and funds + rewards are transferred back to   their owners.
    - `percentage`: Interest percentage of rewards
    - `maxCap`: Staking pool maximum amount of ETH
    - `minimumContractBalance`: The least amount of ETH your contract should have before issuing rewards. If the contract has no funds, there can't be any rewards.
4. Once contract is deployed to testnet, register it on Chainlink's Automation subscription service [here](https://automation.chain.link/)
 
