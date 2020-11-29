// server.js
// where your node app starts

const express = require("express");
const bodyParser = require('body-parser');

const app = express();

let users = [];
let loggedinUsers = [];

let createNewUser = (username, password) => {
  if (username === "") {
    return { "success": false, "reason": "username field missing" };
  }
  if (password === "") {
    return { "success": false, "reason": "password field missing" };
  }
  if (users.find(u => u.username === username)) {
    return { "success": false, "reason": "Username exists" }
  }


  users.push({ "username": username, "password": password });

  return { "success": true };
}

let getToken = () => {
  let randomData = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
  return randomData;
}

let handleLogin = (username, password) => {
  if (username === "") {
    return { "success": false, "reason": "username field missing" };
  }
  if (password === "") {
    return { "success": false, "reason": "password field missing" };
  }
  if (users.find(u => u.username === username)) {
    if (users.find(u => u.username === username && u.password !== password)) {
      return { "success": false, "reason": "Invalid password" }
    }

    let token = getToken();
    loggedinUsers = loggedinUsers.filter(x => x.username !== username);
    loggedinUsers.push({ "username": username, "token": token });
    return { "sucess": true, "token": token };
  }

  return { "success": false, "reason": "User does not exist" }
}

app.use(bodyParser.json());

app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.post("/login", (request, response) => {
  let res = handleLogin(request.body.username || "", request.body.password || "")
  console.log(loggedinUsers)
  response.json(res);
});

app.post("/signup", (request, response) => {
  let res = createNewUser(request.body.username || "", request.body.password || "");
  console.log(users);
  response.json(res);
});



// listen for requests :)
const listener = app.listen(4200, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
