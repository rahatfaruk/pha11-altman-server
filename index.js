const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// vars
const port = process.env.PORT || 5000
const app = express()
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.ympa4ek.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const corsOptions = {
  origin: "http://localhost:5173",
}
// create mongo client
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, }
});

// middleware
app.use(cors(corsOptions))
app.use(express.json())

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db('pha11')
    const collQueries = db.collection('queries')
    const collRecommendations = db.collection('recommendations')

    app.get('/', (req, res) => {
      res.send('welcome to pha11!')
    })
    // get all queries (sort by descending time)
    app.get('/all-queries', async (req, res) => {
      const sort = {postedTimestamp: -1}
      const cursor = collQueries.find().sort(sort)
      const data = await cursor.toArray()
      res.send(data)
    })
    // get recent queries (max 6 items)
    app.get('/recent-queries', async (req, res) => {
      const sort = {postedTimestamp: -1}
      const cursor = collQueries.find().sort(sort).limit(6)
      const data = await cursor.toArray()
      res.send(data)
    })
    // get my queries (using logged email)
    app.get('/my-queries', async (req, res) => {
      const query = req.query
      const sort = {postedTimestamp: -1}
      const cursor = collQueries.find(query).sort(sort)
      const data = await cursor.toArray()
      res.send(data)
    })
    // get query details 
    app.get('/query-details', async (req, res) => {
      const id = req.query.id 
      const query = { _id: new ObjectId(id) }
      const data = await collQueries.findOne(query)
      res.send(data)
    })
    // add new recommendation
    app.post('/add-recommendation', async (req, res) => {
      const newRec = req.body 
      const data = await collRecommendations.insertOne(newRec)
      res.send(data)
    })

    // Send a ping to confirm a successful connection
    await db.command({ ping: 1 });
    console.log("Pinged! Successfully connected to MongoDB!");
  } catch(err) {
    console.log(err);
  }
}
run().catch(console.dir);

// start server 
app.listen(port, () => console.log(`listening on http://localhost:${port}`))