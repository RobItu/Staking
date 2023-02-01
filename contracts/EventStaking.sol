// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract EventStaking is KeeperCompatibleInterface {
    enum StakingState {
        OPEN,
        CLOSE
    }

    StakingState private s_stakingState;
    address[] public s_stakers;
    uint256 public immutable i_MinimumStakingAmount;
    mapping(address => uint256) public s_addressToAmountStaked;
    uint256 private immutable i_interval;
    uint256 private s_lastTimeStamp;

    event StakingEnter(address indexed staker);
    event RewardsDistributed(uint256 indexed rewardAmount);
    event Withdrawal(address staker);

    constructor(uint256 minimumStakingAmount, uint256 interval) {
        i_MinimumStakingAmount = minimumStakingAmount;
        s_stakingState = StakingState.OPEN;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
    }

    function fund() public payable {
        require(msg.value >= i_MinimumStakingAmount, "You need more ETH!");
        require(s_stakingState == StakingState.OPEN, "Staking pool is closed");
        s_stakers.push(msg.sender);
        s_addressToAmountStaked[msg.sender] += msg.value;
    }

    function checkUpkeep(
        bytes memory /*checkData */
    ) public override returns (bool upkeepNeeded, bytes memory /*performData */) {
        bool isOpen = (s_stakingState == StakingState.OPEN);
        bool hasStakers = (s_stakers.length > 0);
        bool hasBalance = (address(this).balance > 0);
        bool timePassed = (block.timestamp - s_lastTimeStamp) >= i_interval;
        upkeepNeeded = (isOpen && hasStakers && hasBalance && timePassed);
    }

    function performUpkeep(bytes calldata /*performData */) external override {}

    function rewards() internal {
        require(s_stakers.length > 0, "No stakers in pool");
        uint256 i;
        for (i = 0; i < s_stakers.length; i++) {
            address staker = s_stakers[i];
            s_addressToAmountStaked[staker] += (s_addressToAmountStaked[staker] * 5) / 100;
        }
    }

    function withdraw() internal {
        uint256 i;
        for (i = 1; i < s_stakers.length; i++) {
            address staker = s_stakers[i];
            uint256 amount = s_addressToAmountStaked[staker];
            (bool callSuccess, ) = payable(staker).call{value: amount}("");
            require(callSuccess, "Call failed");
            delete s_stakers[i];
            s_addressToAmountStaked[staker] = 0;
        }
        s_stakingState = StakingState.OPEN;
    }

    function getMinimumStakingAmount() public view returns (uint256) {
        return i_MinimumStakingAmount;
    }

    function getStaker(uint256 _staker) public view returns (address) {
        return s_stakers[_staker];
    }

    function getStakerAmount(address _address) public view returns (uint256) {
        return s_addressToAmountStaked[_address];
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
