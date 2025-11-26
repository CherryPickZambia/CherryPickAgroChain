// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AgroChain360 Contract Manager
 * @notice Main contract for managing farming contracts with milestone-based payments
 * @dev Implements escrow, milestone verification, and automated payments
 */
contract AgroChain360ContractManager is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    uint256 public contractCounter;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2; // 2%
    uint256 public constant VERIFICATION_FEE = 0.001 ether; // Fee per verification
    
    enum ContractStatus { Active, Completed, Cancelled, Disputed }
    enum MilestoneStatus { Pending, Submitted, Verified, Rejected, Paid }
    
    struct FarmingContract {
        uint256 id;
        address farmer;
        address buyer;
        string cropType;
        string variety;
        uint256 requiredQuantity; // in kg
        uint256 pricePerKg; // in wei
        uint256 totalValue;
        uint256 escrowBalance;
        ContractStatus status;
        uint256 createdAt;
        uint256 harvestDeadline;
        string ipfsMetadata; // Additional contract details stored on IPFS
    }
    
    struct Milestone {
        uint256 id;
        uint256 contractId;
        string name;
        string description;
        uint256 paymentPercentage; // Percentage of total contract value
        uint256 expectedDate;
        uint256 completedDate;
        MilestoneStatus status;
        address verifier;
        string farmerEvidenceIPFS;
        string verifierEvidenceIPFS;
        uint256 verificationDate;
    }
    
    struct VerificationTask {
        uint256 milestoneId;
        address assignedOfficer;
        uint256 createdAt;
        uint256 completedAt;
        bool isCompleted;
        string location; // Lat,Lng coordinates
    }
    
    // Storage
    mapping(uint256 => FarmingContract) public contracts;
    mapping(uint256 => Milestone[]) public contractMilestones;
    mapping(uint256 => VerificationTask) public verificationTasks;
    mapping(address => uint256[]) public farmerContracts;
    mapping(address => uint256[]) public buyerContracts;
    mapping(address => uint256) public verifierEarnings;
    mapping(address => uint256) public verifierReputation; // Score out of 100
    
    // Events
    event ContractCreated(
        uint256 indexed contractId,
        address indexed farmer,
        address indexed buyer,
        string cropType,
        uint256 totalValue
    );
    
    event MilestoneCreated(
        uint256 indexed contractId,
        uint256 indexed milestoneId,
        string name,
        uint256 paymentPercentage
    );
    
    event MilestoneSubmitted(
        uint256 indexed contractId,
        uint256 indexed milestoneId,
        address indexed farmer,
        string evidenceIPFS
    );
    
    event VerificationTaskCreated(
        uint256 indexed milestoneId,
        address indexed officer,
        string location
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
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @notice Create a new farming contract
     */
    function createContract(
        address _farmer,
        string memory _cropType,
        string memory _variety,
        uint256 _requiredQuantity,
        uint256 _pricePerKg,
        uint256 _harvestDeadline,
        string memory _ipfsMetadata
    ) external payable onlyRole(ADMIN_ROLE) returns (uint256) {
        uint256 totalValue = _requiredQuantity * _pricePerKg;
        require(msg.value >= totalValue, "Insufficient escrow funds");
        
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
            escrowBalance: msg.value,
            status: ContractStatus.Active,
            createdAt: block.timestamp,
            harvestDeadline: _harvestDeadline,
            ipfsMetadata: _ipfsMetadata
        });
        
        farmerContracts[_farmer].push(contractId);
        buyerContracts[msg.sender].push(contractId);
        
        emit ContractCreated(contractId, _farmer, msg.sender, _cropType, totalValue);
        
        return contractId;
    }
    
    /**
     * @notice Add milestone to a contract
     */
    function addMilestone(
        uint256 _contractId,
        string memory _name,
        string memory _description,
        uint256 _paymentPercentage,
        uint256 _expectedDate
    ) external onlyRole(ADMIN_ROLE) {
        require(contracts[_contractId].status == ContractStatus.Active, "Contract not active");
        
        uint256 milestoneId = contractMilestones[_contractId].length;
        
        contractMilestones[_contractId].push(Milestone({
            id: milestoneId,
            contractId: _contractId,
            name: _name,
            description: _description,
            paymentPercentage: _paymentPercentage,
            expectedDate: _expectedDate,
            completedDate: 0,
            status: MilestoneStatus.Pending,
            verifier: address(0),
            farmerEvidenceIPFS: "",
            verifierEvidenceIPFS: "",
            verificationDate: 0
        }));
        
        emit MilestoneCreated(_contractId, milestoneId, _name, _paymentPercentage);
    }
    
    /**
     * @notice Farmer submits evidence for milestone completion
     */
    function submitMilestoneEvidence(
        uint256 _contractId,
        uint256 _milestoneId,
        string memory _evidenceIPFS
    ) external {
        FarmingContract storage farmContract = contracts[_contractId];
        require(msg.sender == farmContract.farmer, "Only farmer can submit");
        require(farmContract.status == ContractStatus.Active, "Contract not active");
        
        Milestone storage milestone = contractMilestones[_contractId][_milestoneId];
        require(milestone.status == MilestoneStatus.Pending, "Milestone not pending");
        
        milestone.farmerEvidenceIPFS = _evidenceIPFS;
        milestone.status = MilestoneStatus.Submitted;
        milestone.completedDate = block.timestamp;
        
        emit MilestoneSubmitted(_contractId, _milestoneId, msg.sender, _evidenceIPFS);
    }
    
    /**
     * @notice Verifier verifies milestone completion
     */
    function verifyMilestone(
        uint256 _contractId,
        uint256 _milestoneId,
        bool _approved,
        string memory _verifierEvidenceIPFS
    ) external onlyRole(VERIFIER_ROLE) nonReentrant {
        Milestone storage milestone = contractMilestones[_contractId][_milestoneId];
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");
        
        milestone.verifier = msg.sender;
        milestone.verifierEvidenceIPFS = _verifierEvidenceIPFS;
        milestone.verificationDate = block.timestamp;
        
        if (_approved) {
            milestone.status = MilestoneStatus.Verified;
            _releaseMilestonePayment(_contractId, _milestoneId);
        } else {
            milestone.status = MilestoneStatus.Rejected;
        }
        
        emit MilestoneVerified(_contractId, _milestoneId, msg.sender, _approved);
    }
    
    /**
     * @notice Internal function to release milestone payment
     */
    function _releaseMilestonePayment(uint256 _contractId, uint256 _milestoneId) internal {
        FarmingContract storage farmContract = contracts[_contractId];
        Milestone storage milestone = contractMilestones[_contractId][_milestoneId];
        
        uint256 paymentAmount = (farmContract.totalValue * milestone.paymentPercentage) / 100;
        require(farmContract.escrowBalance >= paymentAmount, "Insufficient escrow balance");
        
        farmContract.escrowBalance -= paymentAmount;
        milestone.status = MilestoneStatus.Paid;
        
        // Transfer payment to farmer
        (bool success, ) = farmContract.farmer.call{value: paymentAmount}("");
        require(success, "Payment transfer failed");
        
        emit PaymentReleased(_contractId, _milestoneId, farmContract.farmer, paymentAmount);
    }
    
    /**
     * @notice Get contract details
     */
    function getContract(uint256 _contractId) external view returns (FarmingContract memory) {
        return contracts[_contractId];
    }
    
    /**
     * @notice Get all milestones for a contract
     */
    function getContractMilestones(uint256 _contractId) external view returns (Milestone[] memory) {
        return contractMilestones[_contractId];
    }
    
    /**
     * @notice Pause contract (emergency)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
