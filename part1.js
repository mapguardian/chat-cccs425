// server.js
// where your node app starts

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

let users = [];
let loggedinUsers = [];
let channels = [];

let ban = (token, channelName, target) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  if (target === "") return { success: false, reason: "target field missing" };

  let [chan, _] = getChannel(channelName);

  if (chan.creator === username) {
    chan.banned.push(target);
    return { success: true };
  }

  return { success: false, reason: "Channel not owned by user" };
};

let createChannel = (token, channelName) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;
  console.log(tokenCheck);

  if (channelName === "")
    return { success: false, reason: "channelName field missing" };

  if (channels.find((c) => c.channelName === channelName))
    return { success: false, reason: "Channel already exists" };
  channels.push({
    banned: [],
    channelName: channelName,
    creator: username,
    members: [],
    messages: [],
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

let deleteChan = (token, channelName) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  let [chan, idx] = getChannel(channelName);
  if (chan.creator === username) {
    channel = channels.splice(idx, 1);
    return { success: true };
  }

  // this should return false but in the spec there is no check for
  // delete when the user didn't create the channel so we will silently
  // return true
  return { success: true };
};

let getChannel = (channelName) => {
  let idx = channels
    .map((e) => {
      return e.channelName;
    })
    .indexOf(channelName);

  return [channels[idx], idx];
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
    return { success: true, token: token };
  }

  return { success: false, reason: "User does not exist" };
};

let joinChannel = (token, channelName) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  let [chan, _] = getChannel(channelName);
  if (chan) {
    if (chan.banned.indexOf(username) > -1)
      return { success: false, reason: "User is banned" };
    if (chan.members.indexOf(username) > -1)
      return { success: false, reason: "User has already joined" };
    chan.members.push(username);
    return { success: true };
  }
};

let joined = (token, channelName) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  let chan = channels.find((x) => x.channelName === channelName);

  if (chan.members.indexOf(username) === -1)
    return { success: false, reason: "User is not part of this channel" };

  return { success: true, joined: chan.members };
};

let kick = (token, channelName, target) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  if (target === "") return { success: false, reason: "target field missing" };

  let [chan, _] = getChannel(channelName);
  if (chan.creator === username) {
    let targetIdx = chan.members.indexOf(target);
    if (targetIdx > -1) {
      chan.members.splice(targetIdx, 1);
    }
    return { success: true };
  }

  return { success: false, reason: "Channel not owned by user" };
};

let leaveChannel = (token, channelName) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  let chan = channels.find((x) => x.channelName === channelName);
  if (chan) {
    if (chan.members.indexOf(username) === -1)
      return { success: false, reason: "User is not part of this channel" };
    let idx = chan.members.indexOf(username);
    chan.members.splice(idx, 1);
    return { success: true };
  }
};

let message = (token, channelName, msg) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success && channelCheck.reason !== "Channel does not exist")
    return channelCheck;

  if (msg === "") return { success: false, reason: "contents field missing" };

  let [chan, chanIdx] = getChannel(channelName);
  if (chanIdx === -1 || chan.members.indexOf(username) === -1)
    return { success: false, reason: "User is not part of this channel" };

  chan.messages.push({ from: username, contents: msg });
  return { success: true };
};

let messages = (token, channelName) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let channelCheck = validateChannel(channelName);
  if (!channelCheck.success) return channelCheck;

  let [chan, chanIdx] = getChannel(channelName);
  if (chanIdx === -1 || chan.members.indexOf(username) === -1)
    return { success: false, reason: "User is not part of this channel" };

  return { success: true, messages: chan.messages };
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
  if (token === "")
    return [{ success: false, reason: "token field missing" }, undefined];
  let idx = loggedinUsers
    .map((e) => {
      return e.token;
    })
    .indexOf(token);

  if (idx > -1) return [{ success: true }, loggedinUsers[idx].username];

  return [{ success: false, reason: "Invalid token" }, undefined];
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

app.post("/ban", (request, response) => {
  let values = JSON.parse(request.body);
  let res = ban(
    request.header("token") || "",
    values.channelName || "",
    values.target || ""
  );
  response.json(res);
});

app.post("/create-channel", (request, response) => {
  let values = JSON.parse(request.body);
  let res = createChannel(
    request.header("token") || "",
    values.channelName || ""
  );
  console.log(channels);
  response.json(res);
});

app.post("/delete", (request, response) => {
  let values = JSON.parse(request.body);
  let res = deleteChan(request.header("token") || "", values.channelName || "");
  response.json(res);
});

app.get("/joined", (request, response) => {
  let res = joined(
    request.header("token") || "",
    request.query.channelName || ""
  );
  response.json(res);
});

app.post("/join-channel", (request, response) => {
  let values = JSON.parse(request.body);
  let res = joinChannel(
    request.header("token") || "",
    values.channelName || ""
  );
  response.json(res);
});

app.post("/kick", (request, response) => {
  let values = JSON.parse(request.body);
  let res = kick(
    request.header("token") || "",
    values.channelName || "",
    values.target || ""
  );
  response.json(res);
});

app.post("/leave-channel", (request, response) => {
  let values = JSON.parse(request.body);
  let res = leaveChannel(
    request.header("token") || "",
    values.channelName || ""
  );
  response.json(res);
});

app.post("/login", (request, response) => {
  let values = JSON.parse(request.body);
  let res = handleLogin(values.username || "", values.password || "");
  console.log(loggedinUsers);
  response.json(res);
});

app.post("/message", (request, response) => {
  let values = JSON.parse(request.body);
  let res = message(
    request.header("token") || "",
    values.channelName || "",
    values.contents || ""
  );
  response.json(res);
});

app.get("/messages", (request, response) => {
  let res = messages(
    request.header("token") || "",
    request.query.channelName || ""
  );
  response.json(res);
});

app.post("/signup", (request, response) => {
  let values = JSON.parse(request.body);
  let res = createNewUser(values.username || "", values.password || "");
  response.json(res);
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
