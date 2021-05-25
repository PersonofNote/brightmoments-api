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
const webSocketsServerPort = process.env.WEBSOCKET || 443

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


const clients = {}

const schedule_list = { }

wsServer.on('request', function(request){
  console.log(`New request from ${request.origin}`)
  const connection = request.accept(null, request.origin)
  clients[0] = connection
  console.log(`Connected: ${Object.getOwnPropertyNames(clients)}`)
  clients[0].send(JSON.stringify(now_showing))
})

wsServer.on('close', function(connection) {
  console.log((new Date()) + " Peer " + clients[0] + " disconnected.");
  delete clients[0];

});

const initial_json = require('./initial-nfts')

const launch_json = require('./alpha_launch.json')

const json_screen2 = require('./sample_alpha_json.json')

const screens = launch_json.screens
const launch_nfts = launch_json.nfts
const launch_nfts_2 = json_screen2.nfts


let now_showing = {}


/*
function make_schedule(input){
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
*/

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
  let nft_json = {}
  for (r in input){
    a = input[r]
    if (a == undefined){
      nft_json[r] = {
        "name" : "This item could not be displayed",
        "description": "",
        "original_image_url" : "",
        "external_url": "",
        "token_id": "",
        "contract_address": "",
        "asset_url": "",
        "creator": "",
        "original_asset_url": ""
      }
    }else{    
      nft_json[r] = {
        // TODO: Fix this discrepancy
        "title" : a.title == null || a.title == undefined ? "Title Unknown" : a.title,
        "description": a.description == null || a.description == undefined ? "Not found" : a.description,
        "original_image_url" : a.original_image_url == null || a.original_image_url == undefined || a.original_image_url.length <= 0 ? "Not found" : a.original_image_url,
        "original_asset_url": a.original_asset_url == null || a.original_asset_url == undefined ? "" : a.original_asset_url,
        "external_url": a.external_url == null || a.external_url == undefined ? "Not found" : a.external_url,
        "creator": a.creator == null || a.creator == undefined ? "Creator Unknown" : a.creator,
        "token_id": a.token_id == null || a.token_id == undefined ? "No token" : a.token_id,
        "contract_address": a.contract_address == null || a.contract_address == undefined ? "Address not found" : a.contract_address
      }
    }
  }
  return nft_json
}

//make_token_list(initial_json)
//const query_string = token_list.join("&")
const json_1 = make_site_json(launch_nfts)
const json_2 = make_site_json(launch_nfts_2)


let master_list = {
  "a4fc611ae": json_1,
  "a4fc6165e": json_2,
  "a4fc61744": json_1
}

console.log("MASTER LIST:")
console.log(master_list)


let now_showing_list = {}

/*
for (screen in screens){
  if (screens[screen] == "a4fc6165e"){
    master_list[screens[screen]] = json_2
    console.log(json_screen2.nfts)
  }
  master_list[screens[screen]] = json_1
  
}
*/

  
const app = express()
const PORT = process.env.PORT || 3000;


  const origin = {
      '*' : '*',
  }



//console.log(nft_json)



//get_assets(token_list, API_PATH)


async function process_input(input) {
  console.log(input)
  const launch_list = await make_schedule(input)
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
    const screen_nft = now_showing_list[target_table]
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
    //const { contract_address, token_id, original_image_url, title, creator, external_url } = request.body
    // On-demand exception
    console.log(request.body)
    if (target_table == "a4fc6180c"){
      onDemandNft = request.body.assets[0]
    }
    else{
      if (allowed_endpoints.includes(target_table)){
        console.log(JSON.stringify(request.body))
        // TODO: Make sure that the make_site_json is part of this
        const new_schedule = make_site_json(request.body.nfts)
        console.log("NEW")
        console.log(new_schedule)
        master_list[target_table] = new_schedule
        console.log(`NEW SCHEDULE ADDED TO SCREEN ${target_table} `)
        console.log(master_list)
        response.status(200).send('Schedule updated')
        // Make sure there's only ever one entry
        /*
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
        */
      }else{
        response.status(503).send(`Get out of here`)
      }
    }
  }

/*
const pushNewJson = (request, response) => {
  console.log(response)
  const { address, token, img_url, asset_url,  } = request.body
}
*/
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
  app.post('/', )

  // Handles any requests that don't match the ones above
  app.get('*', (req,res) =>{
      res.status(404).json({status: 404, message: "There's nothing here"});
  });

    //TODO: remove hardcoding
    // For each screen, assign a starting position of 0
    let rotation_position = {
      "a4fc611ae": 0,
      "a4fc6165e": 0,
      "a4fc61744": 0
    }
  

  // TODO: Make screen-specific indices by looping through screen list.
  // Every two minutes, loop through the endpoints position array and increment the position
  // Send an array of objects with the schema "screen_id" : "data[num]" collected from the json file.
  cron.schedule("*/10 * * * * *", () => {
    for (obj in master_list){
      now_showing = master_list[obj][rotation_position[obj]]
      now_showing_list[obj] = now_showing
      rotation_position[obj]++
      if(rotation_position[obj]>Object.keys(master_list[obj]).length-1){
        rotation_position[obj] = 0
      }

    }
    clients[0].send(JSON.stringify(now_showing_list))
    
  });

  app.listen(PORT, () => {
    //const launch_list = process_input(launch_json)
    console.log(`Our app is running on port ${ PORT }`);
  });
