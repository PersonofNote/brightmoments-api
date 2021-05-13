const cron = require('node-cron')
const express = require('express')
const cors = require('cors')
const { pool } = require('./config')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const {body, check, validationResult} = require('express-validator')
const bodyParser = require('body-parser')

const nft_json = require('./initial-nfts')


const app = express()
const PORT = process.env.PORT || 3000;


const origin = {
    '*' : '*',
}

let currently_showing = 0;

let rotation_position = {
  "a4fc611ae": 0,
  "a4fc6165e": 5,
  "a4fc61744": 15
}

function populate_db(json){
  for (let i = 0; i < json.length; i++) {
    console.log(json[i])
  }
}


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // num requests
    message: "Too many requests, please try again later"
  })

  // Limit posting comments to 1 request/minute
const postLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,

  })
 

app.use(cors(origin))
app.use(compression())
app.use(helmet())
app.use(limiter)

app.use(bodyParser.urlencoded());

app.use(bodyParser.json());

const getGlobalScreens = (request, response) => {
    console.log(request.body)
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
    console.log(rotation_position[target_table])
    const num = rotation_position[target_table]
    const nft = nft_json[num]
    console.log(nft_json[num])
    response.status(200).json(nft)
    /*
    pool.query(`SELECT * FROM ${target_table}`, (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).json(results.rows)
      })
  */
}

const pushScreen = (request, response) => {
    target_table = request.params.id
    console.log("🚨🚨🚨🚨🚨🚨🚨🚨")
    console.log(`Incoming PUSH to ${target_table}`)
    const allowed_endpoints = ["a4fc611ae", "a4fc6165e","a4fc61744", "a4fc6180c"]
    const { address, token, img_url, asset_url } = request.body
    console.log(`URL: ${img_url}`)
    console.log(`token: ${token}`)
    if (allowed_endpoints.includes(target_table)){
      // Make sure there's only ever one entry
      pool.query(`TRUNCATE ${target_table}`)
      pool.query(`INSERT INTO ${target_table} (address, token, img_url, asset_url) VALUES ($1, $2, $3, $4)`, [address, token, img_url, asset_url], (error, results) => {
          if (error) {
            throw error
          }
          response.status(201).send(`Inserted into ${target_table}: ${results}`)
        })
    }else{
      response.status(111).send(`Cannot POST`)
    }
      
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

// Every two minutes, loop through the endpoints position array and increment the position
cron.schedule("*/2 * * * *", () => {
  let test = rotation_position['a4fc611ae']
  for (const num in rotation_position) {
    console.log(`${num}: ${rotation_position[num]}`);
    rotation_position[num]++
    if (num > 41){
      num = 0
    }
  }
  console.log(nft_json[test])
});

app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});