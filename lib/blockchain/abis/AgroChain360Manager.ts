/**
 * ABI for AgroChain360 Contract Manager
 * Generated from Solidity contract compilation
 */

export const AgroChain360ManagerABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "reason", "type": "string" }
    ],
    "name": "ContractCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" }
    ],
    "name": "ContractCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "farmer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "cropType", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "totalValue", "type": "uint256" }
    ],
    "name": "ContractCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "raiser", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "reason", "type": "string" }
    ],
    "name": "DisputeRaised",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "paymentPercentage", "type": "uint256" }
    ],
    "name": "MilestoneCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "farmer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "evidenceIPFS", "type": "string" }
    ],
    "name": "MilestoneSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "verifier", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "MilestoneVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "contractId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "PaymentReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "officer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "location", "type": "string" }
    ],
    "name": "VerificationTaskCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" },
      { "internalType": "string[]", "name": "_names", "type": "string[]" },
      { "internalType": "string[]", "name": "_descriptions", "type": "string[]" },
      { "internalType": "uint256[]", "name": "_paymentPercentages", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "_expectedDates", "type": "uint256[]" }
    ],
    "name": "addMilestones",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_officer", "type": "address" }
    ],
    "name": "addVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "address", "name": "_officer", "type": "address" },
      { "internalType": "string", "name": "_location", "type": "string" }
    ],
    "name": "assignVerificationTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" },
      { "internalType": "string", "name": "_reason", "type": "string" }
    ],
    "name": "cancelContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_farmer", "type": "address" },
      { "internalType": "string", "name": "_cropType", "type": "string" },
      { "internalType": "string", "name": "_variety", "type": "string" },
      { "internalType": "uint256", "name": "_requiredQuantity", "type": "uint256" },
      { "internalType": "uint256", "name": "_pricePerKg", "type": "uint256" },
      { "internalType": "uint256", "name": "_harvestDeadline", "type": "uint256" },
      { "internalType": "string", "name": "_ipfsMetadata", "type": "string" }
    ],
    "name": "createContract",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" }
    ],
    "name": "getContract",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "farmer", "type": "address" },
          { "internalType": "address", "name": "buyer", "type": "address" },
          { "internalType": "string", "name": "cropType", "type": "string" },
          { "internalType": "string", "name": "variety", "type": "string" },
          { "internalType": "uint256", "name": "requiredQuantity", "type": "uint256" },
          { "internalType": "uint256", "name": "pricePerKg", "type": "uint256" },
          { "internalType": "uint256", "name": "totalValue", "type": "uint256" },
          { "internalType": "uint256", "name": "escrowBalance", "type": "uint256" },
          { "internalType": "enum AgroChain360ContractManager.ContractStatus", "name": "status", "type": "uint8" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
          { "internalType": "uint256", "name": "harvestDeadline", "type": "uint256" },
          { "internalType": "string", "name": "ipfsMetadata", "type": "string" }
        ],
        "internalType": "struct AgroChain360ContractManager.FarmingContract",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" }
    ],
    "name": "getContractMilestones",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "uint256", "name": "contractId", "type": "uint256" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "paymentPercentage", "type": "uint256" },
          { "internalType": "uint256", "name": "expectedDate", "type": "uint256" },
          { "internalType": "uint256", "name": "completedDate", "type": "uint256" },
          { "internalType": "enum AgroChain360ContractManager.MilestoneStatus", "name": "status", "type": "uint8" },
          { "internalType": "address", "name": "verifier", "type": "address" },
          { "internalType": "string", "name": "farmerEvidenceIPFS", "type": "string" },
          { "internalType": "string", "name": "verifierEvidenceIPFS", "type": "string" },
          { "internalType": "uint256", "name": "verificationDate", "type": "uint256" }
        ],
        "internalType": "struct AgroChain360ContractManager.Milestone[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_farmer", "type": "address" }
    ],
    "name": "getFarmerContracts",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_buyer", "type": "address" }
    ],
    "name": "getBuyerContracts",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" },
      { "internalType": "string", "name": "_reason", "type": "string" }
    ],
    "name": "raiseDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_officer", "type": "address" }
    ],
    "name": "removeVerifier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "string", "name": "_evidenceIPFS", "type": "string" }
    ],
    "name": "submitMilestoneEvidence",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_contractId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "bool", "name": "_approved", "type": "bool" },
      { "internalType": "string", "name": "_evidenceIPFS", "type": "string" }
    ],
    "name": "verifyMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawPlatformFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
