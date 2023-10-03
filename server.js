const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is starting...');
wss.on('connection', (ws) => {
    console.log('connected');
    ws.on('message', (message) => {
        console.log(`Received message from client: ${message}`);
        ws.send("sup homey");
        // Handle incoming messages from clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                // Broadcast the message to all other clients
                client.send("wassup idiot");
            }
        });
    });
});