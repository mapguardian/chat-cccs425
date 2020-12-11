// server.js
// where your node app starts

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

let carts = [];
let users = [];
let loggedinUsers = [];
let listings = [];

let addToCart = (token, itemid) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  if (itemid === "") return { success: false, reason: "itemid field missing" };

  let [item, idx] = getItem(itemid);

  if (idx === -1) return { success: false, reason: "Item not found" };

  let [cart, cidx] = getCart(username);

  carts[cidx].cart.push(item);
};

let changePassowrd = (token, oldPassword, newPassword) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  let currentUserIdx = users
    .map((u) => {
      return u.username;
    })
    .indexOf(username);
  let currentUser = users[currentUserIdx];

  if (currentUser.password !== oldPassword)
    return { success: false, reason: "Unable to authenticate" };

  currentUser.password = newPassword;

  return { success: true };
};

let createListing = (token, price, description) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  if (price === "") return { success: false, reason: "price field missing" };

  if (description === "")
    return { success: false, reason: "description field missing" };

  let itemId = getNewListingId();
  listings.push({ price, description, itemId, sellerUsername: username });

  return { success: true, listingId: itemId };
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

let getCart = (username) => {
  let idx = carts
    .map((e) => {
      return e.username;
    })
    .indexOf(username);

  if (idx === -1) {
    carts.push({ username, cart: [] });
    idx = carts.length - 1;
  }

  return [carts[idx], idx];
};

let getItem = (itemId) => {
  let idx = listings
    .map((e) => {
      return e.itemId;
    })
    .indexOf(itemId);

  return [listings[idx], idx];
};

let getListing = (listingId) => {
  let [item, idx] = getItem(listingId);
  if (idx === -1) return { success: false, reason: "Invalid listing id" };
  return { success: true, listing: item };
};

let getNewListingId = () => {
  let randomData = getRandomData();
  return randomData;
};

let getToken = () => {
  let randomData = getRandomData() + getRandomData();
  return randomData;
};

let getRandomData = () => {
  return Math.random().toString(36).substr(2);
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

let modifyListing = (token, itemId, price, description) => {
  let [tokenCheck, username] = validateToken(token);
  if (!tokenCheck.success) return tokenCheck;

  if (itemId === "") return { success: false, reason: "itemid field missing" };

  let [item, idx] = getItem(itemId);

  //if (item.sellerUsername !== username) return { success: false };

  if (price !== "") listings[idx].price = price;
  if (description !== "") listings[idx].description = description;

  return { success: true };
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

app.post("/add-to-cart", (request, response) => {
  let values = JSON.parse(request.body);
  let res = addToCart(request.header("token") || "", values.itemid || "");
  response.json(res);
});

app.post("/change-password", (request, response) => {
  let values = JSON.parse(request.body);
  let res = changePassowrd(
    request.header("token") || "",
    values.oldPassword || "",
    values.newPassword || ""
  );
  response.json(res);
});

app.post("/create-listing", (request, response) => {
  let values = JSON.parse(request.body);
  let res = createListing(
    request.header("token") || "",
    values.price || "",
    values.description || ""
  );
  response.json(res);
});

app.get("/listing", (request, response) => {
  let res = getListing(request.query.listingId || "");
  response.json(res);
});

app.post("/login", (request, response) => {
  let values = JSON.parse(request.body);
  let res = handleLogin(values.username || "", values.password || "");
  console.log(loggedinUsers);
  response.json(res);
});

app.post("/modify-listing", (request, response) => {
  let values = JSON.parse(request.body);
  let res = modifyListing(
    request.header("token") || "",
    values.itemid || "",
    values.price || "",
    values.description || ""
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
