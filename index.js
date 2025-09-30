const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5844;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ih9exqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const mongoURI = uri;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//app
const app = express();

//middlewares
app.use(express.json());
app.use(cors());

//mongo URI
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.get("/t", (req, res) => {
      return res.send("OK2");
    });

    const tagsCollection = client.db("forumWabCode").collection("tags");
    const announcementCollection = client
      .db("forumWabCode")
      .collection("announcement");
    const postsCollection = client.db("forumWabCode").collection("posts");
    const commentsCollection = client.db("forumWabCode").collection("comments");
    const postCollection = client.db("forumWabCode").collection("post");
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

    app.get("/postCount", async (req, res) => {
      const count = await postsCollection.estimatedDocumentCount();
      res.send({ count });
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

    // COMMENT
    app.get("/comments/:postId", async (req, res) => {
      const postId = req.params.postId;
      const comments = await commentsCollection
        .find({ postId: postId })
        .toArray();
      res.send(comments);
    });

    // Add comment
    app.post("/comments", async (req, res) => {
      const newComment = req.body;
      const result = await commentsCollection.insertOne(newComment);
      res.send({ ...newComment, _id: result.insertedId });
    });

    // post//////////////////////////////////

    // server.js
  } finally {
  }
};

run().catch((error) => console.log);

app.get("/", (req, res) => {
  res.send("Car Junction Backend Server Running...");
});

app.listen(port, () => {
  console.log(console.log(`Server is running on port ${port}`));
});
