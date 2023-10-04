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
        sendData(c.pair.ws, "pair found!", "notification");
        sendData(ws, JSON.stringify(c), "init");
        sendData(c.pair.ws,  JSON.stringify(c.pair), "init");
        console.log("completed inicialization of a pair");
    }
    ws.on('message', (message) => {
        clients.forEach(function(client){
            if(ws === client.ws){
                console.log(`Received message from client: ${message}`);
                let decomposed = JSON.parse(message);
                if(decomposed.reason === "name"){
                    client.name = decomposed.name;
                }
                updateData(client, decomposed);
                sendData(ws, decomposed,"data");
            }
        });
    });
});
function sendData(socket, message, reason){
    clients.forEach(function (client) {
        if (client.ws === socket) {
            if(reason === "data") {
                if(client.pair !== null) {
                    message["reason"] = "data";
                    message = JSON.stringify(message);
                    console.log(message);
                    client.pair.ws.send(message);
                }
            }else if(reason === "init"){
                message["reason"] = "init";
                client.pair.ws.send(message);
            }else if(reason === "notification"){
                let notif = new Notification(message);
                let m = {reason: "notification", notif};
                let mess = JSON.stringify(m);
                socket.send(mess);
            }else if(reason === "close"){
                clients = clients.filter((c) => c !== client);
                playerCount--;
                pairCount--;
                pairs = pairs.filter((pair) => pair.p1 !== client && pair.p2 !== client);
            }
        }
    });
}
function updateData(client, message){
    client.left = message.left;
    client.top = message.top;
}

class Notification{
    constructor(info) {
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