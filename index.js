const express = require('express')
const cors = require('cors')

// vars
const port = process.env.PORT || 3000
const app = express()
const corsOptions = {
  origin: "http://localhost:5173",
}

// middleware
app.use(cors(corsOptions))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('welcome!')
})

// start server 
app.listen(port, () => console.log(`listening on http://localhost:${port}`))