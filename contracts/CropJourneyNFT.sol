// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CropJourneyNFT
 * @notice NFT representing crop traceability from farm to table
 * @dev Each NFT tracks a crop batch's complete journey with immutable records
 */
contract CropJourneyNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TRACKER_ROLE = keccak256("TRACKER_ROLE");
    
    uint256 private _tokenIdCounter;
    
    enum JourneyStage {
        Planted,
        Growing,
        PreHarvest,
        Harvested,
        Processing,
        Packaged,
        InTransit,
        Retail,
        Consumed
    }
    
    struct CropBatch {
        uint256 tokenId;
        uint256 contractId; // Links to farming contract
        address farmer;
        string cropType;
        string variety;
        uint256 quantity; // in kg
        uint256 plantingDate;
        uint256 harvestDate;
        string farmLocation; // GPS coordinates
        string qrCode;
        JourneyStage currentStage;
        bool isOrganic;
        string certifications; // Comma-separated certifications
    }
    
    struct JourneyRecord {
        JourneyStage stage;
        uint256 timestamp;
        address recorder;
        address currentHolder; // Who physically has the crop now
        string location; // GPS coordinates
        string notes;
        string evidenceIPFS; // Photos, documents
        string temperature; // For cold chain tracking
        string humidity;
    }
    
    // Storage
    mapping(uint256 => CropBatch) public cropBatches;
    mapping(uint256 => JourneyRecord[]) public journeyRecords;
    mapping(string => uint256) public qrCodeToTokenId;
    mapping(uint256 => address) public currentPhysicalHolder; // Track physical possession
    
    // Events
    event CropBatchMinted(
        uint256 indexed tokenId,
        uint256 indexed contractId,
        address indexed farmer,
        string cropType,
        string qrCode
    );
    
    event JourneyStageRecorded(
        uint256 indexed tokenId,
        JourneyStage stage,
        address indexed recorder,
        address indexed currentHolder,
        string location
    );
    
    event PhysicalHolderChanged(
        uint256 indexed tokenId,
        address indexed previousHolder,
        address indexed newHolder,
        JourneyStage stage
    );
    
    constructor() ERC721("AgroChain360 Crop Journey", "CROP360") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(TRACKER_ROLE, msg.sender);
    }
    
    /**
     * @notice Mint a new crop batch NFT at planting
     */
    function mintCropBatch(
        uint256 _contractId,
        address _farmer,
        string memory _cropType,
        string memory _variety,
        uint256 _quantity,
        string memory _farmLocation,
        string memory _qrCode,
        bool _isOrganic,
        string memory _certifications,
        string memory _tokenURI
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _safeMint(_farmer, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        
        cropBatches[newTokenId] = CropBatch({
            tokenId: newTokenId,
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
            certifications: _certifications
        });
        
        qrCodeToTokenId[_qrCode] = newTokenId;
        currentPhysicalHolder[newTokenId] = _farmer;
        
        // Record initial journey stage
        journeyRecords[newTokenId].push(JourneyRecord({
            stage: JourneyStage.Planted,
            timestamp: block.timestamp,
            recorder: msg.sender,
            currentHolder: _farmer,
            location: _farmLocation,
            notes: "Crop batch planted and NFT certificate issued to farmer",
            evidenceIPFS: "",
            temperature: "",
            humidity: ""
        }));
        
        emit CropBatchMinted(newTokenId, _contractId, _farmer, _cropType, _qrCode);
        emit JourneyStageRecorded(newTokenId, JourneyStage.Planted, msg.sender, _farmer, _farmLocation);
        
        return newTokenId;
    }
    
    /**
     * @notice Record a new journey stage with optional holder change
     */
    function recordJourneyStage(
        uint256 _tokenId,
        JourneyStage _stage,
        address _newHolder,
        string memory _location,
        string memory _notes,
        string memory _evidenceIPFS,
        string memory _temperature,
        string memory _humidity
    ) external onlyRole(TRACKER_ROLE) {
        require(_exists(_tokenId), "Token does not exist");
        
        CropBatch storage batch = cropBatches[_tokenId];
        batch.currentStage = _stage;
        
        if (_stage == JourneyStage.Harvested && batch.harvestDate == 0) {
            batch.harvestDate = block.timestamp;
        }
        
        // Track physical holder change if provided
        address previousHolder = currentPhysicalHolder[_tokenId];
        if (_newHolder != address(0) && _newHolder != previousHolder) {
            currentPhysicalHolder[_tokenId] = _newHolder;
            emit PhysicalHolderChanged(_tokenId, previousHolder, _newHolder, _stage);
        }
        
        // Use new holder if provided, otherwise keep current
        address holder = _newHolder != address(0) ? _newHolder : previousHolder;
        
        journeyRecords[_tokenId].push(JourneyRecord({
            stage: _stage,
            timestamp: block.timestamp,
            recorder: msg.sender,
            currentHolder: holder,
            location: _location,
            notes: _notes,
            evidenceIPFS: _evidenceIPFS,
            temperature: _temperature,
            humidity: _humidity
        }));
        
        emit JourneyStageRecorded(_tokenId, _stage, msg.sender, holder, _location);
    }
    
    /**
     * @notice Get crop batch details
     */
    function getCropBatch(uint256 _tokenId) external view returns (CropBatch memory) {
        require(_exists(_tokenId), "Token does not exist");
        return cropBatches[_tokenId];
    }
    
    /**
     * @notice Get complete journey records for a token
     */
    function getJourneyRecords(uint256 _tokenId) external view returns (JourneyRecord[] memory) {
        require(_exists(_tokenId), "Token does not exist");
        return journeyRecords[_tokenId];
    }
    
    /**
     * @notice Get token ID by QR code
     */
    function getTokenByQRCode(string memory _qrCode) external view returns (uint256) {
        uint256 tokenId = qrCodeToTokenId[_qrCode];
        require(tokenId != 0, "QR code not found");
        return tokenId;
    }
    
    /**
     * @notice Get current physical holder of the crop batch
     */
    function getCurrentHolder(uint256 _tokenId) external view returns (address) {
        require(_exists(_tokenId), "Token does not exist");
        return currentPhysicalHolder[_tokenId];
    }
    
    /**
     * @notice Get NFT owner (farmer who received the certificate)
     * @dev NFT ownership never changes - farmer keeps their certificate
     */
    function getCertificateOwner(uint256 _tokenId) external view returns (address) {
        require(_exists(_tokenId), "Token does not exist");
        return ownerOf(_tokenId);
    }
    
    /**
     * @notice Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return cropBatches[tokenId].tokenId != 0;
    }
    
    /**
     * @notice Required override for AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
