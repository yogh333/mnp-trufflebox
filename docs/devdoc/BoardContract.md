# `BoardContract`

/**
Implements game logic and board's features



## Functions
### constructor
```solidity
  function constructor(
    address _VRFCoordinator,
    address _LinkToken,
    bytes32 _keyHash,
    uint256 _Chainlinkfee
  ) public
```
*

Constructor

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_VRFCoordinator` | address | ChainLink VRFCoordinator contract address
|`_LinkToken` | address | LINK token address
|`_keyHash` | bytes32 | ChainLink keyHash parameter for VRF
|`_Chainlinkfee` | uint256 | ChainLink fee for VRF*/

### requestRandomNumber
```solidity
  function requestRandomNumber(
  ) internal returns (bytes32 requestId)
```
* @dev Request a random number



#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`requestId`|  | the id of the request for the oracle*/
### fulfillRandomness
```solidity
  function fulfillRandomness(
    bytes32 requestId,
    uint256 randomness
  ) internal
```
*

Callback function used by ChainLink VRF Coordinator
/!\ Maximum Gas for Callback : If your fulfillRandomness function uses more than 200k gas, the transaction will fail.*/
#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`requestId` | bytes32 | the id of the request for the oracle
|`randomness` | uint256 | randomness must be requested from an oracle, which generates a number and a cryptographic proof


### gameStrategist
```solidity
  function gameStrategist(
    uint16 _edition,
    uint256 _pawnID
  ) internal
```
* @dev Game strategist


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition
|`_pawnID` | uint256 | pawn ID*/

### isPurchasable
```solidity
  function isPurchasable(
    uint16 edition,
    uint8 land
  ) external returns (bool)
```
* check if a land can be bought (PROP tokens available)


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`edition` | uint16 | board edition
|`land` | uint8 | cell number

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`true`| uint16 | or false*/
### getMaxEdition
```solidity
  function getMaxEdition(
  ) external returns (uint16)
```
* get the number of board editions



#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`number`|  | of board editions*/
### getNbLands
```solidity
  function getNbLands(
    uint16 edition
  ) external returns (uint8)
```
* get the number of lands for a board edition


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`edition` | uint16 | board edition

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`number`| uint16 | of lands*/
### getRarityLevel
```solidity
  function getRarityLevel(
    uint16 edition
  ) external returns (uint8)
```
* get the number of rarity level for a board edition


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`edition` | uint16 | board edition

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`number`| uint16 | of rarity levels*/
### newBoard
```solidity
  function newBoard(
    uint8 _nbOfLands,
    uint8 _rarityLevel,
    uint8[] _maxPawns
  ) public
```
* create a new board


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_nbOfLands` | uint8 | number of lands
|`_rarityLevel` | uint8 | number of rarity levels
|`_maxPawns` | uint8[] | max number of pawns allowed*/

### register
```solidity
  function register(
    uint16 _edition,
    uint256 _pawnID
  ) external returns (bool isOnBoarded)
```
* register a pawn on a board


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition
|`_pawnID` | uint256 | pawn ID*/

### isRegistered
```solidity
  function isRegistered(
    uint16 _edition,
    uint256 _pawnID
  ) public returns (bool)
```
* check if a pawn is registered


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition
|`_pawnID` | uint256 | pawn ID

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`true`| uint16 | or false*/
### play
```solidity
  function play(
    uint16 _edition,
    uint256 _pawnID
  ) external returns (bytes32 requestId)
```
* play with a pawn


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition
|`_pawnID` | uint256 | pawn ID*/

### getPawnInfo
```solidity
  function getPawnInfo(
    uint16 _edition,
    uint256 _pawnID
  ) external returns (struct BoardContract.PawnInfo p)
```
* get Pawn information on a board


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition
|`_pawnID` | uint256 | pawn ID

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`p`| uint16 | Pawn information*/
### setPawnInfo
```solidity
  function setPawnInfo(
    uint16 _edition,
    uint256 _pawnID,
    struct BoardContract.PawnInfo _pawnInfo
  ) external
```
* set Pawn information on a board


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_edition` | uint16 | board edition
|`_pawnID` | uint256 | pawn ID
|`_pawnInfo` | struct BoardContract.PawnInfo | pawn information*/

## Events
### BoardCreated
```solidity
  event BoardCreated(
    uint16 new_edition_nb
  )
```
* Event emitted when a new board is created


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`new_edition_nb`| uint16 | new board edition number*/
### ePawn
```solidity
  event ePawn(
    uint16 _edition,
    uint256 _pawnID
  )
```
* Event emitted when a new pawn is registered on a board


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`_edition`| uint16 | board edition number
|`_pawnID`| uint256 | pawn's ID*/
### RandomReady
```solidity
  event RandomReady(
    bytes32 requestId
  )
```
*
Event emitted when a random number is received by contract

see fulfillRandomness()*/
#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`requestId`| bytes32 | request id

