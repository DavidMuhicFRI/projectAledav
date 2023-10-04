const WebSocket = require('ws');
let playerID = 0;
let pairCount = 0;
let clients = [];
let pairs = [];
let waiting = [];
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running!');
wss.on('connection', (ws) => {
    console.log('connected');
        let c = new Client(playerID, ws, null, 0, 0, " ");
        playerID++;
        clients.push(c);
        waiting.push(c);
        sendData(ws, "searching for a pair..", "notification");
    findPair(c);
    ws.on('message', (message) => {
        let decomposed = JSON.parse(message);
        clients.forEach(function(client){
            if(ws === client.ws){
                updateClients(client, decomposed);
                sendData(ws, decomposed, decomposed.reason);
            }
        });
    });
});
function findPair(client){
    let completed = 0;
    waiting.forEach(function(waiter){
        if(completed === 0 && waiter !== client){
            client.pair = waiter;
            waiter.pair = client;
            client.left = waiter.left;
            client.top = waiter.top;
            completed = 1;
            waiting = waiting.filter((element) => element !== waiter && element !== client);
            let pair = new Pair(client, waiter);
            pairs.push(pair);
            sendData(client.ws, "pair found!", "notification");
            sendData(waiter.ws, "pair found!", "notification");
            sendData(waiter.ws, waiter, "init");//send the info about the other pair
            sendData(client.ws,  client, "init");
            console.log("completed inicialization of a pair");
        }
    })
    if(completed === 0){
        console.log("no pair found");
    }
}
function sendData(socket, message, reason){
    clients.forEach(function (client) {
        if (client.ws === socket) {
            if(reason === "data") {
                if(client.pair !== null) {
                    client.pair.ws.send(JSON.stringify(createJsonObject(reason, message)));
                }
            }else if(reason === "init"){
                client.pair.ws.send(JSON.stringify(createJsonObject(reason, message)));
            }else if(reason === "notification"){
                let notif = new Notification(message);
                socket.send(JSON.stringify(createJsonObject(reason, notif)));
            }else if(reason === "close"){
                console.log("a client left");
                clients = clients.filter((c) => c !== client);
                let notif = new Notification("your partner left ;-( waiting for another session");
                client.pair.ws.send(JSON.stringify(createJsonObject(reason, notif)));
                waiting.push(client.pair);
                findPair(client.pair);
                pairCount--;
                pairs = pairs.filter((pair) => pair.p1 !== client && pair.p2 !== client);
            }
        }
    });
}

function createJsonObject(reason, object){
    if(object.hasOwnProperty("reason")){
        object.reason = reason;
        return {
            object
        };
    }
    return {
        reason: reason,
        object
    };
}
function updateClients(client, message) {
    client.left = message.object.left;
    client.top = message.object.top;
    client.name = message.object.name;
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