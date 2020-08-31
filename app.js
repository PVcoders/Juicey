//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const _ = require("lodash");

const homeStartingContent = "WELCOME TO THE BLOG OF TEDTUBE. I WILL POST UPDATES NOW AND THEN.";

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(session({
  secret: "yay",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-juiceybird:BBUbZLsAvL4IV8y6@cluster0.vle6t.mongodb.net/itemsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const postSchema = new mongoose.Schema({

  title: String,

  content: String

});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const List = new mongoose.model("List", listSchema)
const Item = new mongoose.model("Item", itemsSchema);
const Post = new mongoose.model("Post", postSchema);

const item1 = new Item({
  name: "Welcome to your to do list!"
})

const item2 = new Item({
  name: "Hit the + button to add an item."
})

const item3 = new Item({
  name: "<-- Hit this to delete a item."
})

const item4 = new Item({
  name: "If you want to go to the search bar at the end do / and then what ever you want for yout title of the to do list."
})

const defaultItems = [item1, item2, item3, item4]

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/google/texts",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: ["profile"]
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);

app.get("/auth/google/texts",
  passport.authenticate('google', {
    failureRedirect: "/"
  }),

  function(req, res) {
    // Successful authentication, redirect to texts.
    res.redirect("/texts");
  });

app.route("/login")

  .post(function(req, res) {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/texts");
        });
      }
    });

  })

  .get(function(req, res) {
    res.render("login");
  });

app.route("/register")

  .post(function(req, res) {

    User.register({
      username: req.body.username
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/texts");
        });
      }
    });

  })

  .get(function(req, res) {
    res.render("register");
  });

app.get("/texts", function(req, res) {

  if (req.isAuthenticated()) {
    User.find({
      "secret": {
        $ne: null
      }
    }, function(err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {
            usersWithSecrets: foundUsers
          });
        }
      }
    });
  } else {
    res.redirect("/")
  }
});

app.route("/submit")

  .get(function(req, res) {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/");
    }
  })

  .post(function(req, res) {
    const submittedSecret = req.body.secret;
    if (req.isAuthenticated()) {
      User.findById(req.user.id, function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.secret = submittedSecret;
            foundUser.save(function() {
              res.redirect("/texts");
            });
          }
        }
      });
    } else {
      res.redirect("/")
    }
  });

app.get("/logout", function(req, res) {
  if (req.isAuthenticated()) {
    req.logout();
    res.redirect("/");
  } else {
    res.redirect("/")
  }
});

app.route("/list")

  .get(function(req, res) {

    if (req.isAuthenticated()) {
      Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
          Item.insertMany(defaultItems, function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Succesfully saved all items to DB");
            }
          });
          res.redirect("/list");
        } else {
          res.render("list", {
            listTitle: "Today",
            newListItems: foundItems
          });
        }
      })
    } else {
      res.redirect("/");
    }
  })

  .post(function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (req.isAuthenticated()) {
      if (listName === "Today") {
        item.save();
        res.redirect("/list");
      } else {
        List.findOne({
          name: listName
        }, function(err, foundList) {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/list" + listName);
        });
      }
    } else {
      res.redirect("/");
    }

  });

app.route("/compose")

  .get(function(req, res) {
    if (req.isAuthenticated()) {
      res.render("compose");
    } else {
      res.redirect("/");
    }
  })

  .post(function(req, res) {
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody
    });

    if (req.isAuthenticated()) {
      post.save(function(err) {
        if (!err) {
          res.redirect("/blog");
        }
      });
    } else {
      res.redirect("/");
    }
  });


app.get("/blog", function(req, res) {

  if (req.isAuthenticated()) {
    Post.find({}, function(err, posts) {
      res.render("blog", {
        startingContent: homeStartingContent,
        posts: posts
      });
    });
  } else {
    res.redirect("/");
  }

});

app.get("/posts/:postId", function(req, res) {

  const requestedPostId = req.params.postId;

  if (req.isAuthenticated()) {
    Post.findOne({
      _id: requestedPostId
    }, function(err, post) {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    });
  } else {
    res.redirect("/");
  }

});

app.get("/list/:customListName", function(req, res) {
  const customListName = "/list/" + _.capitalize(req.params.customListName);

  if (req.isAuthenticated()) {
    List.findOne({
      name: customListName
    }, function(err, foundList) {
      if (!err) {
        if (!foundList) {
          //Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });

          list.save();
          res.redirect(customListName)
        } else {
          //show an existing list

          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items
          })
        }
      } else {
        console.log(err);
      }
    })
  } else {
    res.redirect("/");
  }
})

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (req.isAuthenticated()) {
    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId, function(err) {
        if (!err) {
          console.log("Successfully deleted checked item.");
          res.redirect("/list");
        }
      });
    } else {
      List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: checkedItemId
          }
        }
      }, function(err, foundList) {
        if (!err) {
          res.redirect("/list/" + listName);
        }
      });
    }
  } else {
    res.redirect("/");
  }

});

app.get("/about", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("about");
  } else {
    res.redirect("/");
  }
})

app.get("/tedtube", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("tedtube");
  } else {
    res.redirect("/");
  }
});

app.get("/credits", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("credits");
  } else {
    res.redirect("/");
  }
});

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/contact", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("contact");
  } else {
    res.redirect("/");
  }
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
