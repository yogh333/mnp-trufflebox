// DeFiStaking.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

/**
 * @notice This contract is made for staking ERC20 tokens to earn an ERC20 token.
 */
contract Staking is Ownable {

    // User informations for each pool.
    struct UserInfo {
        uint256 amount;         // Amount of staked token provided
        uint256 depositDate;    // Deposit date for interest calculation
    }

    // Pool informations.
    struct PoolInfo {
        ERC20 token;            // Address of the staked token
        uint256 yield;          // Percentage yield for the pool.
        AggregatorV3Interface priceFeed;    // ChainLink oracle feed for this token
    }

    struct Pool {
        PoolInfo info;
        mapping(address => UserInfo) users;
    }

    // reward token
    IERC20 public rewardToken;

    mapping(address => Pool) public pools;
    address[] private registeredPools;

    event PoolAdded(address tokenPoolAddress, address priceFeed);
    event Staked(address user, address tokenPoolAddress, uint256 amount);
    event Unstaked(address user, address tokenPoolAddress, uint256 amount);

    /**
     * @dev initiate reward token and build the first pool with it.
     * @param _rewardToken : reward token address
     * @param _rewardTokenFeed : reward token feed
     * @param _yield : Percentage reward token yield. This token can be stake too.
     */
    constructor(address _rewardToken, address _rewardTokenFeed, uint256 _yield) {
        rewardToken = IERC20(_rewardToken);
        _addPool(_rewardToken, _rewardTokenFeed, _yield);
    }

    /**
     * @notice get all pools addresses added in contract.
     * @return array of addresses
     * @dev
     */
    function getPools() external view returns (address[] memory) {
        return registeredPools;
    }

    /**
     * @notice This contract is made for staking ERC20 tokens to earn an ERC20 token.
     * @param _token : pool token address
     * @param _user : user address
     * @dev
     */
    function getUserBalanceInPool(address _token, address _user) external view returns (uint256) {
        return pools[_token].users[_user].amount;
    }

    /**
     * @notice get pool balance for contract
     * @param _token : pool token address
     * @return balance
     */
    function getPoolBalance(address _token) external view returns (uint256) {
        return pools[_token].info.token.balanceOf(address(this));
    }

    /**
     * @dev internal method to add a pool
     * @param _token: pool token address
     * @param _priceFeed: pool token feed
     * @param _yield: Percentage token yield.
     */
    function _addPool(address _token, address _priceFeed, uint256 _yield) internal {
        pools[_token].info.token = ERC20(_token);
        pools[_token].info.yield = _yield;
        pools[_token].info.priceFeed = AggregatorV3Interface(_priceFeed);

        registeredPools.push(_token);
    }

    /**
     * @notice method to add a pool. Can only performed by contract's owner
     * @param _token: pool token address
     * @param _priceFeed: pool token feed
     * @param _yield: Percentage token yield.
     */
    function addPool(address _token, address _priceFeed, uint256 _yield) external onlyOwner {
        require(pools[_token].info.token != ERC20(_token), "Pool already exists.");

        _addPool(_token, _priceFeed, _yield);

        emit PoolAdded(_token, _priceFeed);
    }

    /**
     * @notice Stake your token in this pool
     * @param _token: pool token address
     * @param _amount: staked amount
     * @dev Approval is needed before calling this method.
     */
    function stake(address _token, uint256 _amount) external {
        require(_amount > 0, "Non valid amount");
        Pool storage pool = pools[_token];
        UserInfo storage user = pool.users[msg.sender];
        require(user.amount == 0, "Unstack first");
        require(pool.info.token.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        user.amount = _amount;
        user.depositDate = block.timestamp;

        pool.info.token.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _token, _amount);
    }

    /**
     * @param _token: pool token address
     * @param _pool: pool informations
     * @param _user: user informations
     * @dev calculate rewards by staked time in seconds
     */
    function _calculateReward(
        address _token,
        PoolInfo storage _pool,
        UserInfo storage _user
    ) internal view returns (uint256) {
        require(block.timestamp >= _user.depositDate, "Deposit date problem");

        return _user.amount
            * (block.timestamp - _user.depositDate)
            * _pool.yield / 100 / 365 / 24 / 60 / 60  // yield(%) by second
            * uint256(getLastPrice(address(rewardToken))) / uint256(getLastPrice(_token)) // must be return in reward token
        ;
    }

    /**
     * @notice Unstake all in this pool
     * @param _token: pool token address
     */
    function unstake(address _token) external {
        Pool storage pool = pools[_token];
        UserInfo storage user = pools[_token].users[msg.sender];
        require(user.amount > 0, "Nothing to unstake");

        uint256 rewards = _calculateReward(
            _token,
            pool.info,
            user
        );

        uint256 amount = user.amount + rewards;
        user.amount = 0;

        rewardToken.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, _token, amount);
    }

    /**
     * @notice get pending rewards for amount staked
     * @param _token: pool token address
     * @return current rewards for amount staked
     */
    function pendingReward(address _token) external view returns (uint256) {
        Pool storage pool = pools[_token];
        UserInfo storage user = pools[_token].users[msg.sender];

        return _calculateReward(
            _token,
            pool.info,
            user
        );
    }

    /**
     * @notice to retrieve the token's last price
     * @param _token: pool token address
     * @return the last price of this token *
     * @dev /!\ return a signed integer /!\
     */
    function getLastPrice(address _token) public view returns (int) {
        Pool storage pool = pools[_token];
        (,int lastPrice,,,) = pool.info.priceFeed.latestRoundData();

        return lastPrice;
    }
}