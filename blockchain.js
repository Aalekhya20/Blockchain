const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];

function Blockchain() {
    this.chain = [];  // An array to store the blocks
    this.pendingTransactions = [];
    this.networkNodes = [];
    this.currentNodeUrl = currentNodeUrl;
    this.createNewBlock('0', 0, '0');  // Creating the genesis block
}

// Creates a block and adds it to the chain
Blockchain.prototype.createNewBlock = function (hashOfTheBlock, nonceOfTheBlock, prevBlockHash) {
    const newBlock = {  // Block structure
        index: this.chain.length + 1,  // Index of the block
        transactions: this.pendingTransactions,  // Transactions in the block
        timestamp: Date.now(),
        hash: hashOfTheBlock,
        prevBlockHash: prevBlockHash,
        nonce: nonceOfTheBlock
    };
    this.pendingTransactions = [];  // Clears all pending transactions
    this.chain.push(newBlock);  // Adds the block to the chain
    return newBlock;
}

// Returns the last block's info
Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

// Creates a new transaction and adds it to the pending transactions array
Blockchain.prototype.createNewTransaction = function (sender, recipient, amount) {
    const newTransaction = {
        sender: sender,
        recipient: recipient,
        amount: amount
    };
    this.pendingTransactions.push(newTransaction);
    return newTransaction;
}

// Generates the hash of the block
Blockchain.prototype.generateHashOfTheBlock = function (currentBlockData, nonce, prevBlockHash) {
    const dataAsString = JSON.stringify(currentBlockData) + nonce.toString() + prevBlockHash;
    const hash = sha256(dataAsString);
    return hash;
}

// Function for solving the crypto puzzle (Proof of Work)
Blockchain.prototype.proofOfWork = function (currentBlockData, prevBlockHash) {
    let nonce = 0;
    let hash = this.generateHashOfTheBlock(currentBlockData, nonce, prevBlockHash);
    while (hash.substring(0, 5) !== "00000") {
        nonce++;
        hash = this.generateHashOfTheBlock(currentBlockData, nonce, prevBlockHash);
    }
    return nonce;
}

// Example function to add transactions and mine a new block
Blockchain.prototype.addTransactionAndMineBlock = function (sender, recipient, amount) {
    // Add a transaction to the pending transactions array
    this.createNewTransaction(sender, recipient, amount);

    // Prepare data for the new block
    const currentBlockData = {
        transactions: this.pendingTransactions,
        index: this.chain.length + 1
    };
    const prevBlockHash = this.getLastBlock().hash;
    const nonce = this.proofOfWork(currentBlockData, prevBlockHash);
    const hash = this.generateHashOfTheBlock(currentBlockData, nonce, prevBlockHash);

    // Create and add the new block to the chain
    return this.createNewBlock(hash, nonce, prevBlockHash);
}

module.exports = Blockchain;  // Permission to import JS files
