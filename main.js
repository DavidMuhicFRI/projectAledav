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
    let user = new Player(playerBox1.offsetLeft, playerBox1.offsetTop, "");
    nameBoxS.onclick = function(){
        let name = $("#nameBox").val();
        $("#playerBox").text(name);
        user.name = name;
        ws.send("hello");
        sendData("name");
    }
    ws.onopen = () => {
        console.log('WebSocket client connected');
        sendData("data");
    };
    ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log(data);
        if(data.reason === "data"){
            updateEnemy(data);
        }else if(data.reason === "init"){
            const newDiv = $("<div>");
            newDiv.css({
                backgroundColor: "blue",
                color: "white",
                position: "absolute",
                left: data.left + "px",
                top: data.top + "px",
            });
            newDiv.text(data.name);
            newDiv.id = "enemyBox";
            $("body").append(newDiv);
            enemyBox = newDiv;
        }else if(data.reason === "notification"){
            console.log(data.info);
        }
    };
    ws.onclose = () => {
        console.log('closed');
    };
    document.addEventListener("keydown", function (event) {
        if (event.key === "a") {
               playerBox1.style.left = playerBox1.offsetLeft - 3 + "px";
        }else if (event.key === "w") {
            playerBox1.style.top = playerBox1.offsetTop - 3 + "px";
        }else if (event.key === "d") {
            playerBox1.style.left = playerBox1.offsetLeft + 3 + "px";
        }else if (event.key === "s") {
            playerBox1.style.top = playerBox1.offsetTop + 3 + "px";
        }
        sendData("data");
    });

    function sendData(reason){
        console.log("se izvede");
        let message = JSON.stringify(user);
        message["reason"] = reason;
        ws.send(message);
    }

    function updateEnemy(data){
        enemyBox.css({
        backgroundColor: "blue",
        color: "white",
        position: "absolute",
        left: data.left + "px",
        top: data.top + "px",
    });
        enemyBox.text(data.name);
    }
}