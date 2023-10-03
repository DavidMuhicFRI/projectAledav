const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('WebSocket client connected');
    ws.send('Hello, server!');
};

ws.onmessage = (event) => {
    const message = event.data;
    console.log(`Received message from server: ${message}`);
    // Handle incoming messages from the server
};

ws.onclose = () => {
    console.log('closed');
};