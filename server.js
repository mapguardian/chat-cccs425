// server.js
// where your node app starts

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

let users = [];
let loggedinUsers = [];
let channels = [];

let createChannel = (token, channelName) => {
  let tokenCheck = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;
  console.log(tokenCheck);

  if (channelName === "")
    return { success: false, reason: "channelName field missing" };

  if (channels.find((c) => c.channelName === channelName))
    return { success: false, reason: "Channel already exists" };
  channels.push({
    channelName: channelName,
    creator: token,
    members: [],
    banned: [],
  });
  return { success: true };
};

let createNewUser = (username, password) => {
  if (username === "") {
    return { success: false, reason: "username field missing" };
  }
  if (password === "") {
    return { success: false, reason: "password field missing" };
  }
  if (users.find((u) => u.username === username)) {
    return { success: false, reason: "Username exists" };
  }

  users.push({ username: username, password: password });

  return { success: true };
};

let getToken = () => {
  let randomData =
    Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
  return randomData;
};

let handleLogin = (username, password) => {
  if (username === "") {
    return { success: false, reason: "username field missing" };
  }
  if (password === "") {
    return { success: false, reason: "password field missing" };
  }
  if (users.find((u) => u.username === username)) {
    if (users.find((u) => u.username === username && u.password !== password)) {
      return { success: false, reason: "Invalid password" };
    }

    let token = getToken();
    loggedinUsers = loggedinUsers.filter((x) => x.username !== username);
    loggedinUsers.push({ username: username, token: token });
    return { sucess: true, token: token };
  }

  return { success: false, reason: "User does not exist" };
};

let joinChannel = (token, channelName) => {
  let tokenCheck = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  let chan = channels.find((x) => x.channelName === channelName);
  if (chan) {
    if (chan.members.find((x) => x === token))
      return { success: false, reason: "User has already joined" };
    if (chan.banned.find((x) => x === token))
      return { success: false, reason: "User is banned" };
    chan.members.push(token);
    return { success: true };
  }
};

let validateChannel = (channelName) => {
  if (channelName === "")
    return { success: false, reason: "channelName field missing" };
  if (channels.find((c) => c.channelName === channelName)) {
    return { success: true };
  }
  return { success: false, reason: "Channel does not exist" };
};

let validateToken = (token) => {
  if (token === "") return { success: false, reason: "token field missing" };
  if (loggedinUsers.find((t) => t.token === token)) {
    return { success: true };
  }
  return { success: false, reason: "Invalid token" };
};
let corsOptions = {
  credentials: true,
};

app.use(bodyParser.raw({ type: "*/*" }));
app.use(cors(corsOptions));

app.get("/sourcecode", (req, res) => {
  res.send(require("fs").readFileSync(__filename).toString());
});

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.post("/create-channel", (request, response) => {
  let res = createChannel(
    request.header("token") || "",
    request.body.channelName || ""
  );
  console.log(channels);
  response.json(res);
});

app.post("/join-channel", (request, response) => {
  let res = joinChannel(
    request.header("token") || "",
    request.body.channelName || ""
  );
  response.json(res);
});

app.post("/login", (request, response) => {
  let res = handleLogin(
    request.body.username || "",
    request.body.password || ""
  );
  console.log(loggedinUsers);
  response.json(res);
});

app.post("/signup", (request, response) => {
  console.log("singup body" + JSON.stringify(request.body));
  let res = createNewUser(
    request.body.username || "",
    request.body.password || ""
  );
  response.json(res);
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
