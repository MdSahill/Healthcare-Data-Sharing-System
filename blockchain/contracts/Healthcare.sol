// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Healthcare {
    struct MedicalRecord {
        address patient;
        string ipfsHash;
        string encryptedKey;
        string recordType;
        uint256 timestamp;
        bool isActive;
    }
    
    struct AccessRequest {
        address doctor;
        string recordId;
        string purpose;
        uint256 timestamp;
        uint256 expiry;
        bool approved;
        bool revoked;
    }
    
    struct PatientConsent {
        address patient;
        address doctor;
        string[] recordIds;
        uint256 grantedAt;
        uint256 expiresAt;
        bool isActive;
    }
    
    mapping(string => MedicalRecord) public records;
    mapping(string => AccessRequest) public accessRequests;
    mapping(address => mapping(address => PatientConsent)) public consents;
    mapping(string => address[]) public recordAccessList;
    mapping(address => string[]) public patientRecords;
    
    event RecordCreated(string indexed recordId, address indexed patient);
    event AccessRequested(string indexed requestId, address indexed doctor, string recordId);
    event AccessGranted(string indexed recordId, address indexed doctor);
    event AccessRevoked(string indexed recordId, address indexed doctor);
    event ConsentGranted(address indexed patient, address indexed doctor);
    
    modifier onlyPatient(string memory recordId) {
        require(records[recordId].patient == msg.sender, "Only patient can perform this action");
        _;
    }
    
    modifier recordExists(string memory recordId) {
        require(records[recordId].patient != address(0), "Record does not exist");
        _;
    }
    
    function createRecord(
        string memory recordId,
        string memory ipfsHash,
        string memory encryptedKey,
        string memory recordType
    ) public {
        require(records[recordId].patient == address(0), "Record already exists");
        
        records[recordId] = MedicalRecord({
            patient: msg.sender,
            ipfsHash: ipfsHash,
            encryptedKey: encryptedKey,
            recordType: recordType,
            timestamp: block.timestamp,
            isActive: true
        });
        
        patientRecords[msg.sender].push(recordId);
        recordAccessList[recordId].push(msg.sender); // Patient has access by default
        
        emit RecordCreated(recordId, msg.sender);
    }
    
    function requestAccess(
        string memory requestId,
        string memory recordId,
        string memory purpose
    ) public recordExists(recordId) {
        require(records[recordId].patient != msg.sender, "Patient cannot request access to own record");
        
        accessRequests[requestId] = AccessRequest({
            doctor: msg.sender,
            recordId: recordId,
            purpose: purpose,
            timestamp: block.timestamp,
            expiry: block.timestamp + 180 days, // 6 months default
            approved: false,
            revoked: false
        });
        
        emit AccessRequested(requestId, msg.sender, recordId);
    }
    
    function grantAccess(
        string memory recordId,
        address doctor,
        uint256 expiry
    ) public onlyPatient(recordId) {
        // Add doctor to access list
        address[] storage accessList = recordAccessList[recordId];
        bool alreadyHasAccess = false;
        
        for (uint i = 0; i < accessList.length; i++) {
            if (accessList[i] == doctor) {
                alreadyHasAccess = true;
                break;
            }
        }
        
        if (!alreadyHasAccess) {
            accessList.push(doctor);
        }
        
        emit AccessGranted(recordId, doctor);
    }
    
    function revokeAccess(
        string memory recordId,
        address doctor
    ) public onlyPatient(recordId) {
        address[] storage accessList = recordAccessList[recordId];
        
        for (uint i = 0; i < accessList.length; i++) {
            if (accessList[i] == doctor) {
                accessList[i] = accessList[accessList.length - 1];
                accessList.pop();
                break;
            }
        }
        
        emit AccessRevoked(recordId, doctor);
    }
    
    function hasAccess(string memory recordId, address user) public view returns (bool) {
        address[] memory accessList = recordAccessList[recordId];
        
        for (uint i = 0; i < accessList.length; i++) {
            if (accessList[i] == user) {
                return true;
            }
        }
        return false;
    }
    
    function getPatientRecords(address patient) public view returns (string[] memory) {
        return patientRecords[patient];
    }
    
    function getRecordAccessList(string memory recordId) public view returns (address[] memory) {
        return recordAccessList[recordId];
    }
}