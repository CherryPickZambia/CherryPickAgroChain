// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AgrochainMarketplace
 * @notice Handles marketplace payments in USDC with a configurable platform fee.
 * @dev Fee is capped at 10% for security.
 */
contract AgrochainMarketplace is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant MAX_FEE_BPS = 1000; // 10% Max Fee (Basis Points)
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============
    IERC20 public immutable usdc;  // USDC Contract
    uint256 public platformFeeBps; // Current fee (e.g., 500 = 5%)
    address public feeTreasury;    // Wallet to receive fees
    
    // ============ Events ============
    event Purchase(
        string indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 totalAmount,
        uint256 sellerAmount,
        uint256 feeAmount
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // ============ Constructor ============
    constructor(address _feeTreasury, uint256 _initialFeeBps, address _usdc) Ownable(msg.sender) {
        require(_feeTreasury != address(0), "Invalid treasury address");
        require(_initialFeeBps <= MAX_FEE_BPS, "Fee exceeds maximum");
        require(_usdc != address(0), "Invalid USDC address");
        
        feeTreasury = _feeTreasury;
        platformFeeBps = _initialFeeBps;
        usdc = IERC20(_usdc);
    }

    // ============ Main Functions ============

    /**
     * @notice Execute a purchase using USDC.
     * @param seller The address of the farmer/seller.
     * @param amount The total amount of USDC to pay (must match order total).
     * @param orderId Unique ID of the order (from database).
     */
    function purchase(address seller, uint256 amount, string calldata orderId) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(seller != address(0), "Invalid seller address");

        // Calculate Fee
        uint256 feeAmount = (amount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 sellerAmount = amount - feeAmount;

        // 1. Transfer Payment from Buyer to Contract (Requires Approval)
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // 2. Transfer Seller Share to Seller
        usdc.safeTransfer(seller, sellerAmount);

        // Fee remains in contract until withdrawn by admin
        
        emit Purchase(
            orderId,
            msg.sender,
            seller,
            amount,
            sellerAmount,
            feeAmount
        );
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the platform fee percentage.
     * @param _newFeeBps New fee in basis points (max 1000).
     */
    function setPlatformFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= MAX_FEE_BPS, "Fee exceeds maximum limit of 10%");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = _newFeeBps;
        emit FeeUpdated(oldFee, _newFeeBps);
    }

    /**
     * @notice Update the fee treasury address.
     */
    function setFeeTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        address oldTreasury = feeTreasury;
        feeTreasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @notice Withdraw accumulated fees to the treasury.
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");

        usdc.safeTransfer(feeTreasury, balance);

        emit FeesWithdrawn(feeTreasury, balance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
