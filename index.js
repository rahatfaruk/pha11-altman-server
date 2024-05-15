const express = require('express')
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// vars
const app = express()
const port = process.env.PORT || 5000
const privateKey = process.env.PRIVATE_KEY
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.ympa4ek.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const corsOptions = {
  origin: ["http://localhost:5173", "https://pha11-altproduct.web.app", "https://pha11-altproduct.firebaseapp.com"],
  "credentials": true, 
  "optionsSuccessStatus": 200,
}
// create mongo client
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, }
});

// middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// def middleware: verify jwt token
function verifyToken(req, res, next) {
  const token = req.cookies?.token

  // check if any token exist 
  if(!token) {
    return res.status(401).send({message: 'unauthorized'})
  }

  jwt.verify(token, privateKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({message: 'unauthorized'})
    } 
    req.user = decoded
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db('pha11')
    const collQueries = db.collection('queries')
    const collRecommendations = db.collection('recommendations')

    // ## jwt: create cookies
    app.post('/jwt', async (req, res) => {
      const user = { email: req.body.email }
      // create jwt token
      const token = jwt.sign(user, privateKey, {expiresIn: '6h'})
      // set cookie
      res.cookie('token', token, {httpOnly: true, secure: true, sameSite: 'none'}).send({success: true})
    })
    // ## clear cookie
    app.get('/clear-jwt', async (req, res) => {
      res.clearCookie('token').send({message: 'cleared cookie'})
    })

    // regular api --------------------------
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
    app.get('/my-queries', verifyToken,async (req, res) => {
      const query = req.query
      // verify user email: req.user.email --> set on verifyToken
      if(req.user.email !== query.userEmail) {
        return res.status(403).send({success: false, message: 'forbidden access'})
      }
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
    // get comments/recommendations of a query
    app.get('/query-comments', async (req, res) => {
      const sort = {postedTimestamp: -1}
      const cursor = collRecommendations.find(req.query).sort(sort)
      const data = await cursor.toArray()
      res.send(data)
    })
    // comments/recommendations (for me && by me)
    app.get('/all-recommendations', async (req, res) => {    
      const cursor = collRecommendations.find(req.query)
      const data = await cursor.toArray()
      res.send(data)
    })

    // add new query
    app.post('/add-query', async (req, res) => {
      const result = await collQueries.insertOne(req.body)
      res.send(result)
    })
    // add new recommendation
    app.post('/add-recommendation', async (req, res) => {
      const newRec = req.body 
      const {queryId} = newRec

      // add recommend: inside rec collection
      const insertedData = await collRecommendations.insertOne(newRec)

      // increment  recommendation count of the query: inside query collection
      const filter = { _id: new ObjectId(`${queryId}`) }
      const updateDoc = { $inc: {recommendationCount: 1} }
      await collQueries.updateOne(filter, updateDoc)
      res.send(insertedData)
    })
    
    // delete recommendation
    app.delete('/delete-recommendation/:id', async (req, res) => {
      const id = req.params.id 
      const query = { _id: new ObjectId(id) }
      // delete recommendation 
      const result = await collRecommendations.deleteOne(query)
      // decrement recommendation count in queries
      const updateDoc = { $inc: {recommendationCount: -1} }
      await collQueries.updateOne(query, updateDoc)
      // const data = await collQueries.findOne(query)
      res.send(result)
    })
    // update query
    app.patch('/update-query', async (req, res) => {
      const id = req.query.id
      const newData = req.body 
      
      const filter = { _id: new ObjectId(id) }
      const updateDoc = { $set: newData }
      const result = await collQueries.updateOne(filter, updateDoc)
      res.send(result)
    })
    // delete query
    app.delete('/delete-query/:id', verifyToken,async (req, res) => {
      const id = req.params.id
      // verify user email: req.user.email --> set on verifyToken
      if(req.user.email !== req.query.email) {
        return res.status(403).send({success: false, message: 'forbidden access'})
      } 
      const query = { _id: new ObjectId(id) }
      const result = await collQueries.deleteOne(query)
      res.send(result)
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