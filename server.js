const WebSocket = require('ws');
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
                if (message.reason === "enemy") {
                    if (client.pair !== null) {
                        client.pair.ws.send(JSON.stringify(message));
                    }
                } else if (message.reason === "find1") {
                    waiting.push(client);
                    findPair(client, message.reason);
                }else if(message.reason === "find2"){
                    findPair(client, message.reason);
                }else if(message.reason === "close"){
                    clients = clients.filter((element) => element !== client);
                    pairs = pairs.filter((element) => element.p1 !== client && element.p2 !== client);
                    sendCount();
                }
            }
        });
    }
}

function sendCount(){
    console.log(clients);
    clients.forEach(function(client){
        client.ws.send(createJsonObject("counter", {
            playerCount: clients.length,
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
            client.ws.send(createJsonObject("notification", new Notification("pair found!")));
            client.ws.send(createJsonObject("enemy", kindaRight.player));
            kindaRight.ws.send(createJsonObject("notification", new Notification("pair found!")));
            kindaRight.ws.send(createJsonObject("enemy", client.player));
            console.log("completed inicialization of a pair");
        }else{
            client.ws.send(createJsonObject("found2", {}));
        }
    }else{
        client.pair = right;
        right.pair = client;
        client.player.type = client.player.preference;
        right.player.type = right.player.preference;
        waiting = waiting.filter((element) => element !== right && element !== client);
        let pair = new Pair(client, right);
        pairs.push(pair);
        client.ws.send(createJsonObject("notification", new Notification("pair found!")));
        client.ws.send(createJsonObject("enemy", right.player));
        right.ws.send(createJsonObject("notification", new Notification("pair found!")));
        right.ws.send(createJsonObject("enemy", client.player));
        console.log("completed inicialization of a pair");
    }
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