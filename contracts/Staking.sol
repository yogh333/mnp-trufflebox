// StakingContract.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

/**
 * @title Staking contract
 * @notice This contract is made for staking ERC20 tokens to earn an ERC20 token.
 * @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
 */
contract StakingContract is Ownable {

    // User information for each pool.
    struct UserInfo {
        uint256 amount;         // Amount of staked token provided
        uint256 depositDate;    // Deposit date for interest calculation
    }

    // Pool information
    struct PoolInfo {
        ERC20 token; // Address of the staked token
        bool isTokenNetwork; // ex. MATIC for Polygon networks
        uint256 yield;          // Percentage yield for the pool.
        AggregatorV3Interface priceFeed;    // ChainLink oracle feed for this token
    }

    struct Pool {
        PoolInfo info;
        mapping(address => UserInfo) users;
    }

    address constant public NETWORK_TOKEN_VIRTUAL_ADDRESS = address(0x1);
    string public networkTokenSymbol;

    // reward token
    IERC20 public rewardToken;

    mapping(address => Pool) public pools;
    address[] private registeredPools;
    mapping(string => address) public poolAddressBySymbol;
    uint256 public networkTokenPoolBalance;

    /**
     * @notice Event emitted when a pool is added
	 * @param tokenPoolAddress address
	 * @param priceFeed address*/
    event PoolAdded(address tokenPoolAddress, address priceFeed);
    /**
     * @notice Event emitted when token is staked
	 * @param user address
	 * @param tokenPoolAddress address
	 * @param amount amount*/
    event Staked(address user, address tokenPoolAddress, uint256 amount);
    /**
     * @notice Event emitted when token is unstaked
	 * @param user address
	 * @param tokenPoolAddress address
	 * @param amount amount*/
    event Unstaked(address user, address tokenPoolAddress, uint256 amount);

    /**
     * @dev initiate reward token and build the first pool with it.
     * @param _rewardToken reward token address
     * @param _rewardTokenFeed reward token feed
     * @param _yield Percentage reward token yield. This token can be stake too.
     * @param _networkTokenSymbol Network token symbol
     */
    constructor(address _rewardToken, address _rewardTokenFeed, uint256 _yield, string memory _networkTokenSymbol) {
        networkTokenSymbol = _networkTokenSymbol;
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
        if (_token == NETWORK_TOKEN_VIRTUAL_ADDRESS) {
            return networkTokenPoolBalance;
        }

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

        if (_token == NETWORK_TOKEN_VIRTUAL_ADDRESS) {
            pools[_token].info.isTokenNetwork = true;
            poolAddressBySymbol[networkTokenSymbol] = _token;

            return;
        }

        string memory symbol = pools[_token].info.token.symbol();
        poolAddressBySymbol[symbol] = _token;
    }

    /**
     * @notice method to add a pool. Can only performed by contract's owner
     * @notice #### requirements :<br />
     * @notice - pool not exists yet
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
     * @notice #### requirements :<br />
     * @notice - amount must be > 0
	 * @notice - user must have nothing staked
	 * @notice - user must have sufficient balance
     * @param _token: pool token address
     * @param _amount: staked amount
     * @dev Approval is needed before calling this method.
     */
    function stake(address _token, uint256 _amount) public payable {
        require(_amount > 0, "Non valid amount");
        Pool storage pool = pools[_token];
        UserInfo storage user = pool.users[msg.sender];
        require(user.amount == 0, "Unstack first");

        if (_token == NETWORK_TOKEN_VIRTUAL_ADDRESS) {
            require(msg.sender.balance >= _amount, "Insufficient balance");
        } else {
            require(pool.info.token.balanceOf(msg.sender) >= _amount, "Insufficient balance");
        }

        user.amount = _amount;
        user.depositDate = block.timestamp;

        if (_token == NETWORK_TOKEN_VIRTUAL_ADDRESS) {
            networkTokenPoolBalance += _amount;
        } else {
            pool.info.token.transferFrom(msg.sender, address(this), _amount);
        }

        emit Staked(msg.sender, _token, _amount);
    }

    /**
     * @param _token: pool token address
     * @param _pool: pool informations
     * @param _user: user informations
     * @dev calculate rewards by staked time in seconds
     * @dev #### requirements :<br />
	 * @dev - block timestamp >= deposit date
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
     * @notice #### requirements :<br />
	 * @notice - user amount staked is positive
	 * @notice - transfer ok
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

        uint256 stakedAmount = user.amount;
        user.amount = 0;

        if (_token == NETWORK_TOKEN_VIRTUAL_ADDRESS) {
            networkTokenPoolBalance -= user.amount;
            (bool sent,) = payable(msg.sender).call{value: stakedAmount}("");
            require(sent, "Failed to send Ether");
        } else {
            pool.info.token.transfer(msg.sender, stakedAmount);
        }

        rewardToken.transfer(msg.sender, rewards);

        emit Unstaked(msg.sender, _token, stakedAmount);
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