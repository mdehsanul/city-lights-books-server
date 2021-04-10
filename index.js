const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const cors = require("cors");
const ObjectID = require("mongodb").ObjectID;
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello From Database, I am working!!!!");
});

// firebase
var admin = require("firebase-admin");
var serviceAccount = require("./configs/pen-square-firebase-adminsdk-6c7vt-3a16710eaf.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Mongodb
const { response } = require("express");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7ajpn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client.db("penSquare").collection("books");
  const orderCollection = client.db("penSquare").collection("orders");

  // Create
  app.post("/addBook", (req, res) => {
    const newBook = req.body;
    collection.insertOne(newBook).then((result) => {
      console.log("inserted count: ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  // Read
  app.get("/bookDetail", (req, res) => {
    collection.find().toArray((err, documents) => {
      res.send(documents);
    });
  });

  // Read single item
  app.get("/book/:id", (req, res) => {
    collection
      .find({ _id: ObjectID(req.params.id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });

  // Read specific user order
  app.get("/orderDetail", (req, res) => {
    // console.log(req.query.email);
    orderCollection
      .find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });

  // Delete
  app.delete("/delete/:id", (req, res) => {
    collection.deleteOne({ _id: ObjectID(req.params.id) }).then((result) => {
      res.send(result.deletedCount > 0);
    });
  });

  // Checkout
  app.post("/addOrder", (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
});

// port
const port = 4000;
app.listen(process.env.PORT || port);
