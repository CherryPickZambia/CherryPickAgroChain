/**
 * ABI for CropJourneyNFT Contract
 * Generated from Solidity contract compilation
 */

export const CropJourneyNFTABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "farmer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "cropType", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "qrCode", "type": "string" }
    ],
    "name": "CropBatchMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "enum CropJourneyNFT.JourneyStage", "name": "stage", "type": "uint8" },
      { "indexed": true, "internalType": "address", "name": "recorder", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "location", "type": "string" }
    ],
    "name": "JourneyStageRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "enum CropJourneyNFT.JourneyStage", "name": "stage", "type": "uint8" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" },
      { "internalType": "address", "name": "_farmer", "type": "address" },
      { "internalType": "string", "name": "_cropType", "type": "string" },
      { "internalType": "string", "name": "_variety", "type": "string" },
      { "internalType": "uint256", "name": "_quantity", "type": "uint256" },
      { "internalType": "string", "name": "_farmLocation", "type": "string" },
      { "internalType": "string", "name": "_qrCode", "type": "string" },
      { "internalType": "bool", "name": "_isOrganic", "type": "bool" },
      { "internalType": "string", "name": "_certifications", "type": "string" },
      { "internalType": "string", "name": "_metadataURI", "type": "string" }
    ],
    "name": "mintCropBatch",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tokenId", "type": "uint256" },
      { "internalType": "enum CropJourneyNFT.JourneyStage", "name": "_stage", "type": "uint8" },
      { "internalType": "string", "name": "_location", "type": "string" },
      { "internalType": "string", "name": "_notes", "type": "string" },
      { "internalType": "string", "name": "_evidenceIPFS", "type": "string" },
      { "internalType": "string", "name": "_temperature", "type": "string" },
      { "internalType": "string", "name": "_humidity", "type": "string" }
    ],
    "name": "recordJourneyStage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tokenId", "type": "uint256" },
      { "internalType": "address", "name": "_to", "type": "address" },
      { "internalType": "enum CropJourneyNFT.JourneyStage", "name": "_stage", "type": "uint8" }
    ],
    "name": "transferCropBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_qrCode", "type": "string" }
    ],
    "name": "getCropBatchByQR",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
          { "internalType": "uint256", "name": "contractId", "type": "uint256" },
          { "internalType": "address", "name": "farmer", "type": "address" },
          { "internalType": "string", "name": "cropType", "type": "string" },
          { "internalType": "string", "name": "variety", "type": "string" },
          { "internalType": "uint256", "name": "quantity", "type": "uint256" },
          { "internalType": "uint256", "name": "plantingDate", "type": "uint256" },
          { "internalType": "uint256", "name": "harvestDate", "type": "uint256" },
          { "internalType": "string", "name": "farmLocation", "type": "string" },
          { "internalType": "string", "name": "qrCode", "type": "string" },
          { "internalType": "enum CropJourneyNFT.JourneyStage", "name": "currentStage", "type": "uint8" },
          { "internalType": "bool", "name": "isOrganic", "type": "bool" },
          { "internalType": "string", "name": "certifications", "type": "string" }
        ],
        "internalType": "struct CropJourneyNFT.CropBatch",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tokenId", "type": "uint256" }
    ],
    "name": "getJourneyHistory",
    "outputs": [
      {
        "components": [
          { "internalType": "enum CropJourneyNFT.JourneyStage", "name": "stage", "type": "uint8" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "address", "name": "recorder", "type": "address" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "string", "name": "notes", "type": "string" },
          { "internalType": "string", "name": "evidenceIPFS", "type": "string" },
          { "internalType": "string", "name": "temperature", "type": "string" },
          { "internalType": "string", "name": "humidity", "type": "string" }
        ],
        "internalType": "struct CropJourneyNFT.JourneyRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tokenId", "type": "uint256" }
    ],
    "name": "getCropBatch",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
          { "internalType": "uint256", "name": "contractId", "type": "uint256" },
          { "internalType": "address", "name": "farmer", "type": "address" },
          { "internalType": "string", "name": "cropType", "type": "string" },
          { "internalType": "string", "name": "variety", "type": "string" },
          { "internalType": "uint256", "name": "quantity", "type": "uint256" },
          { "internalType": "uint256", "name": "plantingDate", "type": "uint256" },
          { "internalType": "uint256", "name": "harvestDate", "type": "uint256" },
          { "internalType": "string", "name": "farmLocation", "type": "string" },
          { "internalType": "string", "name": "qrCode", "type": "string" },
          { "internalType": "enum CropJourneyNFT.JourneyStage", "name": "currentStage", "type": "uint8" },
          { "internalType": "bool", "name": "isOrganic", "type": "bool" },
          { "internalType": "string", "name": "certifications", "type": "string" }
        ],
        "internalType": "struct CropJourneyNFT.CropBatch",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tokenId", "type": "uint256" },
      { "internalType": "address", "name": "_address", "type": "address" }
    ],
    "name": "hasOwnedBatch",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalBatches",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tokenId", "type": "uint256" }
    ],
    "name": "getCropAge",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "_maxDays", "type": "uint256" }
    ],
    "name": "isFresh",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_minter", "type": "address" }
    ],
    "name": "addMinter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_tracker", "type": "address" }
    ],
    "name": "addTracker",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
