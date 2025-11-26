// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CherryPickManager
 * @notice Main contract for managing farming contracts with milestone-based payments
 * @dev Implements escrow, milestone verification, and automated payments on Base network
 * @author Cherry Pick Team
 */
contract CherryPickManager is AccessControl, ReentrancyGuard, Pausable {
    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // ============ Constants ============
    uint256 public constant PLATFORM_FEE_BPS = 200; // 2% in basis points
    uint256 public constant VERIFIER_FEE_BPS = 50;  // 0.5% to verifier
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // ============ State Variables ============
    uint256 public contractCounter;
    uint256 public totalPlatformFees;
    address public platformWallet;
    
    // ============ Enums ============
    enum ContractStatus { Active, Completed, Cancelled, Disputed }
    enum MilestoneStatus { Pending, Submitted, Verified, Rejected, Paid }
    
    // ============ Structs ============
    struct FarmingContract {
        uint256 id;
        address farmer;
        address buyer;
        string cropType;
        string variety;
        uint256 requiredQuantity;    // in kg
        uint256 pricePerKg;          // in wei
        uint256 totalValue;
        uint256 escrowBalance;
        uint256 platformFeePaid;
        ContractStatus status;
        uint256 createdAt;
        uint256 harvestDeadline;
        string ipfsMetadata;
        uint8 milestoneCount;
        uint8 completedMilestones;
    }
    
    struct Milestone {
        uint256 id;
        uint256 contractId;
        string name;
        string description;
        uint256 paymentPercentage;   // Out of 100
        uint256 paymentAmount;       // Pre-calculated payment in wei
        uint256 expectedDate;
        uint256 completedDate;
        MilestoneStatus status;
        address verifier;
        string farmerEvidenceIPFS;
        string verifierEvidenceIPFS;
    }
    
    struct Verifier {
        bool isActive;
        uint256 totalVerifications;
        uint256 approvedCount;
        uint256 rejectedCount;
        uint256 totalEarnings;
        uint256 reputation;          // Score 0-100
        uint256 registeredAt;
    }
    
    // ============ Storage ============
    mapping(uint256 => FarmingContract) public contracts;
    mapping(uint256 => Milestone[]) public contractMilestones;
    mapping(address => uint256[]) public farmerContracts;
    mapping(address => uint256[]) public buyerContracts;
    mapping(address => Verifier) public verifiers;
    address[] public verifierList;
    
    // ============ Events ============
    event ContractCreated(
        uint256 indexed contractId,
        address indexed farmer,
        address indexed buyer,
        string cropType,
        uint256 totalValue
    );
    
    event MilestonesAdded(
        uint256 indexed contractId,
        uint8 count
    );
    
    event MilestoneSubmitted(
        uint256 indexed contractId,
        uint256 indexed milestoneId,
        address indexed farmer,
        string evidenceIPFS
    );
    
    event MilestoneVerified(
        uint256 indexed contractId,
        uint256 indexed milestoneId,
        address indexed verifier,
        bool approved
    );
    
    event PaymentReleased(
        uint256 indexed contractId,
        uint256 indexed milestoneId,
        address indexed farmer,
        uint256 amount
    );
    
    event ContractCompleted(uint256 indexed contractId);
    event ContractCancelled(uint256 indexed contractId, string reason);
    event VerifierRegistered(address indexed verifier);
    event VerifierDeactivated(address indexed verifier);
    event PlatformFeesWithdrawn(uint256 amount, address to);
    
    // ============ Modifiers ============
    modifier contractExists(uint256 _contractId) {
        require(contracts[_contractId].id != 0, "Contract does not exist");
        _;
    }
    
    modifier onlyActiveFarmer(uint256 _contractId) {
        require(contracts[_contractId].farmer == msg.sender, "Not the farmer");
        require(contracts[_contractId].status == ContractStatus.Active, "Contract not active");
        _;
    }
    
    modifier onlyActiveVerifier() {
        require(verifiers[msg.sender].isActive, "Not an active verifier");
        _;
    }
    
    // ============ Constructor ============
    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        
        platformWallet = _platformWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        // Register deployer as verifier
        _registerVerifier(msg.sender);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Register a new extension officer as verifier
     * @param _verifier Address of the verifier
     */
    function registerVerifier(address _verifier) external onlyRole(ADMIN_ROLE) {
        _registerVerifier(_verifier);
    }
    
    function _registerVerifier(address _verifier) internal {
        require(_verifier != address(0), "Invalid address");
        require(!verifiers[_verifier].isActive, "Already registered");
        
        verifiers[_verifier] = Verifier({
            isActive: true,
            totalVerifications: 0,
            approvedCount: 0,
            rejectedCount: 0,
            totalEarnings: 0,
            reputation: 50, // Start at 50/100
            registeredAt: block.timestamp
        });
        
        verifierList.push(_verifier);
        _grantRole(VERIFIER_ROLE, _verifier);
        
        emit VerifierRegistered(_verifier);
    }
    
    /**
     * @notice Deactivate a verifier
     */
    function deactivateVerifier(address _verifier) external onlyRole(ADMIN_ROLE) {
        require(verifiers[_verifier].isActive, "Not active");
        verifiers[_verifier].isActive = false;
        _revokeRole(VERIFIER_ROLE, _verifier);
        emit VerifierDeactivated(_verifier);
    }
    
    /**
     * @notice Withdraw accumulated platform fees
     */
    function withdrawPlatformFees() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 amount = totalPlatformFees;
        require(amount > 0, "No fees to withdraw");
        
        totalPlatformFees = 0;
        
        (bool success, ) = platformWallet.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PlatformFeesWithdrawn(amount, platformWallet);
    }
    
    /**
     * @notice Update platform wallet address
     */
    function updatePlatformWallet(address _newWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }
    
    // ============ Contract Creation ============
    
    /**
     * @notice Create a new farming contract with escrow
     * @param _farmer Address of the farmer
     * @param _cropType Type of crop
     * @param _variety Variety of the crop
     * @param _requiredQuantity Quantity in kg
     * @param _pricePerKg Price per kg in wei
     * @param _harvestDeadline Unix timestamp for harvest deadline
     * @param _ipfsMetadata IPFS hash for additional metadata
     */
    function createContract(
        address _farmer,
        string calldata _cropType,
        string calldata _variety,
        uint256 _requiredQuantity,
        uint256 _pricePerKg,
        uint256 _harvestDeadline,
        string calldata _ipfsMetadata
    ) external payable whenNotPaused returns (uint256) {
        require(_farmer != address(0), "Invalid farmer address");
        require(_farmer != msg.sender, "Buyer cannot be farmer");
        require(_requiredQuantity > 0, "Quantity must be positive");
        require(_pricePerKg > 0, "Price must be positive");
        require(_harvestDeadline > block.timestamp, "Deadline must be future");
        require(bytes(_cropType).length > 0, "Crop type required");
        
        uint256 totalValue = _requiredQuantity * _pricePerKg;
        uint256 platformFee = (totalValue * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 requiredDeposit = totalValue + platformFee;
        
        require(msg.value >= requiredDeposit, "Insufficient escrow");
        
        contractCounter++;
        uint256 contractId = contractCounter;
        
        contracts[contractId] = FarmingContract({
            id: contractId,
            farmer: _farmer,
            buyer: msg.sender,
            cropType: _cropType,
            variety: _variety,
            requiredQuantity: _requiredQuantity,
            pricePerKg: _pricePerKg,
            totalValue: totalValue,
            escrowBalance: totalValue,
            platformFeePaid: platformFee,
            status: ContractStatus.Active,
            createdAt: block.timestamp,
            harvestDeadline: _harvestDeadline,
            ipfsMetadata: _ipfsMetadata,
            milestoneCount: 0,
            completedMilestones: 0
        });
        
        // Add platform fee to accumulated fees
        totalPlatformFees += platformFee;
        
        farmerContracts[_farmer].push(contractId);
        buyerContracts[msg.sender].push(contractId);
        
        // Refund excess payment
        if (msg.value > requiredDeposit) {
            (bool success, ) = msg.sender.call{value: msg.value - requiredDeposit}("");
            require(success, "Refund failed");
        }
        
        emit ContractCreated(contractId, _farmer, msg.sender, _cropType, totalValue);
        
        return contractId;
    }
    
    /**
     * @notice Add milestones to a contract (batch operation)
     * @param _contractId Contract ID
     * @param _names Array of milestone names
     * @param _descriptions Array of descriptions
     * @param _paymentPercentages Array of payment percentages (must sum to 100)
     * @param _expectedDates Array of expected completion dates
     */
    function addMilestones(
        uint256 _contractId,
        string[] calldata _names,
        string[] calldata _descriptions,
        uint256[] calldata _paymentPercentages,
        uint256[] calldata _expectedDates
    ) external contractExists(_contractId) {
        FarmingContract storage fc = contracts[_contractId];
        require(msg.sender == fc.buyer || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(fc.status == ContractStatus.Active, "Contract not active");
        require(fc.milestoneCount == 0, "Milestones already added");
        require(_names.length > 0 && _names.length <= 10, "Invalid milestone count");
        require(
            _names.length == _descriptions.length &&
            _names.length == _paymentPercentages.length &&
            _names.length == _expectedDates.length,
            "Array length mismatch"
        );
        
        // Verify percentages sum to 100
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _paymentPercentages.length; i++) {
            totalPercentage += _paymentPercentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to 100");
        
        // Create milestones
        for (uint256 i = 0; i < _names.length; i++) {
            uint256 paymentAmount = (fc.totalValue * _paymentPercentages[i]) / 100;
            
            contractMilestones[_contractId].push(Milestone({
                id: i,
                contractId: _contractId,
                name: _names[i],
                description: _descriptions[i],
                paymentPercentage: _paymentPercentages[i],
                paymentAmount: paymentAmount,
                expectedDate: _expectedDates[i],
                completedDate: 0,
                status: MilestoneStatus.Pending,
                verifier: address(0),
                farmerEvidenceIPFS: "",
                verifierEvidenceIPFS: ""
            }));
        }
        
        fc.milestoneCount = uint8(_names.length);
        
        emit MilestonesAdded(_contractId, uint8(_names.length));
    }
    
    // ============ Farmer Functions ============
    
    /**
     * @notice Farmer submits evidence for milestone completion
     */
    function submitMilestoneEvidence(
        uint256 _contractId,
        uint256 _milestoneId,
        string calldata _evidenceIPFS
    ) external contractExists(_contractId) onlyActiveFarmer(_contractId) {
        require(_milestoneId < contractMilestones[_contractId].length, "Invalid milestone");
        require(bytes(_evidenceIPFS).length > 0, "Evidence required");
        
        Milestone storage milestone = contractMilestones[_contractId][_milestoneId];
        require(milestone.status == MilestoneStatus.Pending || milestone.status == MilestoneStatus.Rejected, "Cannot submit");
        
        // Check previous milestone is completed (except for first)
        if (_milestoneId > 0) {
            require(
                contractMilestones[_contractId][_milestoneId - 1].status == MilestoneStatus.Paid,
                "Previous milestone not completed"
            );
        }
        
        milestone.farmerEvidenceIPFS = _evidenceIPFS;
        milestone.status = MilestoneStatus.Submitted;
        milestone.completedDate = block.timestamp;
        
        emit MilestoneSubmitted(_contractId, _milestoneId, msg.sender, _evidenceIPFS);
    }
    
    // ============ Verifier Functions ============
    
    /**
     * @notice Verifier verifies milestone completion
     */
    function verifyMilestone(
        uint256 _contractId,
        uint256 _milestoneId,
        bool _approved,
        string calldata _verifierEvidenceIPFS
    ) external contractExists(_contractId) onlyRole(VERIFIER_ROLE) onlyActiveVerifier nonReentrant {
        require(_milestoneId < contractMilestones[_contractId].length, "Invalid milestone");
        
        Milestone storage milestone = contractMilestones[_contractId][_milestoneId];
        require(milestone.status == MilestoneStatus.Submitted, "Not submitted");
        
        milestone.verifier = msg.sender;
        milestone.verifierEvidenceIPFS = _verifierEvidenceIPFS;
        
        // Update verifier stats
        Verifier storage v = verifiers[msg.sender];
        v.totalVerifications++;
        
        if (_approved) {
            milestone.status = MilestoneStatus.Verified;
            v.approvedCount++;
            
            // Release payment to farmer
            _releaseMilestonePayment(_contractId, _milestoneId);
        } else {
            milestone.status = MilestoneStatus.Rejected;
            v.rejectedCount++;
        }
        
        // Update reputation (simple formula)
        if (v.totalVerifications > 0) {
            v.reputation = (v.approvedCount * 100) / v.totalVerifications;
            if (v.reputation > 100) v.reputation = 100;
        }
        
        emit MilestoneVerified(_contractId, _milestoneId, msg.sender, _approved);
    }
    
    /**
     * @notice Internal function to release milestone payment
     */
    function _releaseMilestonePayment(uint256 _contractId, uint256 _milestoneId) internal {
        FarmingContract storage fc = contracts[_contractId];
        Milestone storage milestone = contractMilestones[_contractId][_milestoneId];
        
        uint256 paymentAmount = milestone.paymentAmount;
        require(fc.escrowBalance >= paymentAmount, "Insufficient escrow");
        
        // Calculate verifier fee
        uint256 verifierFee = (paymentAmount * VERIFIER_FEE_BPS) / BPS_DENOMINATOR;
        uint256 farmerPayment = paymentAmount - verifierFee;
        
        fc.escrowBalance -= paymentAmount;
        fc.completedMilestones++;
        milestone.status = MilestoneStatus.Paid;
        
        // Update verifier earnings
        verifiers[msg.sender].totalEarnings += verifierFee;
        
        // Transfer to farmer
        (bool farmerSuccess, ) = fc.farmer.call{value: farmerPayment}("");
        require(farmerSuccess, "Farmer payment failed");
        
        // Transfer to verifier
        (bool verifierSuccess, ) = msg.sender.call{value: verifierFee}("");
        require(verifierSuccess, "Verifier payment failed");
        
        emit PaymentReleased(_contractId, _milestoneId, fc.farmer, farmerPayment);
        
        // Check if contract is complete
        if (fc.completedMilestones == fc.milestoneCount) {
            fc.status = ContractStatus.Completed;
            emit ContractCompleted(_contractId);
        }
    }
    
    // ============ View Functions ============
    
    function getContract(uint256 _contractId) external view returns (FarmingContract memory) {
        return contracts[_contractId];
    }
    
    function getContractMilestones(uint256 _contractId) external view returns (Milestone[] memory) {
        return contractMilestones[_contractId];
    }
    
    function getFarmerContracts(address _farmer) external view returns (uint256[] memory) {
        return farmerContracts[_farmer];
    }
    
    function getBuyerContracts(address _buyer) external view returns (uint256[] memory) {
        return buyerContracts[_buyer];
    }
    
    function getVerifier(address _verifier) external view returns (Verifier memory) {
        return verifiers[_verifier];
    }
    
    function getVerifierCount() external view returns (uint256) {
        return verifierList.length;
    }
    
    function getContractStats() external view returns (
        uint256 totalContracts,
        uint256 platformFeesAccumulated
    ) {
        return (contractCounter, totalPlatformFees);
    }
    
    // ============ Emergency Functions ============
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Cancel contract and refund escrow (admin only, for emergencies)
     */
    function cancelContract(uint256 _contractId, string calldata _reason) 
        external 
        contractExists(_contractId) 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        FarmingContract storage fc = contracts[_contractId];
        require(fc.status == ContractStatus.Active, "Not active");
        
        fc.status = ContractStatus.Cancelled;
        
        // Refund remaining escrow to buyer
        if (fc.escrowBalance > 0) {
            uint256 refund = fc.escrowBalance;
            fc.escrowBalance = 0;
            
            (bool success, ) = fc.buyer.call{value: refund}("");
            require(success, "Refund failed");
        }
        
        emit ContractCancelled(_contractId, _reason);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
