// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';


// @dev For tests only
contract ChainLinkPriceFeedStub is AggregatorV3Interface, Ownable {

    int256 token_value;
    uint8 token_decimals;
    uint80 token_roundId;
    uint256 token_startedAt;
    uint256 token_updatedAt;
    uint80 token_answeredInRound;

    // @param _value: précision à 6 chiffres
    constructor(int256 _value, uint8 _decimals) {
        token_decimals = _decimals;
        setRoundData(_value);
    }

    function decimals() override external view returns (uint8) {
        return token_decimals;
    }

    function description() override external pure returns (string memory) {
        return "ChainLink Price Feed";
    }

    function version() override external pure returns (uint256) {
        return 0;
    }

    function setRoundData(int256 _value) public {
        token_value = _value;
        token_updatedAt = token_startedAt = block.timestamp;
        token_roundId++;
        token_answeredInRound = token_roundId;
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
        token_value,
        token_startedAt,
        token_updatedAt,
        token_answeredInRound
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
        token_roundId,
        token_value,
        token_startedAt,
        token_updatedAt,
        token_answeredInRound
        );
    }
}
