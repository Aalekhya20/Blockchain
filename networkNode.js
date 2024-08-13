// Import required modules
var express = require('express');
var cryptoNetworkApp = express();
var port = process.argv[2];
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const rp = require('request-promise');
var Blockchain = require('./blockchain');
var cryptoChain = new Blockchain();

// Use the CORS middleware to enable CORS
cryptoNetworkApp.use(cors());

// Use bodyParser middleware for parsing JSON and urlencoded data
cryptoNetworkApp.use(bodyParser.json());
cryptoNetworkApp.use(bodyParser.urlencoded({ extended: false }));

// Define routes
cryptoNetworkApp.get('/', function (req, res) {
    res.send('This node belongs to a miner 1');
});

cryptoNetworkApp.get('/blockchain', function (req, res) {
    res.send(cryptoChain);
});

cryptoNetworkApp.post('/transaction', function (req, res) {
    var newTransaction = req.body;
    cryptoChain.pendingTransactions.push(newTransaction);
    res.json({ note: 'Transaction added to pending transactions.' });
});

cryptoNetworkApp.post('/transaction/broadcast', function (req, res) {
    var newTransaction = req.body;
    cryptoChain.pendingTransactions.push(newTransaction);
    const requestPromises = [];
    cryptoChain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
        .then(data => {
            res.json({ note: 'Transaction created and broadcast successfully.' });
        });
});

cryptoNetworkApp.post('/register-node', function (req, res) {
    var newNodeUrlToRegister = req.body.newNodeUrl;
    var nodeNotAlreadyPresentInTheList = cryptoChain.networkNodes.indexOf(newNodeUrlToRegister) == -1;
    var notCurrentNode = cryptoChain.currentNodeUrl !== newNodeUrlToRegister;
    if (nodeNotAlreadyPresentInTheList && notCurrentNode) {
        cryptoChain.networkNodes.push(newNodeUrlToRegister);
        res.json({ note: 'New node registered successfully.' });
    }
});

cryptoNetworkApp.post('/register-and-broadcast-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (cryptoChain.networkNodes.indexOf(newNodeUrl) === -1 && cryptoChain.currentNodeUrl !== newNodeUrl) {
        cryptoChain.networkNodes.push(newNodeUrl);
    }
    const regNodesPromises = [];
    cryptoChain.networkNodes.forEach(networkNodeUrl => {
        if (networkNodeUrl !== newNodeUrl) {
            const requestOptions = {
                uri: networkNodeUrl + '/register-node',
                method: 'POST',
                body: { newNodeUrl: newNodeUrl },
                json: true
            };
            regNodesPromises.push(rp(requestOptions));
        }
    });
    Promise.all(regNodesPromises.map(promise => promise.catch(error => {
        console.error(`Error registering with node: ${error.message}`);
        return null; // Prevent Promise.all from failing
    })))
        .then(() => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { listOfNodes: [...cryptoChain.networkNodes, cryptoChain.currentNodeUrl] },
                json: true
            };
            return rp(bulkRegisterOptions);
        })
        .then(() => {
            res.json({ note: 'New node registered with network successfully.' });
        })
        .catch(err => {
            console.error('Error during node registration and broadcasting:', err);
            res.status(500).json({ note: 'Error registering node', error: err.message });
        });
});

cryptoNetworkApp.post('/register-nodes-bulk', function (req, res) {
    var bulkNetworkNodes = req.body.listOfNodes;
    bulkNetworkNodes.forEach(networkNodeUrl => {
        var nodeNotAlreadyPresentInTheList = cryptoChain.networkNodes.indexOf(networkNodeUrl) == -1;
        var notCurrentNode = cryptoChain.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresentInTheList && notCurrentNode) {
            cryptoChain.networkNodes.push(networkNodeUrl);
        }
    });
    res.json({ note: 'Bulk registration successful.' });
});

cryptoNetworkApp.get('/mine', function (req, res) {
    var lastBlockInfo = cryptoChain.getLastBlock();
    var prevBlockHash = lastBlockInfo['hash'];
    var currentBlockData = JSON.stringify(cryptoChain.pendingTransactions);
    var nonceOfTheBlock = cryptoChain.proofOfWork(currentBlockData, prevBlockHash);
    var hashOfTheBlock = cryptoChain.generateHashOfTheBlock(currentBlockData, nonceOfTheBlock, prevBlockHash);
    var newBlock = cryptoChain.createNewBlock(hashOfTheBlock, nonceOfTheBlock, prevBlockHash);
    res.send(newBlock);
    const requestPromises = [];
    cryptoChain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/recieve-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
        .then(data => {
            res.json({
                note: 'Mining new block successful!',
                block: newBlock
            });
        });
});

cryptoNetworkApp.post('/recieve-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = cryptoChain.getLastBlock();
    const validHash = lastBlock.hash === newBlock.prevBlockHash;
    const validIndex = lastBlock['index'] + 1 === newBlock['index'];
    if (validHash && validIndex) {
        cryptoChain.chain.push(newBlock);
        cryptoChain.pendingTransactions = [];
        res.json({ note: 'New block received and accepted.', newBlock: newBlock });
    } else {
        res.json({ note: 'New block rejected.', newBlock: newBlock });
    }
});

// Start the server
cryptoNetworkApp.listen(port, function () {
    console.log('The network application is active on port:' + port);
});
