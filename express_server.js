const express = require("express");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

// const urlDatabase = { }
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

app.get("/urls", (req, res) => {
  const templateVars = { username: req.cookies['username'], urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  console.log(res.statusCode);
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies['username'] }
  res.render("urls_new", templateVars);
});

// this one could be replaced by an href in the edit button
// app.get("/urls/:id/edit", (req, res) => {
//   const templateVars = { username: req.cookies['username'], shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
//   res.render("urls_show", templateVars);
// });

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { username: req.cookies['username'], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  // res.send("Ok");
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body['longURL'];
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body['longURL'];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  console.log(req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

