// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract EventStaking {
    address[] public s_stakers;
    uint256 public immutable i_MinimumStakingAmount;
    mapping(address => uint256) public s_addressToAmountStaked;

    constructor(uint256 minimumStakingAmount) {
        i_MinimumStakingAmount = minimumStakingAmount;
    }

    function fund() public payable {
        require(msg.value >= i_MinimumStakingAmount, "You need more ETH!");
        s_stakers.push(msg.sender);
        s_addressToAmountStaked[msg.sender] += msg.value;
    }

    function rewards() external {
        //How do I prevent anyone from calling this function?
        require(s_stakers.length > 0, "No stakers in pool");
        uint256 i;
        for (i = 0; i < s_stakers.length; i++) {
            address staker = s_stakers[i];
            s_addressToAmountStaked[staker] += (s_addressToAmountStaked[staker] * 5) / 100;
        }
    }

    function withdraw(uint256 amount) public {
        require(amount > 0);
        (bool callSuccess, ) = payable(msg.sender).call{value: amount}("");
        require(callSuccess, "Call failed");
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
