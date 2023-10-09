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
                } else if (message.reason === "find") {
                    waiting.push(client);
                    findPair(client);
                }else if(message.reason === "close"){
                    clients = clients.filter((element) => element !== client);
                    pairs = pairs.filter((element) => element.p1 !== client && element.p2 !== client);
                    client.pair.ws.send("gameOver", new Notification("ur bro left u"));
                    sendCount();
                }else if(message.reason === "rejected"){
                    waiting.push(client.pair);
                    pairs = pairs.filter((element) => element.p1 !== client && element.p2 !== client);
                    client.pair.ws.send(createJsonObject("rejected", new Notification("opponent has rejected")));
                }else if(message.reason === "accepted"){
                    client.status = "accepted";
                    if(client.pair.status === "accepted"){
                        client.pair.ws.send(createJsonObject("accepted", new Notification("opponent has accepted, game is beginning")));
                        client.ws.send(createJsonObject("accepted", new Notification("opponent has accepted, game is beginning")));
                    }else{
                        client.ws.send(createJsonObject("accepted", new Notification("waiting for enemy...")));
                    }
                }
            }
        });
    }
}

function sendCount(){
    clients.forEach(function(client){
        if(client.player.preference === "hunter"){
            hunterCount++;
        }else if(client.player.preference === "runner"){
            runnerCount++;
        }
    })
    console.log(clients);
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
    if(waiting.empty()){
        client.ws.send("notification", new Notification("no available players"));
    }else{
        enemy = waiting[0];
    }
    let rand = Math.random();
    if(rand > 0.5){
        enemy.player.type = "runner";
        client.player.type = "hunter";
    }else{
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