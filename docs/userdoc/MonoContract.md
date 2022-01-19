## `MonoContract`

/**
This is the project token.
Is capped, burnable, pausable and have an access control.


## Functions
### constructor
```solidity
  function constructor(
    uint256 _cap
  ) public
```
* @dev Constructor

ADMIN_ROLE, MINTER_ROLE and PAUSER_ROLE are given to deployer

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cap` | uint256 | Sets the value of the max supply of token. This value is immutable, it can only be set once during construction.*/

### mint
```solidity
  function mint(
    address account,
    uint256 amount
  ) external
```
* mint $MONO token to an address


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | destination address
|`amount` | uint256 | quantity of tokens to be minted*/

### pause
```solidity
  function pause(
  ) external
```
* pause token transfers, minting and burning*/



### unpause
```solidity
  function unpause(
  ) external
```
* unpause token transfers, minting and burning*/



