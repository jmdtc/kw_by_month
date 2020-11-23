// server.js
// where your node app starts

// init project
const express = require("express");
const app = express();

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

const jsons = ["holzboeden_BIG", "dielen"]

app.get("/urls", function(request, response) {
  response.send(JSON.stringify(jsons));
});

for (const json of jsons) {
  app.get("/" + json, function(request, response) {
    response.sendFile(__dirname + "/" + json + ".json");
  });
}

app.get("/authenticate", function(request, response) {
  console.log(request, response)
});

