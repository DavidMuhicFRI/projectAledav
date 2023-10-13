const WebSocket = require('ws');
const pako = require('pako');
let runnerCount = 0;
let hunterCount = 0;
let clients = [];
let pairs = [];
let waiting = [];
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server is running!');
wss.on('connection', (ws) => {
    console.log('connected');
    ws.on('message', (message) => {
        let decompressedMessage = pako.inflate(message, { to: 'string' });
        let decoded = JSON.parse(decompressedMessage);
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
                } else if (message.reason === "find") {
                    if(client.status === "none"){
                        waiting.push(client);
                    }
                    findPair(client);
                }else if(message.reason === "close"){
                    clients = clients.filter((element) => element !== client);
                    pairs = pairs.filter((element) => element.p1 !== client && element.p2 !== client);
                    if(client.pair !== null) {
                        client.pair.ws.send("gameOver", new Notification("ur bro left u"));
                    }
                    sendCount();
                }else if(message.reason === "rejected"){
                    waiting.push(client.pair);
                    pairs = pairs.filter((element) => element.p1 !== client && element.p2 !== client);
                    client.pair.ws.send(createJsonObject("enemyRejected", new Notification("opponent has rejected")));
                    client.ws.send(createJsonObject("rejected", new Notification("I rejected")));
                    client.pair.status = "waiting";
                    client.status = "none";
                    client.pair.pair = null;
                    client.pair = null;
                }else if(message.reason === "playerAccepted"){
                    console.log(client.status);
                    client.status = "accepted";
                    client.pair.ws.send(createJsonObject("enemyAccepted", new Notification("enemy has accepted")));
                    if(client.pair.status === "accepted"){
                        client.pair.ws.send(createJsonObject("bothAccepted", new Notification("opponent has accepted, game is beginning")));
                        client.ws.send(createJsonObject("bothAccepted", new Notification("opponent has accepted, game is beginning")));
                        client.pair.status = "none";
                        client.status = "none";
                    }else{
                        client.ws.send(createJsonObject("playerAccepted", new Notification("waiting for enemy...")));
                    }
                }
                console.log(waiting);
            }
        });
    }
}

function sendCount(){
    clients.forEach(function(client){
        client.ws.send(createJsonObject("counter", {
            playerCount: clients.length,
            runnerCount: runnerCount,
            hunterCount: hunterCount
        }))
    })
    hunterCount = 0;
    runnerCount = 0;
}
function findPair(client){
    let enemy;
    if(waiting.length < 2){
        client.ws.send(createJsonObject("notification", new Notification("no available players yet")));
    }else {
        for (let i = 0; i < waiting.length; i++) {
            if (waiting[i] !== client) {
                enemy = waiting[i];
                break;
            }
        }
        let rand = Math.random();
        if (rand > 0.5) {
            enemy.player.type = "runner";
            client.player.type = "hunter";
        } else {
            client.player.type = "runner";
            enemy.player.type = "hunter";
        }
        client.pair = enemy;
        enemy.pair = client;
        waiting = waiting.filter((element) => element !== enemy && element !== client);
        let pair = new Pair(client, enemy);
        pairs.push(pair);
        client.ws.send(createJsonObject("notification", new Notification("pair found!")));
        client.ws.send(createJsonObject("found", enemy.player));
        enemy.ws.send(createJsonObject("notification", new Notification("pair found!")));
        enemy.ws.send(createJsonObject("found", client.player));
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
    player.type = message.object.type;
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
        this.status = "none";
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
    }
}

class Pair{
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
}