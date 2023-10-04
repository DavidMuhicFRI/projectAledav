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
    let enemyBox = document.getElementById("enemyBox");
    const nameBoxS = document.getElementById("nameBoxS");//button s katerim posodobimo svoje ime. Se bo odstranil ko dodamo login or simple login aka izbiro username
    let user = new Player(playerBox1.offsetLeft, playerBox1.offsetTop, "");//glej Player class
    ws.onopen = () => {
        console.log('WebSocket client connected');
        sendData("data");
    };
    ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log("dobljeno od serverja: ");
        console.log(data);
        if(data.reason === "data"){
            console.log( data.object.left + "px");
            enemyBox.style.left = data.object.left + "px";
            enemyBox.style.top = data.object.top + "px";
            $("#enemyName").text(data.object.name);
        }else if(data.reason === "init"){
            console.log("poskus inicializacije enemy kvadratka");
            enemyBox.style.visibility = "visible";
            enemyBox.style.left = data.object.left + "px";
            enemyBox.style.top = data.object.top + "px";
        }else if(data.reason === "notification"){
            console.log("INFORMATION: " + data.object.info);
        }else if(data.reason === "pairDisc"){
            enemyBox.style.visibility = "hidden";
        }
    };
    ws.onclose = () => {
        sendData("close");
        console.log('closed');
    };
    nameBoxS.onclick = function(){
        let name = $("#nameBox").val();
        $("#playerName").text(name);
        user.name = name;
        sendData("data");
    }
    document.addEventListener("keydown", function (event) {//za premike kvadratkov
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

    function sendData(reason) {
        let json = JSON.stringify(addReason(reason, user));
        console.log("TO POSLJEMO SERVERJU: " + json);
        ws.send(json);
    }

    function addReason(reason, object){
        return {
            reason: reason,
            object
        }
    }
}