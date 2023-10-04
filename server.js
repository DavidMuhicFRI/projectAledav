const WebSocket = require('ws');
let playerCount = 0;
let pairCount = 0;
let clients = [];
let pairs = [];
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running!');
wss.on('connection', (ws) => {
    console.log('connected');
    ws.send(`Welcome, Client ${playerCount}!`);
    let c;
    if(playerCount % 2 === 0){
        c = new Client(playerCount, ws, null, 200, 200, null);
        playerCount++;
        clients.push(c);
        let p = new Pair(c, null);
        pairs.push(p);
        ws.send("searching for a pair...");
    }else{
        c = new Client(playerCount, ws, clients[playerCount - 1], 500, 200, null);
        clients[playerCount - 1].pair = c;
        playerCount++;
        pairs[pairCount].p2 = c;
        pairCount++;
        ws.send("pair found!");
        c.pair.ws.send("pair found!");
        sendData(ws, "data");
        sendData(c.pair.ws, "data");
    }
    ws.on('message', (message) => {
        console.log(`Received message from client: ${message}`);
        let decomposed = JSON.parse(message);
        if(decomposed.reason === "name"){
            clients.forEach(function(client){
                if(ws === client.ws){
                    client.name = decomposed.name;
                }
            })
        }
        sendData(ws,"data");
    });
});
function sendData(socket, reason){//poslje paru od socketa message
    if(reason === "data") {
        let message;
        clients.forEach(function (client) {
            if (client.ws === socket) {
                let pair = client.pair.ws;
                message = JSON.stringify(client);
                message.reason = reason;
                pair.send(message);
            }
        });
    }
}
class Client{
    constructor(id, ws, pair, left, top, name) {
        this.id = id;
        this.pair = pair;
        this.ws = ws
        this.left = left;
        this.top = top;
        this.name = name;
    }

    toJSON() {
        return {
            name: this.name,
            left: this.left,
            top: this.top
        };
    }
}
class Pair{
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
}