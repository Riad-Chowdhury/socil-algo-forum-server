const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ih9exqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const mongoURI = uri;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

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
      console.log(Math.round(Math.random() * 50000000));
      return res.send("OK3");
    });

    const tagsCollection = client.db("forumWabCode").collection("tags");
    const announcementCollection = client
      .db("forumWabCode")
      .collection("announcement");
    const postsCollection = client.db("forumWabCode").collection("posts");
    const commentsCollection = client.db("forumWabCode").collection("comments");
    const postCollection = client.db("forumWabCode").collection("post");
    const paymentsCollection = client.db("forumWabCode").collection("payments");
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

    // handle-payment
    // app.post("/handle-payment", async (req, res) => {
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: 10000,
    //     currency: "usd",
    //     payment_method: req.body.id,
    //     confirm: true,
    //     automatic_payment_methods: {
    //       enabled: true,
    //       allow_redirects: "never",
    //     },
    //   });

    //   if (paymentIntent.status == "succeeded") {
    //     return res.json({ success: true });
    //   }

    //   return res.json({ success: false });
    // });

    // payment/////////////

    app.get("/payments", async (req, res) => {
      const email = req.params.email;
      try {
        const history = await paymentsCollection
          .find({ userEmail: email })
          .sort({ createdAt: -1 }) // 🔽 Descending
          .toArray();
        res.json(history);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch user payment history" });
      }
    });

    app.post("/create-payment-intent", async (req, res) => {
      try {
        const amountCost = req.body.amountCost;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountCost,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.json({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.status(400).send({ error: error.message });
      }
    });

    app.post("/payments", async (req, res) => {
      const { email, amount, currency, paymentIntentId } = req.body;

      try {
        // 1️⃣ Save payment history
        const payment = {
          userEmail: email,
          amount,
          currency,
          paymentIntentId,
          payment_status: "paid",
          createdAt: new Date(),
        };
        await paymentsCollection.insertOne(payment);

        // 2️⃣ Update user membership status (optional)
        await postCollection.updateOne(
          { email },
          { $set: { isMember: true, badge: "gold" } }
        );

        res.json({ success: true, message: "Payment recorded successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save payment record" });
      }
    });

    // post//////////////////////////////////

    app.get("/countPost", async (req, res) => {
      const count = await postCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/post", async (req, res) => {
      try {
        const userEmail = req.query.email;
        const query = userEmail ? { authorEmail: userEmail } : {};
        const option = {
          sort: {
            createdAt: -1,
          },
        };
        const result = await postCollection.find(query, option).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.post("/post", async (req, res) => {
      try {
        const post = req.body;
        const result = await postCollection.insertOne(post);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/post/search", async (req, res) => {
      const query = req.query.email;

      if (!query) {
        return res.status(400).send({ message: "missing email query" });
      }

      const regex = new RegExp(query, "i");

      const posts = await postCollection
        .find({ authorEmail: { $regex: regex } })
        .project({ authorEmail: 1, title: 1, tag: 1, createdAt: 1 })
        .sort({ createdAt: -1 }) // newest first
        .limit(10)
        .toArray();

      res.send(posts);
    });

    app.get("/post/:email/role", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ message: "Email query is required" });
        }

        const post = await postCollection.findOne(
          { authorEmail: email },
          { projection: { role: 1 }, sort: { _id: -1 } }
        );

        if (!post) {
          return res.status(404).send({ role: "user" });
        }

        res.send({ role: post.role || "user" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.patch("/post/:id/role", async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;

        // role must be valid
        if (!["admin", "user"].includes(role)) {
          return res.status(400).send({ message: "Invalid Role Value" });
        }

        const query = { _id: new ObjectId(id) };

        const updateDoc = {
          $set: { role: role },
        };

        const result = await postCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "User not found" });
        }

        res.send({
          message: `✅ User role updated to: ${role}`,
          result,
        });
      } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error });
      }
    });

    app.delete("/post/:id", async (req, res) => {
      const postId = req.params.id;
      const query = { _id: new ObjectId(postId) };
      const result = await postCollection.deleteOne(query);

      res.send(result);
    });

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
