// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";
error EventStaking_PoolNotOpen();
error EventStaking_NotEnoughEthEntered();
error EventStaking_UpkeepNotNeeded();
error EventStaking_TransferFailed();
error EventStaking_NotEnoughStakers();

contract EventStaking is KeeperCompatibleInterface {
    enum StakingState {
        OPEN,
        CLOSE,
        ENDED
    }

    StakingState private s_stakingState;
    address[] public s_stakers;
    uint256 public immutable i_MinimumStakingAmount;
    mapping(address => uint256) public s_addressToAmountStaked;
    uint256 private immutable i_interval;
    uint256 private s_lastTimeStamp;
    uint256 private s_endStakingTime;

    event StakingEnter(address indexed staker);
    event RewardsDistributed(uint256 indexed rewardAmount);
    event Withdrawal(address staker, uint256 balance);

    constructor(uint256 minimumStakingAmount, uint256 interval, uint256 endTime) {
        i_MinimumStakingAmount = minimumStakingAmount;
        s_stakingState = StakingState.OPEN;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
        s_endStakingTime = endTime;
    }

    function enterPool() public payable {
        if (msg.value < i_MinimumStakingAmount) {
            revert EventStaking_NotEnoughEthEntered();
        }
        if (s_stakingState != StakingState.OPEN) {
            revert EventStaking_PoolNotOpen();
        }
        s_stakers.push(msg.sender);
        s_addressToAmountStaked[msg.sender] += msg.value;
        emit StakingEnter(msg.sender);
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

    function performUpkeep(bytes calldata /*performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert EventStaking_PoolNotOpen();
        }
        s_stakingState = StakingState.CLOSE;
        rewards();
        if (block.timestamp > s_endStakingTime) {
            withdraw();
        }
    }

    function rewards() internal {
        if (s_stakers.length <= 0) {
            revert EventStaking_NotEnoughStakers();
        }
        uint256 i;
        for (i = 0; i < s_stakers.length; i++) {
            address staker = s_stakers[i];
            uint256 rewardAmount = (s_addressToAmountStaked[staker] * 5) / 100;
            s_addressToAmountStaked[staker] += rewardAmount;
            emit RewardsDistributed(rewardAmount);
        }
    }

    function withdraw() internal {
        uint256 i;
        for (i = 1; i < s_stakers.length; i++) {
            address staker = s_stakers[i];
            uint256 amount = s_addressToAmountStaked[staker];
            (bool callSuccess, ) = payable(staker).call{value: amount}("");
            if (!callSuccess) {
                revert EventStaking_TransferFailed();
            }
            emit Withdrawal(staker, amount);
            delete s_stakers[i];
            s_addressToAmountStaked[staker] = 0;
        }
        s_stakingState = StakingState.ENDED;
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

    function getStakingState() public view returns (StakingState) {
        return s_stakingState;
    }
}
