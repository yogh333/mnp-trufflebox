# `BankContract`

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

### retrievePropertyRent
```solidity
  function retrievePropertyRent(
    uint16 _edition,
    uint8 _land,
    uint8 _rarity
  ) internal returns (uint256)
```
* @dev Retrieve property rent


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | edition ID
|`_land` | uint8 | land ID
|`_rarity` | uint8 | rarity


### retrievePropertyRarity
```solidity
  function retrievePropertyRarity(
    uint256 randomness
  ) internal returns (uint8)
```
* @dev Retrieve property rarity from randomness

use calculateRandomInteger() with type = 'rarity'

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`randomness` | uint256 | ChainLink VRF random number


### calculateRandomInteger
```solidity
  function calculateRandomInteger(
    string _type,
    uint256 min,
    uint256 max,
    uint256 randomness
  ) internal returns (uint256)
```
* @dev Calculate a new random integer in [min, max] from random ChainLink VRF.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_type` | string | used to calculate new number
|`min` | uint256 | minimum integer
|`max` | uint256 | maximum integer
|`randomness` | uint256 | ChainLink VRF random number


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

## Events
### PropertyBought
```solidity
  event PropertyBought(
    address to,
    uint256 prop_id
  )
```
*
Event emitted when a property is bought


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`to`| address | address
|`prop_id`| uint256 | Prop id*/
### PawnBought
```solidity
  event PawnBought(
    address to,
    uint256 pawn_id
  )
```
*
Event emitted when a pawn is bought


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`to`| address | address
|`pawn_id`| uint256 | pawn ID*/
### eWithdraw
```solidity
  event eWithdraw(
    address to,
    uint256 value
  )
```
*
Event emitted after a withdraw


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`to`| address | address
|`value`| uint256 | amount*/
### PlayerEnrolled
```solidity
  event PlayerEnrolled(
    uint16 _edition,
    address player
  )
```
*
Event emitted when a player is enrolled in the game


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`_edition`| uint16 | edition ID
|`player`| address | address*/
### RollingDices
```solidity
  event RollingDices(
    address player,
    uint16 _edition,
    bytes32 requestID
  )
```
*
Event emitted when player throw dices and random number is requested.


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`player`| address | address
|`_edition`| uint16 | edition ID
|`requestID`| bytes32 | random request ID*/
### MonoBought
```solidity
  event MonoBought(
    address player,
    uint256 amount
  )
```
*
Event emitted when a player buy MONO


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`player`| address | address
|`amount`| uint256 | amount*/
### PropertyRentPaid
```solidity
  event PropertyRentPaid(
    address player,
    uint256 amount
  )
```
*
Event emitted when a property rent is paid by player


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`player`| address | address
|`amount`| uint256 | amount*/
