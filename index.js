const express = require('express')
const cors = require('cors')
const { pool } = require('./config')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const {body, check, validationResult} = require('express-validator')
const bodyParser = require('body-parser')
const app = express()
const PORT = process.env.PORT || 3000;


const origin = {
    '*' : '*',
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
 

app.use(cors(origin))
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

app.use(bodyParser.urlencoded());

app.use(bodyParser.json());

const getGlobalScreens = (request, response) => {
    console.log(request)
    response.json({ status: 200, message: `All screens in the world` })
}

const getLocalScreens = (request, response) => {
    /**** SCREEN IDs for THURSDAY ARE ****
    4fc611ae
    4fc6165e
    4fc61744
    4fc6180c */
    console.log(request.body)
    response.json({ status: 200, message: `All screens for a location` })
    /*
    pool.query('SELECT * FROM temp_screens', (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).json(results.rows)
      })
      */
}


const getScreen = (request, response) => {
    console.log(request.body)
    response.status(200).json({ status: 200, message: `Get a screen` })
}

const pushScreen = (request, response) => {
    console.log("🚨🚨🚨🚨🚨🚨🚨🚨")
    console.log("SOMETHING WAS JUST PUSHED")
    // IF EXISTS With screen ID,  DROP with screen ID
    // Create new with screen ID
    console.log(request.body)
    response.status(200).json({ status: 200, message: request.body })
}

const pushScreensTemp = (request, response) => {
    console.log("🚨🚨🚨🚨🚨🚨🚨🚨")
    console.log("SOMETHING WAS JUST PUSHED")
    // IF EXISTS With screen ID,  DROP with screen ID
    // Create new with screen ID
    console.log(request.body)
    response.status(200).json({ status: 200, message: request.body })
}

app.get('/', (request, response) => {
    response.json({ info: 'Hello, world' })
})
app.get('/screens', pushScreen)
app.get('/screens/:location', getLocalScreens)
app.post('screens/:location', pushScreensTemp)
app.get('/screens/:location/:id', getScreen)
app.post('/screens/:location/:id', pushScreen)

   

app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
})