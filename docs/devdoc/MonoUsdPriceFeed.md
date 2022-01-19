# `MonoUsdPriceFeed`

/**
Is a fake price feed base on ChainLink price feed contracts. see AggregatorV3Interface



## Functions
### constructor
```solidity
  function constructor(
    int256 _value
  ) public
```
* @dev Constructor


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_value` | int256 | 6 digits precision*/

### decimals
```solidity
  function decimals(
  ) external returns (uint8)
```




### description
```solidity
  function description(
  ) external returns (string)
```




### version
```solidity
  function version(
  ) external returns (uint256)
```




### setRoundData
```solidity
  function setRoundData(
  ) public
```




### getRoundData
```solidity
  function getRoundData(
  ) external returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```




### latestRoundData
```solidity
  function latestRoundData(
  ) external returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
```




