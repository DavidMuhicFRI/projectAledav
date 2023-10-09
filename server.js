const WebSocket = require('ws');
let playerID = 0;
let playerCount = 0;
let runnerCount = 0;
let hunterCount = 0;
let pairCount = 0;
let clients = [];
let pairs = [];
let waiting = [];
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running!');
wss.on('connection', (ws) => {
    console.log('connected');
    playerCount++;
    ws.on('message', (message) => {
        let decoded = JSON.parse(message);
        decode(ws, decoded);
    });
});

function decode(ws, message) {
    if (message.reason === "init") {
        let p = new Player();
        let c = new Client(ws, p, null);
        updatePlayer(p, message);
        clients.push(c);
        sendCount();
    } else {
        clients.forEach(function (client) {
            if (client.ws === ws) {
                if (message.reason === "data") {
                    if (client.pair !== null) {
                        client.pair.ws.send(JSON.stringify(message));
                    }
                } else if (message.reason === "find1") {
                    waiting.push(client);
                    findPair(client, message.reason);
                }else if(message.reason === "find2"){
                    findPair(client, message.reason);
                }else if(message.reason === "close"){
                    playerCount--;
                    clients = clients.filter((element) => element !== client);
                    pairs = pairs.filter((element) => element.p1 !== client && element.p2 !== client);
                    sendCount();
                }
            }
        });
    }
}

function sendCount(){
    clients.forEach(function(client){
        client.ws.send(createJsonObject("counter", {
            playerCount: playerCount,
            runnerCount: runnerCount,
            hunterCount: hunterCount
        }))
    })
}
function findPair(client, mode){
    let completed = 0;
    let right;
    let kindaRight;
    waiting.forEach(function(waiter){
        if(completed < 2 && waiter !== client){
            if(completed === 0){
                kindaRight = waiter;
                completed++;
            }
            if(completed === 1){
                if(client.player.preference !== waiter.player.preference){
                    right = waiter;
                    completed++;
                }
            }
        }
    })
    if(completed === 0){
        console.log("no pair found");
        client.ws.send(createJsonObject("notification", new Notification("no pair found, ur lonely asf ;-)")))
    }else if(completed === 1){
        if(mode === "find2"){
            let rand = Math.random();
            if(rand > 0.5){
                client.player.type = "hunter";
                kindaRight.player.type = "runner";
            }else{
                client.player.type = "runner";
                kindaRight.player.type = "hunter";
            }
            client.pair = kindaRight;
            kindaRight.pair = client;
            waiting = waiting.filter((element) => element !== kindaRight && element !== client);
            let pair = new Pair(client, kindaRight);
            pairs.push(pair);
            sendData(client.ws, "pair found!", "notification");
            sendData(kindaRight.ws, "pair found!", "notification");
            sendData(kindaRight.ws, kindaRight.player, "found1");//send the info about the other pair
            sendData(client.ws,  client.player, "found1");
            console.log("completed inicialization of a pair");
        }else{
            sendData(client.ws, "didnt find the right pair", "found2");
        }
    }else{
        client.pair = right;
        right.pair = client;
        client.player.type = client.player.preference;
        right.player.type = right.player.preference;
        waiting = waiting.filter((element) => element !== right && element !== client);
        let pair = new Pair(client, right);
        pairs.push(pair);
        sendData(client.ws, "pair found!", "found1");
        sendData(right.ws, "pair found!", "found1");
        sendData(right.ws, right.player, "init");//send the info about the other pair
        sendData(client.ws,  client.player, "init");
        console.log("completed inicialization of a pair");
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
    return JSON.stringify({
        reason: reason,
        object: object
    });
}
function updatePlayer(player, message) {
    player.position.x = message.object.position.x;
    player.position.y = message.object.position.y;
    player.name = message.object.name;
    player.velocity.x = message.object.velocity.x;
    player.velocity.y = message.object.velocity.y;
    player.height = message.object.height;
    player.width = message.object.width;
    player.type = message.object.type;
    player.super = message.object.super;
    player.gravityPower = message.object.gravityPower;
    player.jumpCounter = message.object.jumpCounter;
    player.jumpHeight = message.object.jumpHeight;
    player.movement = message.object.movement;
    player.color = message.object.color;
    player.skin = message.object.skin;
    player.score = message.object.score;
    player.preference = message.object.preference;

}

class Notification{
    constructor(info) {
        this.info = info;
    }
}

class Client{
    constructor(ws, player, pair){
        this.ws = ws;
        this.player = player;
        this.pair = pair;
    }
}

class Player {
    constructor() {
        this.name = "none";
        this.position = {
            x: 0,
            y: 0
        };
        this.velocity = {
            x: 0,
            y: 1,
        }
        this.height = 20;
        this.width = 20;
        this.type = "none";
        this.super = false;
        if (this.type === "runner") {
            this.gravityPower = 0.6;
            this.jumpCounter = 0;
            this.jumpHeight = 11;
            this.movement = 3.5;
        } else if (this.type === "hunter") {
            this.gravityPower = 0.6;
            this.jumpCounter = 0;
            this.jumpHeight = 13;
            this.movement = 5;
        }
        this.color = "red";
        this.skin = "basic";
        this.score = 0;
        this.preference = "none";
    }
}
class Pair{
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
}