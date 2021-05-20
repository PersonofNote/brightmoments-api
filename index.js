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
const webSocketsServerPort = 1337

const webSocketServer = require('websocket').server
const http = require('http')
//Spin up servers
const server = http.createServer()
server.listen(webSocketsServerPort)
const wsServer = new webSocketServer({
  httpServer: server
})

/* WEBSOCKET DATA TRANSFER SCHEMA 
* CLIENT sends: list of screens
* SERVER takes list of screens and for-each pushes the current NFT
* This way the client doesn't have to keep track of order, and all scheduling will be client-side
*/

let count_test = 0

const clients = {}

nft_json_test = {"address" : "0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0",
"token" : "24210",
"img_url": "https://ipfs.pixura.io/ipfs/QmNcvXCUu4zoc3GrJdANdTyZhwo4M43g6vkxEYtHdBR8xx/NFT.gif",
"asset_url" : "https://ipfs.pixura.io/ipfs/QmNULY28ZmvTRZgxMWFka8cZqRMU5oUy4ECs84DfTF4Eab/NFT_50mb.mp4"
},

wsServer.on('request', function(request){
  console.log(`New request from ${request.origin}`)
  const connection = request.accept(null, request.origin)
  clients[0] = connection
  console.log(`Connected: ${Object.getOwnPropertyNames(clients)}`)
  clients[0].send(JSON.stringify(count_test))
})

wsServer.on('close', function(connection) {
  console.log((new Date()) + " Peer " + clients[0] + " disconnected.");
  delete clients[0];

});

const initial_json = require('./initial-nfts')

const launch_json = require('./alpha_launch.json')

const screens = launch_json.screens
const launch_nfts = launch_json.nfts

// TEMPORARY
let nft_json = {}

let now_showing = {}


function create_launch_list(input){
  launch_list = []
  for (let i = 0; i < 5; i++){
    token = input.nfts[i].token
    address = input.nfts[i].address
    fetch(`https://api.opensea.io/api/v1/assets?token_ids=${token}&asset_contract_address=${address}`, {
      headers: {
        "X-API-KEY": "04925cb4fa954de899c17562c18e972f"
      }
    })
    .then(res => res.json())
    .then(response => {
      console.log(response.assets[0])
      launch_list.push(response.assets[0])
    })
    .catch(console.log("ERROR in api"))
  }
  return launch_list
}


let token_list = []

let on_demand_list = { }


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


// Graceful error handling
function make_site_json(input){

  console.log(input)
  for (r in input){
    a = input[r]
    console.log(a)
    if (a == undefined){
      nft_json[r] = {
        "name" : "This item could not be displayed",
        "description": "",
        "image_url" : "",
        "opensea_link": "",
        "token": "",
        "address": "",
        "asset_url": ""
      }
    }else{    
      nft_json[r] = {
        "name" : a.name == null || a.name == undefined ? "Not found" : a.name,
        "description": a.description == null || a.description == undefined ? "Not found" : a.description,
        "image_url" : a.image_url == null || a.image_url == undefined || a.image_url.length <= 0 ? "Not found" : a.image_url,
        "opensea_link": a.permalink == null || a.permalink == undefined ? "Not found" : a.permalink,
        "creator_name": a.creator == null || a.creator == undefined ? "Not found" : (a.creator.user == null ? "Not found" : a.creator.user.username),
        "token": a.token == null || a.token == undefined ? "No token" : a.token,
        "address": a.address == null || a.address == undefined ? "Address not found" : a.address
      }
    }
  }
  console.log(nft_json)
  return nft_json
}

//make_token_list(initial_json)
//const query_string = token_list.join("&")
make_site_json(launch_nfts)

  
const app = express()
const PORT = process.env.PORT || 3000;


  const origin = {
      '*' : '*',
  }

  //Temp
  let rotation_position = {
    "a4fc611ae": 0,
    "a4fc6165e": 5,
    "a4fc61744": 15
  }


//console.log(nft_json)



//get_assets(token_list, API_PATH)


async function process_input(input) {
  console.log(input)
  const launch_list = await create_launch_list(input)
  console.log(launch_list)
  const nft_json = make_site_json(launch_list)
  console.log(nft_json)
}




  function populate_db(json){
    for (let i = 0; i < json.length; i++) {
      console.log(json[i])
    }
  }

let onDemandNft = {
  message: "Waiting for input"
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
    const allowed_endpoints = ["a4fc611ae", "a4fc6165e","a4fc61744", "a4fc6180c"]
    console.log("GET REQUEST:")
    console.log(request.body)
    target_table = request.params.id
    console.log(rotation_position[target_table])
    const num = rotation_position[target_table]
    // UPDATE to opensea json
    const screen_nft = nft_json[num]
    // Update to conditional; if origin is brightmoments.com, give the full thing
    if (target_table){
      if (target_table == "a4fc6180c"){
        response.status(200).json(onDemandNft)
        console.log(onDemandNft.image_url)
        console.log("SUCCESSFUL GET")
      }else {
        response.status(200).json(screen_nft)
        console.log(screen_nft)
      }

      
      /*
      // TEST THIS
      if (target_table == "a4fc6180c"){
        fetch(`https://api.opensea.io/api/v1/assets?token_ids=${query_string}`)
        .then(res => res.json())
        .then(response.status(200).json(res))
      }else{
        response.status(200).json(screen_nft)

      }
      */
    }
    
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
    if (target_table == "a4fc6180c"){
      onDemandNft = request.body.assets[0]
      console.log(onDemandNft)
    }
    else{
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
}

const pushOnDemand = (request, response) => {
  target_table = request.params.id
  console.log("🚨🚨🚨🚨🚨🚨🚨🚨")
  console.log(`Incoming PUSH to ONDEMAND ENDPOINT: ${target_table}`)
  const allowed_endpoints = ["a4fc6180c"]
  const { address, token, img_url, asset_url } = request.body
  console.log(address)
  if (allowed_endpoints.includes(target_table)){
    onDemandNft = request.body
    console.log(onDemandNft.assets[0])
    // Make sure there's only ever one entry
    /*
    pool.query(`TRUNCATE ${target_table}`)
    pool.query(`INSERT INTO ${target_table} (address, token, img_url, asset_url) VALUES ($1, $2, $3, $4)`, [address, token, img_url, asset_url], (error, results) => {
        if (error) {
          throw error
        }
        response.status(201).text("Your NFT is onDemand. Please refresh the display!")
      })
    */
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
  //app.post('/screens/venice/a4fc6180c', pushOnDemand)
  // Update to have a page for each :location
  app.post('/on-demand', authenticate)

  // Handles any requests that don't match the ones above
  app.get('*', (req,res) =>{
      res.status(404).json({status: 404, message: "There's nothing here"});
  });

  // Every two minutes, loop through the endpoints position array and increment the position
  // Send an array of objects with the schema "screen_id" : "data[num]" collected from the json file.
  cron.schedule("*/10 * * * * *", () => {
    console.log("Updating...")
    // For each in screens, screens[screen], json[rotation_position]['screen']
    console.log(screens)
    console.log(rotation_position)
    for (const num in rotation_position) {
      
      console.log(rotation_position[num])
      //console.log(`${num}: ${rotation_position[num]}`);
      rotation_position[num]++
      // TODO: Update to dynamically accept schedule
      if (rotation_position[num] > 30){
        rotation_position[num] = 0
      }
      console.log("Specific JSON")
      console.log(nft_json[rotation_position[num]])
      now_showing[num] = nft_json[rotation_position[num]]
    }
    console.log("Now showing object")
    console.log(now_showing)
    //console.log("Screen Updating...")
    //console.log(nft_json[test])
    clients[0].send(JSON.stringify(now_showing))
  });

  app.listen(PORT, () => {
    //const launch_list = process_input(launch_json)
    console.log(`Our app is running on port ${ PORT }`);
  });
