// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockUSDC
 * @notice This is a test version of USDC for development and testing purposes.
 * 
 * WHY THIS EXISTS:
 * - We need a fake USDC token to test the ZSwap application without using real money
 * - This allows anyone to get free test tokens for development
 * - Real USDC can only be obtained from official sources, but we need unlimited test tokens
 * 
 * WHAT THIS DOES:
 * - Anyone can mint (create) free USDC tokens for testing
 * - Tokens work exactly like real USDC (you can transfer, approve, etc.)
 * - Has 6 decimal places, just like real USDC ($1.00 = 1,000,000 tokens)
 * 
 * SECURITY NOTE:
 * - ⚠️ This is ONLY for testing! Never use this on mainnet (real Ethereum)
 * - Anyone can mint tokens - this is intentional for testing but would be disastrous on mainnet
 */
contract MockUSDC {
    // Token information
    string public constant name = "Mock USD Coin";
    string public constant symbol = "mUSDC";
    uint8 public constant decimals = 6;  // USDC uses 6 decimals (not 18 like most tokens)
    
    // Total supply tracking - how many tokens exist in total
    uint256 public totalSupply;
    
    // Balance tracking - how many tokens each address owns
    mapping(address => uint256) public balanceOf;
    
    // Allowance tracking - how much can others spend on your behalf
    // Example: balanceOf[Alice][Bob] = 100 means Bob can spend 100 of Alice's tokens
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Events - these are like notifications that get logged on the blockchain
    // Wallets and apps listen to these to update their displays
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**
     * @notice Mint (create) new tokens for anyone who asks
     * @param to The address that will receive the new tokens
     * @param amount How many tokens to create (in USDC units with 6 decimals)
     * 
     * EXAMPLE: 
     * - To mint $100 worth of USDC, call mint(yourAddress, 100_000_000)
     * - The 6 zeros are because USDC has 6 decimal places
     * 
     * WHY NO ACCESS CONTROL:
     * - This is a test token, so anyone can mint for easy testing
     * - Real USDC has strict controls - only the issuer can mint
     * 
     * WHAT HAPPENS:
     * 1. Increases the recipient's balance
     * 2. Increases total supply (more tokens now exist)
     * 3. Emits a Transfer event from address(0) to show tokens were created
     */
    function mint(address to, uint256 amount) external {
        // Add tokens to the recipient's balance
        balanceOf[to] += amount;
        
        // Increase total supply since we created new tokens
        totalSupply += amount;
        
        // Log the creation - Transfer from address(0) means "minted from nothing"
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @notice Transfer tokens from your account to another address
     * @param to The recipient's address
     * @param amount How many tokens to send
     * @return success True if the transfer worked, false otherwise
     * 
     * SECURITY:
     * - You must have enough balance or the transfer will fail
     * - Prevents sending to address(0) which would destroy tokens
     * 
     * EXAMPLE:
     * - transfer(bobAddress, 50_000_000) sends $50 USDC to Bob
     */
    function transfer(address to, uint256 amount) external returns (bool success) {
        // Don't allow sending to the zero address (would destroy tokens)
        require(to != address(0), "Cannot transfer to zero address");
        
        // Make sure sender has enough tokens
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        // Subtract from sender
        balanceOf[msg.sender] -= amount;
        
        // Add to recipient
        balanceOf[to] += amount;
        
        // Log the transfer
        emit Transfer(msg.sender, to, amount);
        
        return true;
    }
    
    /**
     * @notice Allow someone else to spend your tokens (useful for contracts)
     * @param spender The address that can spend your tokens
     * @param amount How many tokens they can spend
     * @return success True if approval worked
     * 
     * WHY THIS EXISTS:
     * - Allows smart contracts (like ZSwap) to move your tokens
     * - You approve once, then the contract can transfer when needed
     * 
     * EXAMPLE USE CASE:
     * 1. You call approve(zSwapAddress, 1000_000_000) - approve $1000 USDC
     * 2. Later, ZSwap contract can call transferFrom to move your USDC
     * 3. This is better than sending tokens directly because contracts can program complex logic
     * 
     * SECURITY:
     * - Be careful! Only approve contracts you trust
     * - The approved address can spend up to this amount whenever they want
     */
    function approve(address spender, uint256 amount) external returns (bool success) {
        // Set the allowance - how much this spender can use
        allowance[msg.sender][spender] = amount;
        
        // Log the approval
        emit Approval(msg.sender, spender, amount);
        
        return true;
    }
    
    /**
     * @notice Transfer tokens on behalf of someone else (if you have their approval)
     * @param from The address to take tokens from
     * @param to The address to send tokens to
     * @param amount How many tokens to transfer
     * @return success True if the transfer worked
     * 
     * WHO CAN CALL THIS:
     * - Anyone who has been approved by the 'from' address
     * - Most commonly called by smart contracts
     * 
     * WHAT HAPPENS:
     * 1. Checks that you have approval to spend 'from's tokens
     * 2. Checks that 'from' has enough balance
     * 3. Reduces your allowance by the amount transferred
     * 4. Moves tokens from 'from' to 'to'
     * 
     * SECURITY:
     * - Automatically reduces allowance to prevent over-spending
     * - Requires prior approval, preventing unauthorized transfers
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool success) {
        // Don't allow sending to the zero address
        require(to != address(0), "Cannot transfer to zero address");
        
        // Make sure the owner has enough tokens
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        // Make sure the spender has enough allowance
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        // Reduce the allowance
        allowance[from][msg.sender] -= amount;
        
        // Subtract from owner
        balanceOf[from] -= amount;
        
        // Add to recipient
        balanceOf[to] += amount;
        
        // Log the transfer
        emit Transfer(from, to, amount);
        
        return true;
    }
}
