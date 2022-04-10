const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const db = process.env.exerciseTracker;
const moment = require('moment');
// --unhandled-rejections=strict
mongoose.Promise = global.Promise;

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// connect to mongodb
mongoose.connect(process.env.exerciseTracker, {
  useNewURLParser: true,
  useUnifiedTopology: true
})

// create user schema and model
const user = new Schema({
  username: String,
  Log: []
});

const Users = mongoose.model("Users", user);

//  create exercise schema and model
const exercise = new Schema({
  userId: String,
  username: String,
  description: String,
  duration: Number,
  date: String
}) 

const Exercises = mongoose.model("Exercises", exercise);


// use body parser to parse Post reqests
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())


// register user
app.post("/api/users", (req, res)=>{
  // console.log(req.body.username)
  // res.json({user: req.params})

  var registerUser = new Users({
    username: req.body.username
  });

  registerUser.save()

  // console.log(registerUser)

  res.json(registerUser)

});

// get list of registered users
app.get('/api/users', (req, res) => {
  // res.json(Users)

  Users.find({}, (err, users)=> {

    const allUsers = [];

    users.map(user=>{
      // console.log(user);
      allUsers.push(user);
    });

    // console.log(allUsers);
    res.json(allUsers);
  });
  
});

// register execersise
app.post('/api/users/:_id/exercises', async (req, res) => {

// console.log(req.params._id);

const queryId = req.params._id;
const queryUser = await Users.findById(queryId);

const newExercise = await new Exercises({
  userId: queryId,
  username: queryUser.username,
  description: req.body.description,
  duration: req.body.duration,
  date: req.body.date || moment(new Date()).format("YYYY-MM-DD")
});

newExercise.save();

// console.log(newExercise);

res.json({
  username: newExercise.username,
  description: newExercise.description,
  duration: newExercise.duration,
  date: new Date(newExercise.date).toDateString(),
  _id: queryId
})

});

// get users exercise log
app.get("/api/users/:_id/logs", async (req, res) => {
  const user = await Users.findById(req.params._id);
  const from = req.query.from;
  const to = req.query.to;;

  let exercises;

  if (req.query.from || req.query.to){

    console.log("Option A");
    exercises = await Exercises.find({
      userId: req.params._id,
      date: {$gte: from , $lte: to}
      })
  }else if (req.query.limit){

    console.log("Option B");
    console.log(req.query.limit);

    exercises = await Exercises.find({
      userId: req.params._id,
      })
    .limit(Number(req.query.limit))
  }else{
    console.log("Option C");
    exercises = await Exercises.find({
      userId: req.params._id,
    })
  }

  // console.log(exercises);

  const userExercises = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: new Date (exercise.date).toDateString()
    }
  });

   console.log(userExercises);

      res.json({
          username: user.username,
          count: userExercises.length,
          _id: req.params._id,
          log: userExercises});
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
