const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ih9exqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const tagsCollection = client.db("forumWabCode").collection("tags");
    const announcementCollection = client
      .db("forumWabCode")
      .collection("announcement");
    const postsCollection = client.db("forumWabCode").collection("posts");

    // add tags
    app.get("/tags", async (req, res) => {
      const result = await tagsCollection.find().toArray();
      res.send(result);
    });

    app.post("/tags", async (req, res) => {
      const newTag = req.body;
      console.log(newTag);
      const result = await tagsCollection.insertOne(newTag);
      res.send(result);
    });

    // add AnnouncementForm

    app.post("/announcement", async (req, res) => {
      const announcementForm = req.body;
      console.log(announcementForm);

      const result = await announcementCollection.insertOne(announcementForm);

      res.send(result);
    });

    app.get("/announcements", async (req, res) => {
      const announcements = await announcementCollection
        .find({ status: "active" })
        .toArray();
      res.send(announcements);
    });

    // Get announcement count
    app.get("/announcements/count", async (req, res) => {
      const count = await announcementCollection.countDocuments({
        status: "active",
      });
      res.send({ count });
    });

    //  posts

    app.get("/posts", async (req, res) => {
      const posts = await postsCollection
        .find()
        .sort({ publishDate: -1 })
        .toArray();
      res.send(posts);
    });
    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.findOne(query);
      res.send(result);
    });
    app.post("/posts", async (req, res) => {
      const post = req.body;
      const result = await postsCollection.insertOne(post);
      res.send(result);
    });

    app.delete("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Forum code coking ");
});

app.listen(port, () => {
  console.log(`Forum server code is running on port ${port}`);
});
