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

app.use(bodyParser.urlencoded());

app.use(bodyParser.json());

const getGlobalScreens = (request, response) => {
    console.log(request)
    response.json({ status: 200, message: `All screens in the world` })
}

const getLocalScreens = (request, response) => {
    /**** SCREEN IDs for THURSDAY ARE ****
    a4fc611ae
    a4fc6165e
    a4fc61744
    a4fc6180c */
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
    target_table = request.params.id
    console.log(target_table)
    
    pool.query(`SELECT * FROM ${target_table}`, (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).json(results.rows)
      })
    
}

const pushScreen = (request, response) => {
    console.log("🚨🚨🚨🚨🚨🚨🚨🚨")
    console.log("SOMETHING WAS JUST PUSHED")
    // TRUNCATE target table
    // INSERT new
    url = request.path
    console.log(request.params.id)
    target_table = request.params.id
    console.log(request.body)
    const { address, token, img_url, asset_url } = request.body
    console.log(`Address = ${address}`)
    // Make sure there's only ever one entry
    pool.query(`TRUNCATE ${target_table}`)
    pool.query(`INSERT INTO ${target_table} (address, token, img_url, asset_url) VALUES ($1, $2, $3, $4)`, [address, token, img_url, asset_url], (error, results) => {
        if (error) {
          throw error
        }
        response.status(201).send(`Inserted into ${target_table}: ${results}`)
      })
      
}

app.get('/', (request, response) => {
    response.json({ info: 'Hello, world' })
})
app.get('/screens', getGlobalScreens)
app.post('/screens', pushScreen)
app.get('/screens/:location', getLocalScreens)
app.post('screens/:location', pushScreen)
app.get('/screens/:location/:id', getScreen)
app.post('/screens/:location/:id', pushScreen)

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.status(404).json({status: 404, message: "There's nothing here"});
});

app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});