const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helpers.js');

const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "7yrp7d" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "7yrp7d" }
};
const users = { };

// returns an array with the URLs that belong to the currently logged-in user
const urlsForUser = function(id) {
  const filteredDatabase = { };
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredDatabase[url] = urlDatabase[url];
    }
  }
  return filteredDatabase;
};

const isUserUrl = function(url, id) {
  if (urlDatabase[url]['userID'] === id) {
    return true;
  }
  return false;
};

const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

// URLS ROUTES
app.get("/urls", (req, res) => {
  const userObj = users[req.session.user_id];
  const filteredUrls = urlsForUser(req.session.user_id);
  const templateVars = { user: userObj, urls: filteredUrls };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body['longURL'], userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// REDIRECT shortURL --> longURL
app.get("/u/:shortURL", (req, res) => {
  const userObj = users[req.session.user_id];
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = { user: userObj, shortURL: req.params.shortURL, notOwner: false };
    return res.render("error_url", templateVars);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// CREATE NEW ROUTE
app.get("/urls/new", (req, res) => {
  const userObj = users[req.session.user_id];
  if (!userObj) {
    return res.redirect("/login");
  }
  const templateVars = { user: userObj };
  res.render("urls_new", templateVars);
});

// EDIT ROUTES
app.get("/urls/:shortURL", (req, res) => {
  const userObj = users[req.session.user_id];
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = { user: userObj, shortURL: req.params.shortURL };
    return res.render("error_url", templateVars);
  }
  const templateVars = { user: userObj, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  if (!userObj) {
    return res.render("error_url", templateVars);
  } else if (!isUserUrl(templateVars.shortURL, req.session.user_id)) {
    templateVars['notOwner'] = true;
    return res.render("error_url", templateVars);
  } else {
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  if (!isUserUrl(req.params.id, req.session.user_id)) {
    return res.send("Cannot modify url!!!\n");
  }
  urlDatabase[req.params.id].longURL = req.body['longURL'];
  res.redirect("/urls");
});

// REGISTER ROUTES
app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("register.ejs", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    const templateVars = { user: null, blankField: true };
    return res.render("error_register", templateVars);
  }
  if (getUserByEmail(req.body.email, users)) {
    const templateVars = { user: null , blankField: false };
    return res.render("error_register", templateVars);
  } else {
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[id] = {
      id: id,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

// LOGIN ROUTES
app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("login.ejs", templateVars);
});

app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email, users);
  if (!user) {
    return res.status(403).send("E-mail address is not registered!");
  }
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    const templateVars = { user: null };
    return res.render("error_login", templateVars);
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

// ROOT ROUTE ;)
app.get("/", (req, res) => {
  const userObj = users[req.session.user_id];
  if (!userObj) {
    return res.redirect("/login");
  }
  // const templateVars = { user: userObj };
  res.redirect("/urls");
});

// DELETE ROUTE
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!isUserUrl(req.params.shortURL, req.session.user_id)) {
    return res.send("Cannot delete url!!!\n");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// LOGOUT ROUTE
app.post("/logout", (req, res) => {
  // clear cookies
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
