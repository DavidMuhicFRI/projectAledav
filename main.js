window.onload = function() {
    const ws = new WebSocket('wss://projectaledav1.onrender.com');
    ws.onopen = () => {
        console.log('WebSocket client connected');
        ws.send('Hello, server!');

    };
    ws.onmessage = (message) => {
        console.log(`Received message from server: ${message}`);
        const dataReceived = JSON.parse(message);
        console.log("Reason : ", dataReceived.reason);
        console.log('pairName:', dataReceived.name);
        console.log('pairLeft:', dataReceived.left);
        console.log('pairTop:', dataReceived.top);
    };
    ws.onclose = () => {
        console.log('closed');
    };
    const playerBox1 = document.getElementById("playerBox");
    document.addEventListener("keydown", function (event) {
        if (event.key === "a") {
               playerBox1.style.left = playerBox1.offsetLeft - 3 + "px";
        }else if (event.key === "w") {
            playerBox1.style.top = playerBox1.offsetTop - 3 + "px";
        }else if (event.key === "d") {
            playerBox1.style.left = playerBox1.offsetLeft + 3 + "px";
        }else if (event.key === "s") {
            playerBox1.style.top = playerBox1.offsetTop + 3 + "px";
        }
    });
}