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
const users = { };

const fetchUser = function(id) {
  return users[id];
}

const findEmail = function(email) {
  for (let user in users) {
    // console.log("User in findEmail: ", user);
    // console.log('user.email: ', users[user].email, 'email:', email);
    if (users[user].email === email) {
      return user;
    } 
  }
  return null; 
};

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

app.get("/urls", (req, res) => {
  const userObj = fetchUser(req.cookies['user_id']);
  console.log('UserObj= ', userObj);
  const templateVars = { user: userObj, urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  console.log(res.statusCode);
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const userObj = fetchUser(req.cookies['user_id']);
  const templateVars = { user: userObj }
  res.render("urls_new", templateVars);
});

// this one could be replaced by an href in the edit button
// app.get("/urls/:id/edit", (req, res) => {
//   const templateVars = { username: req.cookies['username'], shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
//   res.render("urls_show", templateVars);
// });

app.get("/urls/:shortURL", (req, res) => {
  const userObj = fetchUser(req.cookies['user_id']);
  const templateVars = { user: userObj, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// REGISTER ROUTES
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    console.log('Blank field, users =', users);
    return res.sendStatus(400);
  } 
  if (findEmail(req.body.email)) {
    console.log('Email exists users =', users);
    return res.sendStatus(400);
  } else {
    const id = generateRandomString();
    users[id] = { 
      id: id, 
      email: req.body.email,
      password: req.body.password
    };
    console.log('users =', users);
    res.cookie('user_id', id);
    res.redirect("/urls");
  }
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

