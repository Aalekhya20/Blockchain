const apiUrl = 'http://localhost:3001'; // Base URL for the API

// Fetch and display the blockchain
function fetchBlockchain() {
    fetch(`${apiUrl}/blockchain`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('blockchainData').textContent = JSON.stringify(data, null, 4);
        });
}

// Handle transaction creation and broadcasting
document.getElementById('transactionForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const sender = document.getElementById('sender').value;
    const recipient = document.getElementById('recipient').value;
    const amount = document.getElementById('amount').value;

    const transactionData = {
        amount: amount,
        sender: sender,
        recipient: recipient
    };

    fetch(`${apiUrl}/transaction/broadcast`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('transactionResponse').textContent = data.note;
        });
});

// Handle block mining
function mineBlock() {
    fetch(`${apiUrl}/mine`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('mineResponse').textContent = `Block ${data.block.index} mined successfully!`;
            fetchBlockchain(); // Refresh the blockchain display
        });
}

// Handle node registration
document.getElementById('nodeForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const nodeUrl = document.getElementById('nodeUrl').value;

    fetch(`${apiUrl}/register-and-broadcast-node`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newNodeUrl: nodeUrl })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('nodeResponse').textContent = data.note;
        });
});
