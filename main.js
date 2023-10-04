window.onload = function() {
    class Player{
        constructor(left, top, name) {
            this.left = left;
            this.top = top;
            this.name = name;
        }
    }
    const ws = new WebSocket('wss://projectaledav1.onrender.com');
    const playerBox1 = document.getElementById("playerBox");
    const nameBoxS = document.getElementById("nameBoxS");
    let enemyBox;
    let enemyName;
    let user = new Player(playerBox1.offsetLeft, playerBox1.offsetTop, "");
    nameBoxS.onclick = function(){
        let name = $("#nameBox").val();
        $("#playerName").text(name);
        user.name = name;
        sendData("name");
    }
    ws.onopen = () => {
        console.log('WebSocket client connected');
        sendData("data");
    };
    ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log("dobljeno od serverja: " + data);
        if(data.reason === "data"){
            updateEnemy(data);
        }else if(data.reason === "init"){
            enemyBox = document.createElement("div");
            enemyBox.id = "enemyBox";
            enemyBox.style.backgroundColor = "blue";
            enemyBox.style.color = "white";
            enemyBox.style.position = "absolute";
            enemyBox.style.left = data.left + "px";
            enemyBox.style.top = data.top + "px";
            enemyBox.text(data.name);
            enemyName = document.createElement("p");
            enemyName.id = "enemyName";
            $("#enemyName").text(data.name);
            enemyBox.appendChild(enemyName);
            document.body.appendChild(enemyBox);
        }else if(data.reason === "notification"){
            console.log("INFORMATION: " + data.notif.info);
        }
    };
    ws.onclose = () => {
        sendData("close");
        console.log('closed');
    };
    document.addEventListener("keydown", function (event) {
        if(event.key === 'a' || event.key === 's' || event.key === 'd' || event.key === 'w') {
            if (event.key === "a") {
                playerBox1.style.left = playerBox1.offsetLeft - 3 + "px";
            } else if (event.key === "w") {
                playerBox1.style.top = playerBox1.offsetTop - 3 + "px";
            } else if (event.key === "d") {
                playerBox1.style.left = playerBox1.offsetLeft + 3 + "px";
            } else if (event.key === "s") {
                playerBox1.style.top = playerBox1.offsetTop + 3 + "px";
            }
            user.left = playerBox1.offsetLeft;
            user.top = playerBox1.offsetTop;
            sendData("data");
        }
    });

    function sendData(reason){
        let message = JSON.stringify(user);
        message["reason"] = reason;
        console.log("TO POSLJEMO SERVERJU: " + message);
        ws.send(message);
    }

    function updateEnemy(data){
        enemyBox.style.left = data.left + "px";
        enemyBox.style.top = data.top + "px";
        $("#enemyName").text(data.name);
    }
}