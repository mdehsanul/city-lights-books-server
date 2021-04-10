const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ObjectID = require("mongodb").ObjectID;
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// firebase
var admin = require("firebase-admin");
var serviceAccount = require("./configs/pen-square-firebase-adminsdk-6c7vt-3a16710eaf.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Mongodb
const MongoClient = require("mongodb").MongoClient;
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
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer")) {
      const idToken = bearer.split(" ")[1];
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          // const uid = decodedToken.uid;
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            orderCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          } else {
            res.status(401).send("Un-authorized access");
          }
        })
        .catch((error) => {
          res.status(401).send("Un-authorized access");
        });
    } else {
      res.status(401).send("Un-authorized access");
    }
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
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
