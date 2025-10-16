const { create } = require('ipfs-http-client');
const CryptoJS = require('crypto-js');

class IPFSService {
    constructor() {
        this.ipfs = create({
            host: process.env.IPFS_HOST || 'localhost',
            port: process.env.IPFS_PORT || 5001,
            protocol: process.env.IPFS_PROTOCOL || 'http'
        });
    }

    async uploadEncryptedRecord(recordData, encryptionKey) {
        try {
            // Encrypt the record data
            const encryptedData = CryptoJS.AES.encrypt(
                JSON.stringify(recordData),
                encryptionKey
            ).toString();

            // Add to IPFS
            const result = await this.ipfs.add(encryptedData);
            
            return {
                ipfsHash: result.path,
                encryptedData: encryptedData
            };
        } catch (error) {
            throw new Error(`IPFS upload failed: ${error.message}`);
        }
    }

    async getRecord(ipfsHash, encryptionKey) {
        try {
            // Retrieve from IPFS
            const chunks = [];
            for await (const chunk of this.ipfs.cat(ipfsHash)) {
                chunks.push(chunk);
            }
            
            const encryptedData = Buffer.concat(chunks).toString();
            
            // Decrypt the data
            const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            
            return decryptedData;
        } catch (error) {
            throw new Error(`IPFS retrieval failed: ${error.message}`);
        }
    }

    async generateEncryptionKey() {
        return CryptoJS.lib.WordArray.random(256/8).toString();
    }
}

module.exports = new IPFSService();