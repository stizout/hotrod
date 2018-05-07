var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var app = express();
var methodOverride = require("method-override");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models/user");
app.use(require("express-session")({
    secret: "whatever",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

app.use(express.static("public"));
app.use(methodOverride("_method"));

app.use(bodyParser.urlencoded({extended: true}));
// mongoose.connect("mongodb://localhost/hotrod");
mongoose.connect("mongodb://stizout:packard88@ds217350.mlab.com:17350/hotrod");

var hotrodSchema = new mongoose.Schema({
    title: String,
    image: String,
    make: String,
    model: String,
    year: Number,
    content: String,
    author: {
        id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
        },
        username: String
    }
});

var Hotrod = mongoose.model("Hotrod", hotrodSchema);

app.get("/", function(req, res){
    res.redirect("/hotrods");    
});

// index route
app.get("/hotrods", function(req, res){
    Hotrod.find({}, function(err, allHotrods){
        if(err){
            console.log(err);
        } else {
            res.render("hotrods/index.ejs", {hotrods: allHotrods});
        }
    });
    
});

// New Route

app.get("/hotrods/new",isLoggedIn, function(req, res){
    res.render("hotrods/new.ejs");
});

// Create Route

app.post("/hotrods",isLoggedIn, function(req, res){
    var title = req.body.title;
    var image = req.body.image;
    var make = req.body.make;
    var model = req.body.model;
    var year = req.body.year;
    var content = req.body.content;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newHotrod = {title: title, image: image, make: make, model: model, year: year, content: content, author: author};
    Hotrod.create(newHotrod, function(err, newHotrod){
        if(err){
            res.redirect("/hotrods/new");
        } else {
            res.redirect("/hotrods");
        }
    });
});

// Show Route

app.get("/hotrods/:id", function(req, res){
    Hotrod.findById(req.params.id).populate("comments").exec(function(err, foundhotrod){
        if(err){
            res.redirect("/hotrods");
        } else {
            res.render("hotrods/show.ejs", {hotrod: foundhotrod});
        }
    });
});

// Edit Route

app.get("/hotrods/:id/edit",isLoggedIn, function(req, res){
    Hotrod.findById(req.params.id, function(err, foundhotrod){
        if(err){
            res.redirect("/hotrods/");
        } else {
            res.render("hotrods/edit.ejs", {hotrod: foundhotrod});
        }
    });
});

// Update Route

app.put("/hotrods/:id",isLoggedIn, function(req, res){
    Hotrod.findByIdAndUpdate(req.params.id, req.body.hotrod, function(err, updatehotrod){
        if(err){
            res.redirect("hotrods");
        } else {
            res.redirect("/hotrods/" + req.params.id);
        }
    });
});

// Delete Route

app.delete("/hotrods/:id",isLoggedIn, function(req, res){
    Hotrod.findByIdAndRemove(req.params.id, function(err, deleteHotrod){
        if(err){
            res.redirect("/hotrods");
        } else {
            res.redirect("/hotrods");
        }
    });
});
//  Authentication Routes

// Register Routes

app.get("/register", function(req, res){
    res.render("register.ejs");
});

app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/hotrods");
        });
    });
});

// Login Routes

app.get("/login", function(req, res){
    res.render("login.ejs");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/hotrods",
    failureRedirect: "/login"
}),
function(req, res){});

//  Logout Route

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/hotrods");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server Started");
});