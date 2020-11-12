const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080; 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

// const urlDatabase = { };
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "7yrp7d" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "7yrp7d" }
};
const users = { };
// const users = { id: { id: '7yrp7d', email: 'email@email.com', password: 'pass1' } };

const fetchUser = function(id) {
  return users[id];
}

// returns single user object if email is found, null if email is not found.
const findUserByEmail = function(email) {
  for (let key in users) {
    // console.log("User in findUserByEmail: ", user);
    // console.log('user.email: ', users[user].email, 'email:', email);
    if (users[key].email === email) {
      // return users[key];
      return fetchUser(key);
    } 
  }
  return null; 
};

// returns an array with the URLs that belong to the currently logged-in user
const urlsForUser = function(id) {
  // const userUrls = [];
  const filteredDatabase = { };
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredDatabase[url] = urlDatabase[url];
    }
  }
  return filteredDatabase;
};

const isUserUrl = function (url, id) {
  console.log("isUserUrl url:", url, "id", id);
  console.log("urlDatabase[url]['userID']", urlDatabase[url]['userID']);
  if (urlDatabase[url]['userID'] === id) {
    return true;
  }
  return false;
};

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

// URLS ROUTES
app.get("/urls", (req, res) => {
  const userObj = fetchUser(req.cookies['user_id']);
  console.log('UserObj= ', userObj);
  filteredUrls = urlsForUser(req.cookies['user_id']);
  const templateVars = { user: userObj, urls: filteredUrls };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log('req.body line 132', req.body);
  const shortURL = generateRandomString();
  console.log("urlDatabase[shortURL]", urlDatabase[shortURL])
  urlDatabase[shortURL] = { longURL: req.body['longURL'], userID: req.cookies['user_id'] }
  console.log(urlDatabase);
  // res.redirect(`/urls/${shortURL}`);
  res.redirect("/urls");
});

// REDIRECT shortURL --> longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL; // added .longURL
  console.log(longURL);
  console.log(res.statusCode);
  res.redirect(longURL);
});

// CREATE NEW ROUTE
app.get("/urls/new", (req, res) => {
  const userObj = fetchUser(req.cookies['user_id']);
  if (!userObj) {
    return res.redirect("/login");
  }
  const templateVars = { user: userObj }
  res.render("urls_new", templateVars);
});

// EDIT ROUTES 
app.get("/urls/:shortURL", (req, res) => {
  const userObj = fetchUser(req.cookies['user_id']);
  const templateVars = { user: userObj, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL }; // added . longURL
    if(!userObj) {
      return res.send("Cannot access url. Log in required!");
    } else if (!isUserUrl(templateVars.shortURL, req.cookies['user_id'])) { 
      return res.send("Cannot access url. It does not belong to this user.")
    } else {
      res.render("urls_show", templateVars);
    }
});

app.post("/urls/:id", (req, res) => {
  if (!isUserUrl(req.params.id, req.cookies['user_id'])) {
    return res.send("Cannot modify url!!!\n");
  }
  console.log('req.body line 141', req.body);
  console.log("urlDatabase[req.params.id]", urlDatabase[req.params.id])
  urlDatabase[req.params.id].longURL = req.body['longURL']; // added .longURL
  res.redirect("/urls");
});

// REGISTER ROUTES
app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render("register.ejs", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    console.log('Blank field, users =', users);
    return res.status(400).send("Missing e-mail or password!");
  } 
  if (findUserByEmail(req.body.email)) {
    console.log('Email exists users =', users);
    return res.status(400).send("E-mail already exists!");
  } else {
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[id] = { 
      id: id, 
      email: req.body.email,
      password: hashedPassword
    };
    console.log('orig password: ', req.body.password)
    console.log('users =', users);
    res.cookie('user_id', id);
    res.redirect("/urls");
  }
});

// LOGIN ROUTES
app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render("login.ejs", templateVars);
});

app.post("/login", (req, res) => {
  let user = findUserByEmail(req.body.email);
  console.log("Login user: ", user);
  if (!user) {
    return res.status(403).send("E-mail address is not registered!");
  }
  // if (user.password !== req.body.password) {
    console.log("user.password: ", user.password, "req.body.password: ", req.body.password);
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(403).send("Incorrect password!");
  }
  res.cookie('user_id', user.id);
  res.redirect("/urls");
});

// // Useless routes
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// DELETE ROUTE
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!isUserUrl(req.params.shortURL, req.cookies['user_id'])) {
    return res.send("Cannot delete url!!!\n");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// LOGOUT ROUTE
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

