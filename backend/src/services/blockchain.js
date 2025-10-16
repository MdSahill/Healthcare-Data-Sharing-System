const Web3 = require('web3');
const HealthcareABI = require('../../build/contracts/Healthcare.json');

class BlockchainService {
    constructor() {
        this.web3 = new Web3(process.env.BLOCKCHAIN_URL || 'http://localhost:8545');
        this.contract = new this.web3.eth.Contract(
            HealthcareABI.abi,
            process.env.CONTRACT_ADDRESS
        );
        this.account = process.env.ADMIN_ACCOUNT;
    }

    async createRecord(recordData) {
        const { recordId, ipfsHash, encryptedKey, recordType, patientAddress } = recordData;
        
        const tx = this.contract.methods.createRecord(
            recordId,
            ipfsHash,
            encryptedKey,
            recordType
        );

        return await this.sendTransaction(tx, patientAddress);
    }

    async requestAccess(requestData) {
        const { requestId, recordId, purpose, doctorAddress } = requestData;
        
        const tx = this.contract.methods.requestAccess(
            requestId,
            recordId,
            purpose
        );

        return await this.sendTransaction(tx, doctorAddress);
    }

    async grantAccess(accessData) {
        const { recordId, doctorAddress, expiry, patientAddress } = accessData;
        
        const tx = this.contract.methods.grantAccess(
            recordId,
            doctorAddress,
            expiry
        );

        return await this.sendTransaction(tx, patientAddress);
    }

    async hasAccess(recordId, userAddress) {
        return await this.contract.methods.hasAccess(recordId, userAddress).call();
    }

    async getPatientRecords(patientAddress) {
        return await this.contract.methods.getPatientRecords(patientAddress).call();
    }

    async sendTransaction(transaction, fromAddress) {
        const gas = await transaction.estimateGas({ from: fromAddress });
        const gasPrice = await this.web3.eth.getGasPrice();
        
        return await transaction.send({
            from: fromAddress,
            gas,
            gasPrice
        });
    }
}

module.exports = new BlockchainService();