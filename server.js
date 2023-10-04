const WebSocket = require('ws');
let playerCount = 0;
let pairCount = 0;
let clients = [];
let pairs = [];
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running!');
wss.on('connection', (ws) => {
    console.log('connected');
    let c;
    if(playerCount % 2 === 0){
        c = new Client(playerCount, ws, null, 200, 200, " ");
        playerCount++;
        clients.push(c);
        let p = new Pair(c, null);
        pairs.push(p);
        sendData(ws, "searching for a pair...", "notification");
    }else{
        c = new Client(playerCount, ws, clients[playerCount - 1], 500, 200, " ");
        clients[playerCount - 1].pair = c;
        playerCount++;
        pairs[pairCount].p2 = c;
        pairCount++;
        sendData(ws, "pair found!", "notification");
        sendData(ws, "pair found!", "notification");
        sendData(ws, JSON.stringify(c), "init");
        sendData(c.pair.ws,  JSON.stringify(c.pair), "init");
    }
    ws.on('message', (message) => {
        let c;
        clients.forEach(function(client){
            if(ws === client.ws){
                c = client;
            }
        });
        console.log(`Received message from client: ${message}`);
        let decomposed = JSON.parse(message);
        if(decomposed.reason === "name"){
            c.name = decomposed.name;
        }
        updateData(c, decomposed);
        sendData(ws, message,"data");
    });
});
function sendData(socket, message, reason){//poslje paru od socketa message
    if(reason === "data" && socket.pair !== null) {
        clients.forEach(function (client) {
            if (client.ws === socket) {
                message["reason"] = "data";
                client.pair.ws.send(message);
            }
        });
    }else if(reason === "init"){
        clients.forEach(function (client) {
            if (client.ws === socket) {
                message["reason"] = "init";
                client.pair.ws.send(message);
            }
        });
    }else if(reason === "notification"){
        let notif = new Notification(message, socket);
        let m = JSON.stringify(notif);
        m["reason"] = "notification";
        socket.send(m);
    }
}
function updateData(client, message){
    client.left = message.left;
    client.top = message.top;
}

class Notification{
    constructor(info, ws) {
        this.ws = ws
        this.info = info;
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