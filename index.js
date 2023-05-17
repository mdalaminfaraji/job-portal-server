const express=require('express');
const cors=require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app=express();
const port=process.env.PORT || 5000;

// console.log(process.env.DB_User);
// console.log(process.env.DB_Pass);
// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.wu2rnap.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser:true,
  useUnifiedTopology:true,
  maxPoolSize:10
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect((err)=>{
        if(err){
            console.error(err);
            return;
        }
    });

    const jobsCollection=client.db("jobPortal").collection("jobs");

    // creating index on two fields
    const indexKeys={title:1, category:1};//replace field1 and field2 with your actual field name

    const indexOptions={name:"titleCategory"};//replace index_name with the desired index name
    const result=await jobsCollection.createIndex(indexKeys, indexOptions);

  app.get('/getJobsByText/:text', async (req, res)=>{
    const searchText=req.params.text;
    const result=await jobsCollection.find({
        $or:[
            {title:{$regex:searchText, $options:'i'}},
            {category:{$regex:searchText, $options:'i'}},
        ]
    }).toArray();
    res.send(result);
  })



    app.get('/allJobs/:text', async(req, res)=>{
        if(req.params.text=="remote" || req.params.text=="offline"){
            const result=await jobsCollection.find({status:req.params.text}).sort({createdAt:-1}).toArray();
            return res.send(result);
        }

        const result=await jobsCollection.find().toArray();
        res.send(result);
    })

    app.get('/myJobs/:email', async(req, res)=>{
        console.log('Email=',req.params.email);
        const result=await jobsCollection.find({postedBy:req.params.email}).toArray();
        
        res.send(result);
    })

    app.post('/postJob', async(req, res)=>{
        const body=req.body;
        body.createdAt=new Date();
        // if(!body){
        //    return res.status(404).send({message:"body data not found"});
        // }
       const result=await jobsCollection.insertOne(body);
       res.send(result);
    })

    app.put("/updateJob/:id", async(req, res)=>{
        const id=req.params.id;
        const body=req.body;
        const filter={_id:new ObjectId(id)};
        const updateDoc={
            $set:{
                title:body.title,
                status:body.status,
            },
        };
        const result=await jobsCollection.updateOne(filter, updateDoc);
        res.send(result);
    })

    app.delete('/deleteJob/:id', async(req, res)=>{
        const id=req.params.id;
        const filter={_id:new ObjectId(id)};
        const result=await jobsCollection.deleteOne(filter);
        res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('server is running...................');
})

app.listen(port, () => {
    console.log(`Job portal server is running on port ${port}`);
 }) 
  
