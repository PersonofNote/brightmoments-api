const cron = require('node-cron')
const express = require('express')
const cors = require('cors')
const { pool } = require('./config')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const {body, check, validationResult} = require('express-validator')
const bodyParser = require('body-parser')
const fetch = require('node-fetch');

const initial_json = require('./initial-nfts')

let token_list = []


/* HELPER/PROCESSING FUNCTIONS */
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function make_token_list(input_list){
  /* For each bit of json, check if the token field is a valid number. If so, add it to the list */
  for (const i in input_list) {
    if (isNumeric(Number(input_list[i].token))){
      token_list.push(input_list[i].token)
    }else{
      console.log("Bad input")
    }
  }
}

make_token_list(initial_json)
const query_string = token_list.join("&")

fetch(`https://api.opensea.io/api/v1/assets?token_ids=${query_string}`)
.then(res => res.json())
.then(response => {
  
  const app = express()
  const PORT = process.env.PORT || 3000;


  const origin = {
      '*' : '*',
  }

  let rotation_position = {
    "a4fc611ae": 0,
    "a4fc6165e": 5,
    "a4fc61744": 15
  }
  let nft_json = {}
  //console.log(response)
  for (r in response.assets){
    a = response.assets[r]
    //console.log(r)
    //console.log(a)
    if (a == undefined){
      nft_json[r] = {
        "name" : "This item could not be displayed",
        "description": "",
        "image_url" : "",
        "opensea_link": ""
      }
    }else{    
      console.log(a.creator == null ? "Null" : (a.creator.user == null ? "Null" : a.creator.user.username))
      nft_json[r] = {
        "name" : a.name == null || a.name == undefined ? "Not found" : a.name,
        "description": a.description == null || a.description == undefined ? "Not found" : a.description,
        "image_url" : a.image_url == null || a.image_url == undefined || a.image_url.length <= 0 ? "Not found" : a.image_url,
        "opensea_link": a.permalink == null || a.permalink == undefined ? "Not found" : a.permalink,
        "creator_name": a.creator == null || a.creator == undefined ? "Not found" : (a.creator.user == null ? "Not found" : a.creator.user.username)
      }
  }
  }
  //console.log(nft_json)



//get_assets(token_list, API_PATH)



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

const authenticate = (request,  response ) => {
  const password = "egl!RkhC%GMf"
  console.log(request.body)
}

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
    console.log("GET REQUEST:")
    console.log(request.body)
    target_table = request.params.id
    console.log(rotation_position[target_table])
    const num = rotation_position[target_table]
    // UPDATE to opensea json
    const screen_nft = nft_json[num]
    console.log(initial_json[num])
    // Update to conditional; if origin is brightmoments.com, give the full thing
    response.status(200).json(screen_nft)
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

/* APP ENDPOINT FUNCTIONS */
  app.get('/', (request, response) => {
      response.json({ info: 'Hello, world' })
  })
  app.get('/screens', getGlobalScreens)
  app.post('/screens', pushScreen)
  app.get('/screens/:location', getLocalScreens)
  app.post('screens/:location', pushScreen)
  app.get('/screens/:location/:id', getScreen)
  app.post('/screens/:location/:id', pushScreen)
  // Update to have a page for each :location
  app.post('/on-demand', authenticate)

  // Handles any requests that don't match the ones above
  app.get('*', (req,res) =>{
      res.status(404).json({status: 404, message: "There's nothing here"});
  });

  // Every two minutes, loop through the endpoints position array and increment the position
  cron.schedule("* * * * *", () => {
    let test = rotation_position['a4fc611ae']
    for (const num in rotation_position) {
      //console.log(`${num}: ${rotation_position[num]}`);
      rotation_position[num]++
      // TODO: Update to dynamically accept schedule
      if (rotation_position[num] > 30){
        rotation_position[num] = 0
      }
    }
    console.log("Screen Updating...")
    console.log(nft_json[test])
  });

  app.listen(PORT, () => {
      console.log(`Our app is running on port ${ PORT }`);
  });

})