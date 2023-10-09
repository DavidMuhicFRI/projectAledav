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
    let user = new Player(playerBox1.offsetLeft, playerBox1.offsetTop, "");
    let counter = 0;
    let avg = 0;
    let interval = 0;
    ws.onopen = () => {
        ws.send("start sending u PoS");
    };

    ws.onmessage = (message) => {
        counter++;
        avg++;
        ws.send("im an idiot.");
    };
    setInterval(function(){
        interval++;
        console.log("counter v 1 sec " + counter + ", kar je 1 request na " + 1000/ counter + "ms");
        console.log("average = " + avg / interval + ", kar je 1 request na " + 1000/ (avg / interval) + "ms")
        counter = 0;
    }, 1000);
    nameBoxS.onclick = function(){
        let name = $("#nameBox").val();
        $("#playerName").text(name);
        user.name = name;
        sendData("data");
    }
    window.addEventListener('beforeunload', () => {
        sendData("close");
        ws.close();
    });
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