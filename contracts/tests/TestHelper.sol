// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "../EventStaking.sol";

contract TestHelper {
    EventStaking staking;

    constructor(
        uint256 minimumStakingAmount,
        uint256 interval,
        uint256 endTime,
        uint256 percentage,
        uint256 maxCap
    ) {
        staking = new EventStaking(minimumStakingAmount, interval, endTime, percentage, maxCap);
    }

    function fundMe() public payable {}

    function fundContract(uint256 amount) public {
        staking.enterPool{value: amount}();
    }

    function withdraw() public {
        staking.performUpkeep("");
    }
}
