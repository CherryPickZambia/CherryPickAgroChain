// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CherryPickNFT
 * @notice NFT certificates for crop traceability - farm to table tracking
 * @dev Each NFT represents a crop batch with complete journey history on Base
 * @author Cherry Pick Team
 */
contract CherryPickNFT is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl, Pausable {
    // ============ Roles ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TRACKER_ROLE = keccak256("TRACKER_ROLE");
    
    // ============ State Variables ============
    uint256 private _tokenIdCounter;
    address public managerContract; // CherryPickManager address
    
    // ============ Enums ============
    enum JourneyStage {
        Planted,      // 0 - Initial planting
        Growing,      // 1 - Growth phase
        Flowering,    // 2 - Flowering/fruiting
        PreHarvest,   // 3 - Quality inspection
        Harvested,    // 4 - Crop harvested
        Processing,   // 5 - Post-harvest processing
        Packaged,     // 6 - Ready for transport
        InTransit,    // 7 - Being transported
        AtRetail,     // 8 - At retail location
        Sold          // 9 - Sold to consumer
    }
    
    // ============ Structs ============
    struct CropBatch {
        uint256 tokenId;
        uint256 contractId;      // Links to CherryPickManager contract
        address farmer;
        string cropType;
        string variety;
        uint256 quantity;        // in kg
        uint256 plantingDate;
        uint256 harvestDate;
        string farmLocation;     // GPS coordinates or location string
        string qrCode;           // Unique QR code identifier
        JourneyStage currentStage;
        bool isOrganic;
        string certifications;
        uint8 qualityGrade;      // 1-5 rating
    }
    
    struct JourneyRecord {
        JourneyStage stage;
        uint256 timestamp;
        address recorder;
        address currentHolder;   // Physical possession
        string location;
        string notes;
        string evidenceIPFS;     // Photos/documents hash
        int8 temperature;        // Celsius (-128 to 127)
        uint8 humidity;          // Percentage (0-100)
    }
    
    // ============ Storage ============
    mapping(uint256 => CropBatch) public cropBatches;
    mapping(uint256 => JourneyRecord[]) public journeyHistory;
    mapping(string => uint256) public qrCodeToToken;
    mapping(uint256 => address) public physicalHolder;
    mapping(address => uint256) public farmerBatchCount;
    
    // ============ Events ============
    event CropBatchMinted(
        uint256 indexed tokenId,
        uint256 indexed contractId,
        address indexed farmer,
        string cropType,
        string qrCode
    );
    
    event JourneyRecorded(
        uint256 indexed tokenId,
        JourneyStage indexed stage,
        address indexed recorder,
        string location
    );
    
    event HolderChanged(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    event QualityGradeSet(
        uint256 indexed tokenId,
        uint8 grade
    );
    
    // ============ Constructor ============
    constructor(address _manager) ERC721("Cherry Pick Crop Certificate", "CHERRY") {
        require(_manager != address(0), "Invalid manager");
        
        managerContract = _manager;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(TRACKER_ROLE, msg.sender);
        
        // Grant roles to manager contract
        _grantRole(MINTER_ROLE, _manager);
    }
    
    // ============ Minting ============
    
    /**
     * @notice Mint a new crop batch NFT certificate
     * @dev Only callable by MINTER_ROLE (manager contract or admin)
     */
    function mintCropBatch(
        uint256 _contractId,
        address _farmer,
        string calldata _cropType,
        string calldata _variety,
        uint256 _quantity,
        string calldata _farmLocation,
        string calldata _qrCode,
        bool _isOrganic,
        string calldata _certifications,
        string calldata _tokenURI
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(_farmer != address(0), "Invalid farmer");
        require(bytes(_cropType).length > 0, "Crop type required");
        require(bytes(_qrCode).length > 0, "QR code required");
        require(qrCodeToToken[_qrCode] == 0, "QR code already used");
        require(_quantity > 0, "Quantity must be positive");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        // Mint NFT to farmer
        _safeMint(_farmer, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Create crop batch record
        cropBatches[tokenId] = CropBatch({
            tokenId: tokenId,
            contractId: _contractId,
            farmer: _farmer,
            cropType: _cropType,
            variety: _variety,
            quantity: _quantity,
            plantingDate: block.timestamp,
            harvestDate: 0,
            farmLocation: _farmLocation,
            qrCode: _qrCode,
            currentStage: JourneyStage.Planted,
            isOrganic: _isOrganic,
            certifications: _certifications,
            qualityGrade: 0
        });
        
        // Set mappings
        qrCodeToToken[_qrCode] = tokenId;
        physicalHolder[tokenId] = _farmer;
        farmerBatchCount[_farmer]++;
        
        // Record initial journey entry
        journeyHistory[tokenId].push(JourneyRecord({
            stage: JourneyStage.Planted,
            timestamp: block.timestamp,
            recorder: msg.sender,
            currentHolder: _farmer,
            location: _farmLocation,
            notes: "Crop batch planted - NFT certificate issued",
            evidenceIPFS: "",
            temperature: 0,
            humidity: 0
        }));
        
        emit CropBatchMinted(tokenId, _contractId, _farmer, _cropType, _qrCode);
        emit JourneyRecorded(tokenId, JourneyStage.Planted, msg.sender, _farmLocation);
        
        return tokenId;
    }
    
    // ============ Journey Tracking ============
    
    /**
     * @notice Record a journey stage update
     */
    function recordJourneyStage(
        uint256 _tokenId,
        JourneyStage _stage,
        string calldata _location,
        string calldata _notes,
        string calldata _evidenceIPFS,
        int8 _temperature,
        uint8 _humidity
    ) external onlyRole(TRACKER_ROLE) whenNotPaused {
        require(_ownerExists(_tokenId), "Token does not exist");
        require(_humidity <= 100, "Invalid humidity");
        
        CropBatch storage batch = cropBatches[_tokenId];
        
        // Validate stage progression (can only move forward or stay same)
        require(uint8(_stage) >= uint8(batch.currentStage), "Cannot go backwards");
        
        batch.currentStage = _stage;
        
        // Set harvest date when harvested
        if (_stage == JourneyStage.Harvested && batch.harvestDate == 0) {
            batch.harvestDate = block.timestamp;
        }
        
        // Record journey entry
        journeyHistory[_tokenId].push(JourneyRecord({
            stage: _stage,
            timestamp: block.timestamp,
            recorder: msg.sender,
            currentHolder: physicalHolder[_tokenId],
            location: _location,
            notes: _notes,
            evidenceIPFS: _evidenceIPFS,
            temperature: _temperature,
            humidity: _humidity
        }));
        
        emit JourneyRecorded(_tokenId, _stage, msg.sender, _location);
    }
    
    /**
     * @notice Transfer physical possession (not NFT ownership)
     */
    function transferPhysicalPossession(
        uint256 _tokenId,
        address _newHolder,
        string calldata _location,
        string calldata _notes
    ) external onlyRole(TRACKER_ROLE) whenNotPaused {
        require(_ownerExists(_tokenId), "Token does not exist");
        require(_newHolder != address(0), "Invalid holder");
        
        address previousHolder = physicalHolder[_tokenId];
        require(_newHolder != previousHolder, "Same holder");
        
        physicalHolder[_tokenId] = _newHolder;
        
        // Record the transfer
        CropBatch storage batch = cropBatches[_tokenId];
        journeyHistory[_tokenId].push(JourneyRecord({
            stage: batch.currentStage,
            timestamp: block.timestamp,
            recorder: msg.sender,
            currentHolder: _newHolder,
            location: _location,
            notes: _notes,
            evidenceIPFS: "",
            temperature: 0,
            humidity: 0
        }));
        
        emit HolderChanged(_tokenId, previousHolder, _newHolder);
    }
    
    /**
     * @notice Set quality grade after inspection
     */
    function setQualityGrade(uint256 _tokenId, uint8 _grade) 
        external 
        onlyRole(TRACKER_ROLE) 
    {
        require(_ownerExists(_tokenId), "Token does not exist");
        require(_grade >= 1 && _grade <= 5, "Grade must be 1-5");
        
        cropBatches[_tokenId].qualityGrade = _grade;
        emit QualityGradeSet(_tokenId, _grade);
    }
    
    // ============ View Functions ============
    
    function getCropBatch(uint256 _tokenId) external view returns (CropBatch memory) {
        require(_ownerExists(_tokenId), "Token does not exist");
        return cropBatches[_tokenId];
    }
    
    function getJourneyHistory(uint256 _tokenId) external view returns (JourneyRecord[] memory) {
        require(_ownerExists(_tokenId), "Token does not exist");
        return journeyHistory[_tokenId];
    }
    
    function getJourneyLength(uint256 _tokenId) external view returns (uint256) {
        return journeyHistory[_tokenId].length;
    }
    
    function getTokenByQRCode(string calldata _qrCode) external view returns (uint256) {
        uint256 tokenId = qrCodeToToken[_qrCode];
        require(tokenId != 0, "QR code not found");
        return tokenId;
    }
    
    function getCurrentHolder(uint256 _tokenId) external view returns (address) {
        require(_ownerExists(_tokenId), "Token does not exist");
        return physicalHolder[_tokenId];
    }
    
    function getFarmerBatches(address _farmer) external view returns (uint256) {
        return farmerBatchCount[_farmer];
    }
    
    function getTotalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @notice Verify crop authenticity by QR code
     */
    function verifyCrop(string calldata _qrCode) external view returns (
        bool exists,
        uint256 tokenId,
        string memory cropType,
        address farmer,
        JourneyStage currentStage,
        uint256 journeySteps
    ) {
        tokenId = qrCodeToToken[_qrCode];
        exists = tokenId != 0;
        
        if (exists) {
            CropBatch memory batch = cropBatches[tokenId];
            cropType = batch.cropType;
            farmer = batch.farmer;
            currentStage = batch.currentStage;
            journeySteps = journeyHistory[tokenId].length;
        }
    }
    
    // ============ Internal Functions ============
    
    function _ownerExists(uint256 tokenId) internal view returns (bool) {
        return cropBatches[tokenId].tokenId != 0;
    }
    
    // ============ Admin Functions ============
    
    function updateManagerContract(address _newManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newManager != address(0), "Invalid address");
        
        // Revoke old, grant new
        _revokeRole(MINTER_ROLE, managerContract);
        _grantRole(MINTER_ROLE, _newManager);
        
        managerContract = _newManager;
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // ============ Required Overrides ============
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
