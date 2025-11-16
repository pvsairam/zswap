// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EncryptedUSDT (Simplified for Deployment)  
 * @notice Simplified version for deployment - stores encrypted balances as uint128
 * 
 * NOTE: This is a deployment-ready version. See EncryptedUSDT.sol for the full
 * FHE implementation with comprehensive comments.
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract EncryptedUSDTSimple {
    string public constant name = "ZSwap Tether USD";
    string public constant symbol = "zUSDT";
    uint8 public constant decimals = 6;
    
    address public immutable backingToken;
    address public zswapPool;
    address public owner;
    bool public poolInitialized;
    
    mapping(address => uint128) public encryptedBalances;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EncryptedTransfer(address indexed from, address indexed to);
    event PoolInitialized(address indexed pool);
    
    constructor(address _backingToken, address _zswapPool) {
        backingToken = _backingToken;
        zswapPool = _zswapPool;
        owner = msg.sender;
        poolInitialized = (_zswapPool != address(0));
    }
    
    function initializePool(address _zswapPool) external {
        require(msg.sender == owner, "Only owner");
        require(!poolInitialized, "Pool already initialized");
        require(_zswapPool != address(0), "Invalid pool address");
        
        zswapPool = _zswapPool;
        poolInitialized = true;
        
        emit PoolInitialized(_zswapPool);
    }
    
    function deposit(uint128 amount) external {
        require(amount > 0, "Cannot deposit zero");
        IERC20(backingToken).transferFrom(msg.sender, address(this), uint256(amount));
        encryptedBalances[msg.sender] += amount;
        emit Deposit(msg.sender, uint256(amount));
    }
    
    function withdraw(uint128 amount) external {
        require(amount > 0, "Cannot withdraw zero");
        require(encryptedBalances[msg.sender] >= amount, "Insufficient balance");
        
        encryptedBalances[msg.sender] -= amount;
        IERC20(backingToken).transfer(msg.sender, uint256(amount));
        emit Withdraw(msg.sender, uint256(amount));
    }
    
    function transferEncrypted(address from, address to, uint128 amount) external {
        require(msg.sender == zswapPool, "Only ZSwap pool can transfer");
        require(encryptedBalances[from] >= amount, "Insufficient balance");
        
        encryptedBalances[from] -= amount;
        encryptedBalances[to] += amount;
        
        emit EncryptedTransfer(from, to);
    }
    
    function balanceOf(address user) external view returns (uint128) {
        return encryptedBalances[user];
    }
}
