//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const React = require("react");
const ReactDOM = require("react-dom");

const homeStartingContent = "WELCOME TO THE BLOG OF TEDTUBE. I WILL POST UPDATES NOW AND THEN.";

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-juiceybird:BBUbZLsAvL4IV8y6@cluster0.vle6t.mongodb.net/itemsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

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
  secret: String
});

const User = new mongoose.model("User", userSchema)
const List = mongoose.model("List", listSchema)
const Item = mongoose.model("Item", itemsSchema);
const Post = mongoose.model("Post", postSchema);

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
  name: "If you want to go to the search bar at the end do / and then what ever you want for the title of the to do list you will generate by hitting enter or return. You do not need to capitalize your list title."
})

const defaultItems = [item1, item2, item3, item4]

app.route("/list")

  .get(function(req, res) {

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
          listTitle: "Change this title!",
          newListItems: foundItems
        });
      }
    })
  })

  .post(function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

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
  });

app.route("/compose")

  .get(function(req, res) {
    res.render("compose");
  })

  .post(function(req, res) {
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody
    });


    post.save(function(err) {
      if (!err) {
        res.redirect("/blog");
      }
    });
  });


app.get("/blog", function(req, res) {

  Post.find({}, function(err, posts) {
    res.render("blog", {
      startingContent: homeStartingContent,
      posts: posts
    });
  });
});

app.get("/posts/:postId", function(req, res) {

  const requestedPostId = req.params.postId;

  Post.findOne({
    _id: requestedPostId
  }, function(err, post) {
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

app.get("/list/:customListName", function(req, res) {
  const customListName =  _.capitalize(req.params.customListName);

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
        res.redirect("/list/" + customListName)
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
})

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

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


});

app.get("/", function(req, res){
  res.render("home");
})

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/tedtube", function(req, res) {
  res.render("tedtube");
});

app.get("/credits", function(req, res) {
  res.render("credits");
});

app.get("/contact", function(req, res) {
  res.render("contact");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Frenchfries served on table 3000");
});
