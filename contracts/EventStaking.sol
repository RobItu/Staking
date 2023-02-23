// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error EventStaking__PoolNotOpen();
error EventStaking__NotEnoughEthEntered();
error EventStaking__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 StakingState
);
error EventStaking__TransferFailed();
error EventStaking__NotEnoughStakers();
error EventStaking__PoolIsFull();

/**
 * @title A Staking Contract
 * @author Roberto Iturralde
 * @notice This contract is for creating an untamperable and transparent staking smart contract
 * @dev This contract implements Chainlink Automation
 */

contract EventStaking is KeeperCompatibleInterface {
    enum StakingState {
        OPEN,
        CLOSE,
        ENDED
    }
    enum PoolCap {
        OPEN,
        FULL
    }

    StakingState private s_stakingState;
    PoolCap private s_poolCap;
    address[] public s_stakers;
    mapping(address => uint256) public s_addressToAmountStaked;
    uint256 public immutable i_MinimumStakingAmount;
    uint256 private immutable i_interval;
    uint256 private immutable i_endStakingTime;
    uint256 private immutable i_percentage;
    uint256 private immutable i_maxCap;
    uint256 private immutable i_minimumContractBalance;
    uint256 private s_lastTimeStamp;

    event StakingEnter(address indexed staker);
    event RewardsDistributed(uint256 indexed rewardAmount);
    event Withdrawal(address staker, uint256 balance);

    /**
     * @param minimumStakingAmount Minimum staking amount in ETH
     * @param interval How often should rewards be issued
     * @param endTime Time until staking pool becomes unlocked and funds withdrawn
     * @param percentage Percentage (integer) of rewards distributed
     * @param maxCap Maximum pool capacity in ETH
     * @param minimumContractBalance Minimum amount of eth in contract
     */

    constructor(
        uint256 minimumStakingAmount,
        uint256 interval,
        uint256 endTime,
        uint256 percentage,
        uint256 maxCap,
        uint256 minimumContractBalance
    ) payable {
        i_MinimumStakingAmount = minimumStakingAmount;
        s_stakingState = StakingState.OPEN;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
        i_endStakingTime = endTime;
        i_percentage = percentage;
        s_poolCap = PoolCap.OPEN;
        i_maxCap = maxCap;
        i_minimumContractBalance = minimumContractBalance;
    }

    function enterPool() public payable {
        if (msg.value < i_MinimumStakingAmount) {
            revert EventStaking__NotEnoughEthEntered();
        }
        if (s_poolCap == PoolCap.FULL) {
            revert EventStaking__PoolIsFull();
        }
        if (s_stakingState != StakingState.OPEN) {
            revert EventStaking__PoolNotOpen();
        }
        if (address(this).balance >= i_maxCap) {
            s_stakingState = StakingState.CLOSE;
            s_poolCap = PoolCap.FULL;
        }
        s_stakers.push(msg.sender);
        s_addressToAmountStaked[msg.sender] += msg.value;
        emit StakingEnter(msg.sender);
    }

    /**
     * @dev Chainlink Automation function that verifies if upkeep is needed
     * @dev When Upkeep is needed, it will call performUpkeep
     */

    function checkUpkeep(
        bytes memory /*checkData */
    ) public override returns (bool upkeepNeeded, bytes memory /*performData */) {
        if (s_poolCap == PoolCap.FULL && s_stakingState != StakingState.ENDED) {
            s_stakingState = StakingState.OPEN;
        }
        bool isOpen = (StakingState.OPEN == s_stakingState);
        bool hasStakers = (s_stakers.length > 0);
        bool hasBalance = (address(this).balance > i_minimumContractBalance);
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        upkeepNeeded = (isOpen && hasStakers && hasBalance && timePassed);
    }

    /**
     * @dev Once upkeep is needed, performUpkeep will call rewards function
     * @dev If enough time (endTime) has passed, it will call withdraw function
     */
    function performUpkeep(bytes calldata /*performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert EventStaking__UpkeepNotNeeded(
                address(this).balance,
                s_stakers.length,
                uint256(s_stakingState)
            );
        }
        if ((block.timestamp - s_lastTimeStamp) > i_endStakingTime) {
            withdraw();
        }
        s_stakingState = StakingState.CLOSE;
        rewards(i_percentage);
        s_lastTimeStamp = block.timestamp;
    }

    function rewards(uint256 percentage) internal {
        uint256 i;
        for (i = 0; i < s_stakers.length; i++) {
            address staker = s_stakers[i];
            uint256 rewardAmount = (s_addressToAmountStaked[staker] * percentage) / 100;
            s_addressToAmountStaked[staker] += rewardAmount;
            emit RewardsDistributed(rewardAmount);
        }
    }

    function withdraw() internal {
        uint256 i;
        for (i = 0; i < s_stakers.length; i++) {
            address staker = s_stakers[i];
            uint256 amount = s_addressToAmountStaked[staker];
            (bool callSuccess, ) = payable(staker).call{value: amount}("");
            if (!callSuccess) {
                revert EventStaking__TransferFailed();
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

    function getStakingState() public view returns (StakingState) {
        return s_stakingState;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getEndTime() public view returns (uint256) {
        return i_endStakingTime;
    }

    function getLatestTimestamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getPercentage() public view returns (uint256) {
        return i_percentage;
    }

    function getMaxCap() public view returns (uint256) {
        return i_maxCap;
    }
}
