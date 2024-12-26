require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://learn-lang-85203.web.app',
    'https://learn-lang-85203.firebaseapp.com'
  ],
  credentials: true
}))
app.use(express.json());
app.use(cookieParser())

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token
  console.log("Token inside the verify token ", token);

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" })
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" })
    }

    req.user = decoded;

    next()
  })
}


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

    // jwt apis 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '5d' })
      console.log(token);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
        .send({ success: true })

    })

    app.post('/logout', async (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
        .send({ message: 'success' })
    })



    // Tutor related apis 

    app.get('/tutors', async (req, res) => {


      const cursor = tutorCollection.find()

      const result = await cursor.toArray();
      res.send(result);
    })

    app.put('/tutors/:id', async (req, res)=>{
      const tutor = (req.body);
      // const id = req.params.id
      console.log(tutor);
      const filter = {_id : new ObjectId(tutor.courseId)}


      const update = {
        $inc : {review : 1}
      }

      const result = await tutorCollection.updateOne(filter, update)
      res.send(result)

  })
  

    app.get('/tutors/:search', async (req, res) => {
      const search = req.params.search

      console.log(search);
      const query = {
        language: {
          $regex: search,
          $options: 'i'
        }
      }

      const cursor = tutorCollection.find(query)

      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/tutors/:category', async (req, res) => {
      const category = req.params.category;
      const query = { language: category }
      const result = await tutorCollection.find(query).toArray()
      res.send(result)
    })

    // my tutorials 
    app.get('/tutors/user/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email }

      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden" })
      }

      //  console.log(req.cookies)

      const result = await tutorCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/tutors', verifyToken, async (req, res) => {

      const tutorial = req.body;
      // console.log(tutorial);
      const result = await tutorCollection.insertOne(tutorial)
      res.send(result)
    })


    app.delete('/tutors/myTutorials/:id', async (req, res) => {
      const id = req.params.id
      //  console.log(id);
      const query = { _id: new ObjectId(id) }
      //  console.log(query);
      const result = await tutorCollection.deleteOne(query)
      //  console.log(result)
      res.send(result)
    })

    app.put('/tutors/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updatedTutorial = req.body;
      console.log(updatedTutorial);
      const tutorial = {
        $set: {
          name: updatedTutorial.name,
          language: updatedTutorial.language,
          price: updatedTutorial.price,
          review: updatedTutorial.review,
          description: updatedTutorial.description,
          image: updatedTutorial.image,
          tutorImage: updatedTutorial.tutorImage,
          email: updatedTutorial.email,
        }
      }

      const result = await tutorCollection.updateOne(filter, tutorial, options)
      res.send(result)
    })


    app.get('/tutor/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await tutorCollection.findOne(query)
      res.send(result)
    })


  //  my booked 
    app.get('/my-booked-tutors/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email }
      const result = await myBookedTutorCollection.find(query).toArray()
      res.send(result)
    })

  

    // book tutor 
    app.post('/my-booked-tutors', async (req, res) => {
      const tutor = req.body;
      console.log(tutor);
      const result = await myBookedTutorCollection.insertOne(tutor)
      
       
       
      res.send(result)

    })

  //       app.put('/my-booked-tutors/:id', async (req, res)=>{
  //     console.log(req.body);
  //     const id = req.params.id
  //     const filter = {_id : new ObjectId(id)}

  //     const update = {
  //       $inc : {review : 1}
  //     }

  //     const result = await tutorCollection.updateOne(filter, update)
  //     res.send(result)

  // })
  


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

app.listen(port, () => {
  console.log("LearnLang is running on port ", port)
})


