# MNP contracts security
Some security analysis and reports

## with Slither, the Solidity source analyzer
[Slither repo](https://github.com/crytic/slither)

reports are made with solc version 0.8.9 (slither have a bug with 0.8.10)

[Detectors issues documentation](https://github.com/crytic/slither/wiki/Detector-Documentation)

See slither [brut html report]()

### High issues
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
