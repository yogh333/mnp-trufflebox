## `PawnContract`

/**
Pawn ERC721 NTF, player must have one.


## Functions
### constructor
```solidity
  function constructor(
    string _name,
    string _symbol,
    string _baseTokenURI
  ) public
```

Constructor
ADMIN_ROLE, MINTER_ROLE are given to deployer*/
	c
#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_name` | string | ChainLink VRFCoordinator contract address
|`_symbol` | string | LINK token address
|`_baseTokenURI` | string | ChainLink keyHash parameter for VRF


### tokenURI
```solidity
  function tokenURI(
    uint256 _id
  ) public returns (string)
```
get token URI relative to a Pawn


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | Pawn ID

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`string`| uint256 | value*/
	f
### mint
```solidity
  function mint(
    address _to
  ) external returns (uint256 id_)
```
Mint NFT token
#### requirements :<br />
	- user must have MINTER role
	- Property must be valid


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | buyer address

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`id_`| address | Pawn ID*/
	f
### supportsInterface
```solidity
  function supportsInterface(
    bytes4 _interfaceId
  ) public returns (bool)
```
is contract support interface


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_interfaceId` | bytes4 | interface ID


### get
```solidity
  function get(
    uint256 _id
  ) public returns (struct PawnContract.PawnInfo p_)
```
get information for a Pawn


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | Pawn ID

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`p_`| uint256 | Pawn information struct*/
	f
