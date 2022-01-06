// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';


// @dev For local development only
contract EthUsdPriceFeed is AggregatorV3Interface, Ownable {
    
    int256 value;
    uint80 roundId;
    uint256 startedAt;
    uint256 updatedAt;
    uint80 answeredInRound;

    // @param _value: précision à 6 chiffres
    constructor(int256 _value) {
        setRoundData(_value);
    }

    function decimals() override external view returns (uint8) {
        return 8;
    }

    function description() override external pure returns (string memory) {
        return "ETH/USD ChainLink Price Feed";
    }

    function version() override external pure returns (uint256) {
        return 0;
    }

    function setRoundData(int256 _value) public {
        value = _value;
        updatedAt = startedAt = block.timestamp;
        roundId++;
        answeredInRound = roundId;
    }

    function getRoundData(
        uint80 _roundId
    ) override external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
        _roundId,
        value,
        startedAt,
        updatedAt,
        answeredInRound
        );
    }

    function latestRoundData()
    override external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
        roundId,
        value,
        startedAt,
        updatedAt,
        answeredInRound
        );
    }
}
