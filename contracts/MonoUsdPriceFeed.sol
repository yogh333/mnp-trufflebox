// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';


/**
 * @title MONO/USD price feed
 * @notice Is a fake price feed base on ChainLink price feed contracts. see AggregatorV3Interface
 * @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
 */
contract MonoUsdPriceFeed is AggregatorV3Interface, Ownable {
    
    int256 value;
    uint80 roundId;
    uint256 startedAt;
    uint256 updatedAt;
    uint80 answeredInRound;
    uint8 private _decimals = 8;

    /** @dev Constructor
	 * @param _value 6 digits precision*/
    constructor(int256 _value) {
        setRoundData(_value);
    }


    function decimals() override external view returns (uint8) {
        return _decimals;
    }

    function description() override external pure returns (string memory) {
        return "MONO/USD Price Feed";
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
