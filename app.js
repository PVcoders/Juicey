const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const homeStartingContent = "WELCOME TO THE BLOG OF TEDTUBE. I WILL POST UPDATES NOW AND THEN.";

//books
const chapter1YehTedtube = "  Mr. Frenchfries was busy enjoying his potato soup...  When suddenly... Boom! He was also Lazr Potato! He knew who this was, Dr.Hamborger! The menacing bad guy he was fighting for weeks. This was his most villainous day ever. He called his friend: HOODIE RYAN! They needed their supplies: quicksand, and smores. They piled the sand on the step Dr.Hamborger’ s robot It sank a little but it quickly got up! They needed more quicksand but where would they find more ? "
const chapter2Part1YehTedtube = "  Lazr Potato thought with Blue Raspberry Boy they found out, in quicksand world! They set out to find quicksand world. They were greeted by many fans. Their fans gave them helpful stuff on their quest. Compass, a costume, and some fast food. They made a rocket out of spare parts. They were finally ready for their trip...  "
const chapter2Part2YehTedtube = "  2 hours later, they were halfway on their trip when, 'Self destructing in 10,9,8... ' Lazr potato was sleeping and his head pressed the button! What would Blue Raspberry boy do? "
const chapter3YehTedtube = "He threw Lazr Potato in a tiny recovery ship. He also got in too. He had to drive now. He let lazr potato sleep in the back. Now they are going to quicksand world."
const chapter4YehTedtube = "  “We’re here lazr potato wake UP!” Said Blue raspberry boy, they were, where they thought was quicksand world. Little did they know it was a Hamborger asteroid. Lazr potato searched the place and found it. The super secret spy place, he’d heard of it. He looked in the window with his partner, he saw JG he was tied up! "

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

const articleSchema = {
  _id: Number,
  name: String,
  status: String,
  looks: String
}

const Article = new mongoose.model("Article", articleSchema);
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
  name: "If you want to go to the search bar at the end do / and then what ever you want for the title of the to do list you will generate by hitting enter or return. You do not need to capitalize your list title."
})

const defaultItems = [item1, item2, item3, item4]

app.route("/articles/wiki")

  .get(function(req, res) {
    Article.find(function(err, foundArticles) {
      if (!err) {
        res.send(foundArticles)
      } else {
        res.send(err)
      }
    })
  })

  .post(function(req, res) {
    const newArticle = new Article({
      _id: req.body.id,
      name: req.body.name,
      status: req.body.status,
      looks: req.body.looks
    });

    newArticle.save(function(err) {
      if (!err) {
        res.send("Succesfully add new article!")
      } else {
        console.log(err);
      }
    })
  })

  .delete(function(req, res) {
    Article.deleteMany(function(err) {
      if (!err) {
        res.send("Succesfully deleted all articles.")
      } else {
        res.send(err)
      }
    })
  });

app.route("/articles/wiki/:articleTitle")

  .get(function(req, res) {

    Article.findOne({
      _id: req.params.articleTitle
    }, function(err, foundArticle) {
      if (foundArticle) {
        res.send(foundArticle)
      } else {
        res.send("No articles matching that title was found. Frenchy is sad.")
      }
    })

  })

  .put(function(req, res) {
    Article.updateOne({
        _id: req.params.articleTitle
      }, {
        _id: req.body.id,
        name: req.body.name,
        status: req.body.status,
        looks: req.body.looks
      }, {
        overwrite: true
      },
      function(err) {
        if (!err) {
          res.send("Succesfully updated article!")
        }
      })
  })

  .patch(function(req, res) {
    Article.updateOne({
        _id: req.params.articleTitle
      }, {
        $set: req.body
      },
      function(err) {
        if (!err) {
          res.send("Succesfully updated article")
        } else {
          res.send(err)
        }
      })
  })

  .delete(function(req, res) {
    Article.deleteOne({
      _id: req.params.articleTitle
    }, function(err) {
      if (!err) {
        res.send("Succesfully deleted article")
      } else {
        res.send(err)
      }
    })
  });

app.route("/list")
  .get(function (req, res) {
    Item.find({}, function (err, foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("You deleted everything. Thus, restoring default entries for demo purpose!");
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
  })

  .post(function (req, res) {
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
      }, function (err, foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/list" + listName);
      });
    }
  });

app.get("/blog", function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("blog", {
      startingContent: homeStartingContent,
      posts: posts
    });
  });
});

app.route("/blog/compose")

  .get(function (req, res) {
    res.render("compose");
  })

  .post(function (req, res) {
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody
    });


    post.save(function (err) {
      if (!err) {
        res.redirect("/blog");
      }
    });
  });

app.get("/blog/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;
  Post.findOne({
    _id: requestedPostId
  }, function (err, post) {
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

app.get("/list/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/list/" + customListName)
      } else {
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

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
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
    }, function (err, foundList) {
      if (!err) {
        res.redirect("/list/" + listName);
      }
    });
  }


});

app.get("/", function (req, res) {
  res.render("home");
})

app.get("/tedtube", function (req, res) {
  res.render("tedtube");
});

app.get("/credits", function (req, res) {
  res.render("credits");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/stories", function (req, res) {
  res.render("stories", {
    chapter1YehTedtube: chapter1YehTedtube,
    chapter2Part1YehTedtube: chapter2Part1YehTedtube,
    chapter2Part2YehTedtube: chapter2Part2YehTedtube,
    chapter3YehTedtube: chapter3YehTedtube,
    chapter4YehTedtube: chapter4YehTedtube
  });
});

app.get("/articles", function(req, res) {
  res.render("articles")
})

app.get("/contact", function (req, res) {
  res.render("contact");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Frenchfries served on table 3000");
});