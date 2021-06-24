const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

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

const articleSchema = {
  _id: Number,
  name: String,
  status: String
}

const Article = new mongoose.model("Article", articleSchema);
const List = new mongoose.model("List", listSchema)
const Item = new mongoose.model("Item", itemsSchema);
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

  .get(function (req, res) {
    Article.find(function (err, foundArticles) {
      if (!err) {
        res.send(foundArticles)
      } else {
        res.send(err)
      }
    })
  })

  .post(function (req, res) {
    const newArticle = new Article({
      _id: req.body.id,
      name: req.body.name,
      status: req.body.status
    });

    newArticle.save(function (err) {
      if (!err) {
        res.send("Succesfully add new article!")
      } else {
        console.log(err);
      }
    })
  })

  .delete(function (req, res) {
    Article.deleteMany(function (err) {
      if (!err) {
        res.send("Succesfully deleted all articles.")
      } else {
        res.send(err)
      }
    })
  });

app.route("/articles/wiki/:articleTitle")

  .get(function (req, res) {

    Article.findOne({
      _id: req.params.articleTitle
    }, function (err, foundArticle) {
      if (foundArticle) {
        res.send(foundArticle)
      } else {
        res.send("No articles matching that title was found. Frenchy is sad.")
      }
    })

  })

  .put(function (req, res) {
    Article.updateOne({
        _id: req.params.articleTitle
      }, {
        _id: req.body.id,
        name: req.body.name,
        status: req.body.status
      }, {
        overwrite: true
      },
      function (err) {
        if (!err) {
          res.send("Succesfully updated article!")
        }
      })
  })

  .patch(function (req, res) {
    Article.updateOne({
        _id: req.params.articleTitle
      }, {
        $set: req.body
      },
      function (err) {
        if (!err) {
          res.send("Succesfully updated article")
        } else {
          res.send(err)
        }
      })
  })

  .delete(function (req, res) {
    Article.deleteOne({
      _id: req.params.articleTitle
    }, function (err) {
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

app.get("/articles", function (req, res) {
  res.render("articles")
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Frenchfries served on table 3000");
});
