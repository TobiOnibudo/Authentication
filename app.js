//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
extended: true
}));

app.use(session({
    secret:"Our little secret.",
    resave: false,
    saveUninitialized: false
}))


app.use (passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email : String,
    password: String,
    secret: String
});


userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.serializeUser(User.deserializeUser());

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res .render("register");
});



app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}})
    .then(function (foundUsers) {
        console.log(foundUsers)
     res.render("secrets",{usersWithSecrets:foundUsers});
      })
    .catch(function (err)
     {
      console.log(err);
      })
});

app.get("/submit", function(req,res)
{
    
    if (req.isAuthenticated())
    {
        res.render("submit");
    } else
    {
        res.redirect("/login");
    }
})

app.post("/submit", function (req, res) {
    console.log(req.user);
     User.find({username : req.user})
       .then(foundUser => {
        if (foundUser) {
          foundUser[0].secret = req.body.secret;
          return foundUser[0].save();
        }
        return null;
      })
      .then(() => {
        res.redirect("/secrets");
      })
      .catch(err => {
        console.log(err);
      });
});
 


passport.serializeUser(function(user, done) {
    process.nextTick(function() {
        done(null, { id: user._id, username: user.username });
    });
});
passport.deserializeUser(function(user, done) {
    process.nextTick(function() {
        return done(null, user);
    });
});
 
 
app.post("/register", async (req, res) => {
    // Huge security bug to be fixed
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
    
});
 
app.post("/login", (req, res) => {
	const user = new User({
		username: req.body.username,
		password: req.body.password
	});
 
	req.login(user, (err) => {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function() {
				res.redirect("/secrets");
			});
		}
	});
});
 
app.get("/logout", (req, res, next) => {
	req.logout(function(err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});



app.listen(3000, function(){
    console.log("Server started on port 3000");
});

