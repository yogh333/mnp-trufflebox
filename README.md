# MNP contracts security
Some security analysis and reports

## with Slither, the Solidity source analyzer
[Slither repo](https://github.com/crytic/slither)

reports are made with solc version 0.8.9 (slither have a bug with 0.8.10)

[Detectors issues documentation](https://github.com/crytic/slither/wiki/Detector-Documentation)

See [brut html report](https://github.com/jcaporossi/mnp-trufflebox/blob/feature/security/Security/slither/slither.html)  
See [human summary html report](https://github.com/jcaporossi/mnp-trufflebox/blob/feature/security/Security/slither/human-summary.html)

### High issues (critical)
#### [weak PRNG](https://github.com/crytic/slither/wiki/Detector-Documentation#weak-prng)
- PawnContract.mint(address) (share/contracts/Pawn.sol#74-92) uses a weak PRNG: "p.power = 1 + (r % 11) (share/contracts/Pawn.sol#83)"
- PawnContract.mint(address) (share/contracts/Pawn.sol#74-92) uses a weak PRNG: "p.subject = 1 + (r % 8) (share/contracts/Pawn.sol#79)"
- PawnContract.mint(address) (share/contracts/Pawn.sol#74-92) uses a weak PRNG: "p.background = 1 + (r % 10) (share/contracts/Pawn.sol#80)"
- PawnContract.mint(address) (share/contracts/Pawn.sol#74-92) uses a weak PRNG: "p.material = 1 + (r % 10) (share/contracts/Pawn.sol#81)"
- PawnContract.mint(address) (share/contracts/Pawn.sol#74-92) uses a weak PRNG: "p.halo = 1 + (r % 7) (share/contracts/Pawn.sol#82)"
- PawnContract.random(address) (share/contracts/Pawn.sol#128-130) uses a weak PRNG: "uint8(uint256(keccak256(bytes)(abi.encodePacked(block.difficulty,block.timestamp,user))) % type()(uint8).max) (share/contracts/Pawn.sol#129)"

#### [unchecked transfer](https://github.com/crytic/slither/wiki/Detector-Documentation#unchecked-transfer)
- BankContract.rollDices(uint16) (share/contracts/Bank.sol#170-189) ignores return value by Mono.transferFrom(msg.sender,address(this),(chainlinkFee * linkLastPrice) / monoLastPrice + 10 ** 18) (share/contracts/Bank.sol#183)
- BankContract.buyMono() (share/contracts/Bank.sol#192-205) ignores return value by Mono.transfer(msg.sender,amountToBuy) (share/contracts/Bank.sol#202)
- BankContract.propertyTransfer(address,address,uint256,uint256) (share/contracts/Bank.sol#445-469) ignores return value by Mono.transferFrom(_from,receiver,royaltyAmount) (share/contracts/Bank.sol#464)
- StakingContract.stake(address,uint256) (share/contracts/Staking.sol#160-182) ignores return value by pool.info.token.transferFrom(msg.sender,address(this),_amount) (share/contracts/Staking.sol#178)
- StakingContract.unstake(address) (share/contracts/Staking.sol#213-238) ignores return value by pool.info.token.transfer(msg.sender,stakedAmount) (share/contracts/Staking.sol#232)
- StakingContract.unstake(address) (share/contracts/Staking.sol#213-238) ignores return value by rewardToken.transfer(msg.sender,rewards) (share/contracts/Staking.sol#235)

StakingContract._calculateReward(address,StakingContract.PoolInfo,StakingContract.UserInfo) (share/contracts/Staking.sol#192-204) performs a multiplication on the result of a division:
-_user.amount * (block.timestamp - _user.depositDate) * _pool.yield / 100 / 365 / 24 / 60 / 60 * uint256(getLastPrice(address(rewardToken))) / uint256(getLastPrice(_token)) (share/contracts/Staking.sol#199-202)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#divide-before-multiply

### Medium issues
#### [Contract locking ether](https://github.com/crytic/slither/wiki/Detector-Documentation#contracts-that-lock-ether)
Contract BankContract (share/contracts/Bank.sol#19-470) has payable functions:
- BankContract.buyMono() (share/contracts/Bank.sol#192-205)
But does not have a function to withdraw the ether

#### [uninitialized local variables](https://github.com/crytic/slither/wiki/Detector-Documentation#uninitialized-local-variables)
- BoardContract.constructor(address,address,bytes32,uint256).n (share/contracts/Board.sol#100) is a local variable never initialized
- PawnContract.mint(address).p (share/contracts/Pawn.sol#77) is a local variable never initialized
- BoardContract.constructor(address,address,bytes32,uint256).landID (share/contracts/Board.sol#98) is a local variable never initialized

#### [unused return](https://github.com/crytic/slither/wiki/Detector-Documentation#unused-return)
- VRFConsumerBase.requestRandomness(bytes32,uint256) (share/node_modules/@chainlink/contracts/src/v0.8/VRFConsumerBase.sol#152-166) ignores return value by LINK.transferAndCall(vrfCoordinator,_fee,abi.encode(_keyHash,USER_SEED_PLACEHOLDER)) (share/node_modules/@chainlink/contracts/src/v0.8/VRFConsumerBase.sol#153)
- ERC721._checkOnERC721Received(address,address,uint256,bytes) (share/node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#382-403) ignores return value by IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,_data) (share/node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#389-399)


### Call graphs

