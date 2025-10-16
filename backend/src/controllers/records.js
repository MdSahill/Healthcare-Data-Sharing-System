const blockchainService = require('../services/blockchain');
const ipfsService = require('../services/ipfs');

class RecordsController {
    async createRecord(req, res) {
        try {
            const { patientId, recordData, recordType } = req.body;
            const patientAddress = req.user.blockchainAddress;

            // Generate encryption key
            const encryptionKey = await ipfsService.generateEncryptionKey();
            
            // Upload to IPFS
            const ipfsResult = await ipfsService.uploadEncryptedRecord(recordData, encryptionKey);
            
            // Create record on blockchain
            const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await blockchainService.createRecord({
                recordId,
                ipfsHash: ipfsResult.ipfsHash,
                encryptedKey: encryptionKey, // In production, encrypt this with patient's public key
                recordType,
                patientAddress
            });

            res.json({
                success: true,
                recordId,
                ipfsHash: ipfsResult.ipfsHash,
                message: 'Record created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRecord(req, res) {
        try {
            const { recordId } = req.params;
            const userAddress = req.user.blockchainAddress;

            // Check if user has access
            const hasAccess = await blockchainService.hasAccess(recordId, userAddress);
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this record'
                });
            }

            // Get record from blockchain
            const record = await blockchainService.contract.methods.records(recordId).call();
            
            if (!record.isActive) {
                return res.status(404).json({
                    success: false,
                    error: 'Record not found'
                });
            }

            // Retrieve from IPFS
            const recordData = await ipfsService.getRecord(record.ipfsHash, record.encryptedKey);

            res.json({
                success: true,
                record: {
                    ...record,
                    data: recordData
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getPatientRecords(req, res) {
        try {
            const patientAddress = req.user.blockchainAddress;
            
            const recordIds = await blockchainService.getPatientRecords(patientAddress);
            
            const records = [];
            for (const recordId of recordIds) {
                const record = await blockchainService.contract.methods.records(recordId).call();
                if (record.isActive) {
                    records.push({
                        recordId,
                        recordType: record.recordType,
                        timestamp: record.timestamp,
                        ipfsHash: record.ipfsHash
                    });
                }
            }

            res.json({
                success: true,
                records
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new RecordsController();