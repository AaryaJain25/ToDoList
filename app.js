//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-aarya:test123@cluster0.gptlz.mongodb.net/todolistDB", { useUnifiedTopology: true, useNewUrlParser: true });

const itemsSchema = {
  name: String
  };

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Buy Food"
});
const item2 = new Item({
  name: "Prepare Food"
});
const item3 = new Item({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

      if(foundItems.length == 0) {
        Item.insertMany(defaultItems, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("Added default items.");
          }
        });
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
  });

});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(!err) {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/:customListNames", function(req, res) {
  const customListNames = _.capitalize(req.params.customListNames);

  List.findOne({name: customListNames}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        //create new list
        const list = new List({
          name: customListNames,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListNames);
      } else {
        //shows existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

  });


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

app.listen(3000, function() {
  console.log("Server started successfully.");
});