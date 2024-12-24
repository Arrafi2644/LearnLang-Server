require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.duk9d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const tutorCollection = client.db("LearnLang").collection("tutors")
const myTutorialCollection = client.db("LearnLang").collection("myTutorials")
const myBookedTutorCollection = client.db("LearnLang").collection("myBookedTutors")

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // await client.db("admin").command({ ping: 1 });


    app.get('/tutors', async(req, res)=>{
        const cursor = tutorCollection.find()
        const result = await cursor.toArray();
        res.send(result);
    })


    // my tutorial apis 

    app.get('/my-tutorials', async(req, res) => {
      const result = await myTutorialCollection.find().toArray()
      res.send(result)
    })

    app.post('/my-tutorials', async(req, res) => {
      const tutorial = req.body;
      const result = await myTutorialCollection.insertOne(tutorial)
      res.send(result)
    })

    app.get('/tutor/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {_id: id}
      const result = await tutorCollection.findOne(query)
      res.send(result)
    })

    app.post('/my-booked-tutors', async(req, res)=> {
      const tutor = req.body;
      console.log(tutor);
      const result = await myBookedTutorCollection.insertOne(tutor)
      res.send(result)

    })


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
   res.send("LearnLang is running")
})

app.listen(port, ()=>{
    console.log("LearnLang is running on port ", port)
})


