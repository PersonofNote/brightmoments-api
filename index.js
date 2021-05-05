const express = require('express')
const cors = require('cors')
//const { pool } = require('./config')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const {body, check, validationResult} = require('express-validator')

const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://127.0.0.1:27017'
const dbName = 'brightmoments-db'
let db



const app = express()
const PORT = process.env.PORT || 3000;


const origin = {
    'http://0f9d037097c6.ngrok.io' : '*',
}



const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 5 requests,
  })

  // Limit posting comments to 1 request/minute
const postLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20
  })
 

//app.use(cors(origin))
app.use(compression())
app.use(helmet())
app.use(limiter)
app.use(cors())
MongoClient.connect(url, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database')
    const db = client.db('brightmoments-db')
    const venice = db.collection('venice')

    /** FUNCTIONS **/
    const getGlobalScreens = (request, response) => {
        console.log(request)
        response.json({ status: 200, message: `All screens in the world` })
    }

    const getLocalScreens = (request, response) => {
        console.log(request.params)
        const location = request.params.location
        const screensCollection = db.collection('venice').find().toArray()
            .then(results => {
                console.log(results)
                response.json({ status: 200, message:` screens for ${location}: ${results} `})
            })
            .catch(error => {
                console.error(error) 
                response.json({ status: 400, message:` ${error} `})
            })
    }

    const getScreen = (request, response) => {
        console.log(request.params)
        response.status(200).json({ status: 200, message: `Get a screen` })
    }

    const pushScreen = (request, response) => {
        console.log(request)
        response.status(200).json({ status: 200, message: `POSTed` })
    }


/** ENDPOINTS **/
    app.get('/', (request, response) => {
        response.json({ info: 'Hello, world' })
        })
    app.get('/screens', getGlobalScreens)
    app.get('/screens/:location', getLocalScreens)
    app.get('/screens/:location/:id', getScreen)
    app.post('/screens/:location/:id', pushScreen)

    // Handles any requests that don't match the ones above
    app.get('*', (req,res) =>{
        res.status(404).json({status: 404, message: "There's nothing here"});
    });
  })
  .catch(error => console.error(error))


   

app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
})