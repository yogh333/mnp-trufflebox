## `BankContract`

/** @title Bank contract
Is the contract handler


## Functions
### constructor
```solidity
  function constructor(
    address PawnAddress,
    address BoardAddress,
    address PropAddress,
    address MonoAddress,
    address LinkAddress,
    address StakingAddress
  ) public
```
*

Constructor
ADMIN_ROLE, BANKER_ROLE are given to deployer
#### requirements :<br />
- all parameters addresses must not be address(0)*/
#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`PawnAddress` | address | address
|`BoardAddress` | address | address
|`PropAddress` | address | address
|`MonoAddress` | address | address
|`LinkAddress` | address | address
|`StakingAddress` | address | address


### buyPawn
```solidity
  function buyPawn(
  ) external
```
*
buy a pawn (mandatory to play)

#### requirements :<br />
- MONO transfer*/


### locatePlayer
```solidity
  function locatePlayer(
    uint16 _edition
  ) public returns (struct BoardContract.PawnInfo p_)
```
* locate pawn on game's board
#### requirements :<br />
- edition is valid
- player has a pawn
- pawn is registered at this edition


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | edition number

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`p_`| uint16 | Board contract pawn information struct*/
### enrollPlayer
```solidity
  function enrollPlayer(
    uint16 _edition
  ) public
```
* To enroll a player to a board, required to play.
#### requirements :<br />
- contract has allowance to spend enroll fee
- player has a pawn
- pawn is registered at this edition


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition*/

### rollDices
```solidity
  function rollDices(
    uint16 _edition
  ) external
```
* To throw the dices and request a random number.
#### requirements :<br />
- round is completed
- player has a pawn
- pawn is registered at this edition
- Board contract has enough LINK to pay ChainLink fee to request VRF


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition*/

### buyMono
```solidity
  function buyMono(
  ) public
```
* To buy Mono with the Token network.*/



### buyProp
```solidity
  function buyProp(
    uint16 _edition
  ) public
```
* buy PROP
#### requirements :<br />
- Round must be uncompleted
- MONO transfer ok

- PROP is valid

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition*/

### payRent
```solidity
  function payRent(
    uint16 _edition
  ) public
```
* pay property rent
#### requirements :<br />
- Round must be uncompleted
- MONO transfer ok

- PROP is valid

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition*/

### getPriceOfProp
```solidity
  function getPriceOfProp(
    uint16 _edition,
    uint8 _land,
    uint8 _rarity
  ) external returns (uint256 price)
```
* get a property price
#### requirements :<br />
- property mus be valid


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | edition ID
|`_land` | uint8 | land ID
|`_rarity` | uint8 | rarity


### setPriceOfProp
```solidity
  function setPriceOfProp(
    uint16 _edition,
    uint8 _land,
    uint8 _rarity,
    uint256 _price
  ) public
```
* set a property price
#### requirements :<br />
- must have BANKER role
- property mus be valid


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | edition ID
|`_land` | uint8 | land ID
|`_rarity` | uint8 | rarity
|`_price` | uint256 | amount*/

### withdraw
```solidity
  function withdraw(
    address _to,
    uint256 _value
  ) external
```
* withdraw
#### requirements :<br />
- must have BANKER role
- MONO transfer


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | address
|`_value` | uint256 | amount*/

### onERC721Received
```solidity
  function onERC721Received(
  ) external returns (bytes4)
```




### setPrices
```solidity
  function setPrices(
    uint16 _editionId,
    uint8 _maxLands,
    uint8 _maxLandRarities,
    uint16 _rarityMultiplier,
    uint256[] _commonLandPrices
  ) external
```
* set properties prices, useful to add an edition from admin


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_editionId` | uint16 | edition ID
|`_maxLands` | uint8 | max lands
|`_maxLandRarities` | uint8 | max land rarity
|`_rarityMultiplier` | uint16 | rarity multiplier
|`_commonLandPrices` | uint256[] | common land rarity price*/

### propertyTransfer
```solidity
  function propertyTransfer(
    address _from,
    address _to,
    uint256 _tokenId,
    uint256 _salePrice
  ) external
```
* Transfer property ERC721 and royalties to receiver. Useful for our Marketplace<br />
#### requirements :<br />
- only BANKER role
- buyer MONO balance must be greater than sell price

- This contract must be allowed contract for transfer
- MONO transfer sell price

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | the seller
|`_to` | address | the buyer
|`_tokenId` | uint256 | the Property token id
|`_salePrice` | uint256 | the sale price */

