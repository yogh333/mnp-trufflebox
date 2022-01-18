// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FaucetContract {
	uint256 public constant tokenAmount = 100000000000000000000;
	uint256 public constant waitTime = 30 minutes;

	IERC20 public tokenInstance;

	mapping(address => uint256) lastAccessTime;

	constructor(address _tokenInstance) {
		require(_tokenInstance != address(0));
		tokenInstance = IERC20(_tokenInstance);
	}

	function requestTokens() public {
		require(allowedToWithdraw(msg.sender));
		tokenInstance.transfer(msg.sender, tokenAmount);
		lastAccessTime[msg.sender] = block.timestamp + waitTime;
	}

	function allowedToWithdraw(address _address) public view returns (bool) {
		if (lastAccessTime[_address] == 0) {
			return true;
		} else if (block.timestamp >= lastAccessTime[_address]) {
			return true;
		}
		return false;
	}
}
