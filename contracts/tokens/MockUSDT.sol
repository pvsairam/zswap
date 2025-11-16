// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockUSDT
 * @notice This is a test version of USDT (Tether) for development and testing purposes.
 * 
 * WHY THIS EXISTS:
 * - We need a fake USDT token to test token swaps in ZSwap
 * - This is identical to MockUSDC except for the name and symbol
 * - Having both USDC and USDT lets us test swapping between different stablecoins
 * 
 * WHAT THIS DOES:
 * - Provides a free test version of USDT
 * - Anyone can mint unlimited tokens for testing
 * - Works exactly like real USDT (transfer, approve, etc.)
 * 
 * SECURITY NOTE:
 * - ⚠️ TESTING ONLY! Never deploy this on mainnet
 * - Public minting is intentional for testing but dangerous in production
 */
contract MockUSDT {
    // Token information
    string public constant name = "Mock Tether USD";
    string public constant symbol = "mUSDT";
    uint8 public constant decimals = 6;  // USDT uses 6 decimals like USDC
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**
     * @notice Create new test USDT tokens
     * @param to Address receiving the tokens
     * @param amount Number of tokens to create (6 decimals)
     * 
     * Same as MockUSDC.mint() - see that contract for detailed comments
     */
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @notice Send tokens to another address
     * See MockUSDC.transfer() for detailed explanation
     */
    function transfer(address to, uint256 amount) external returns (bool success) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @notice Approve someone to spend your tokens
     * See MockUSDC.approve() for detailed explanation
     */
    function approve(address spender, uint256 amount) external returns (bool success) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens on behalf of someone (with their approval)
     * See MockUSDC.transferFrom() for detailed explanation
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool success) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}
