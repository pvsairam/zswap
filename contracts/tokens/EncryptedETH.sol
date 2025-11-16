// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract EncryptedETH {
    string public constant name = "ZSwap Ethereum";
    string public constant symbol = "zETH";
    uint8 public constant decimals = 18;
    
    address public immutable backingToken;
    address public immutable zswapPool;
    
    mapping(address => uint128) public encryptedBalances;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EncryptedTransfer(address indexed from, address indexed to);
    
    constructor(address _backingToken, address _zswapPool) {
        backingToken = _backingToken;
        zswapPool = _zswapPool;
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
