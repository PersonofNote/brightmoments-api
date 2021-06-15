// TOOD: Implement JSON schema validator
const cron = require('node-cron')
const express = require('express')
const cors = require('cors')
// const { pool } = require('./db/config')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
const webSocketsServerPort = process.env.WEBSOCKET || 3000

const webSocketServer = require('websocket').server
const http = require('http')
const server = http.createServer()

server.listen(webSocketsServerPort)
const wsServer = new webSocketServer({
  httpServer: server
})

const app = express()
const PORT = process.env.PORT || 1236;

const clients = {}

const schedule_list = { }

wsServer.on('request', function(request){
  console.log(`New request from ${request.origin}`)
  const connection = request.accept(null, request.origin)
  // TODO: Implement a unique ID assignment; this is a really quick and dirty implementation
  clients[0] = connection
  console.log(`Connected: ${Object.getOwnPropertyNames(clients)}`)
  clients[0].send(JSON.stringify(now_showing))
})

wsServer.on('close', function(connection) {
  console.log((new Date()) + " Peer " + clients[0] + " disconnected.");
  delete clients[0];

});

// TEMPORARY hard-coded JSON from Scott
const initial_json = require('./assets/initial-nfts')
const launch_json = require('./assets/alpha_launch.json')
const launch_nfts = launch_json.nfts
const json_screen2 = require('./assets/sample_alpha_json.json')
const launch_nfts_2 = json_screen2.nfts

const screens = launch_json.screens




let now_showing = {}


// NEED valid IP address from gallery for security on POSTS! Currently it's all security through obscurity
const origin = {
      '*' : '*',
  }


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


// Error handling and accomodating missing fields
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
        "original_asset_url": "",
        "zoom": ""
      }
    }else{    
      nft_json[r] = {
        "title" : a.title == null || a.title == undefined ? "Title Unknown" : a.title,
        "description": a.description == null || a.description == undefined ? "Not found" : a.description,
        "original_image_url" : a.original_image_url == null || a.original_image_url == undefined || a.original_image_url.length <= 0 ? "Not found" : a.original_image_url,
        "original_asset_url": a.original_asset_url == null || a.original_asset_url == undefined ? "" : a.original_asset_url,
        "external_url": a.external_url == null || a.external_url == undefined ? "Not found" : a.external_url,
        "creator": a.creator == null || a.creator == undefined ? "Creator Unknown" : a.creator,
        "token_id": a.token_id == null || a.token_id == undefined ? "No token" : a.token_id,
        "contract_address": a.contract_address == null || a.contract_address == undefined ? "Address not found" : a.contract_address,
        "zoom": a.zoom == null || a.zoom == undefined ? " " : a.zoom
      }
    }
  }
  return nft_json
}

// TODO: Update to use Notion as DB
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


//console.log(nft_json)

//get_assets(token_list, API_PATH)


async function process_input(input) {
  console.log(input)
  const launch_list = await make_schedule(input)
  console.log(launch_list)
  const nft_json = make_site_json(launch_list)
  console.log(nft_json)
}


let onDemandNft = {
  message: "Waiting for input"
}

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 15, // num requests
    message: "Too many requests, please try again later"
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
    pool.query('SELECT * FROM screens', (error, results) => {
        if (error) {
          throw error
        }
        response.status(200).json(results.rows)
      })
      */
}


const getScreen = (request, response) => {
  target_table = request.params.id
  console.log(rotation_position[target_table])
  const num = rotation_position[target_table]
  // UPDATE to opensea json
  const screen_nft = now_showing_list[target_table]
  // Update to conditional; if origin is brightmoments.com, give the full thing
  if (target_table){
    // *****TEMPORARY hacky solution for gallery opening*******
    if (target_table == "a4fc6180c"){
      response.status(200).json(onDemandNft)
    }else {
      response.status(200).json(screen_nft)
    }
  }
}

const pushScreen = (request, response) => {
    target_table = request.params.id
    console.log("🚨🚨🚨🚨🚨🚨🚨🚨")
    console.log(`Incoming PUSH to ${target_table}`)
    const allowed_endpoints = ["a4fc611ae", "a4fc6165e","a4fc61744", "a4fc6180c"]
    // On-demand exception
    if (target_table == "a4fc6180c"){
      onDemandNft = request.body.assets[0]
    }
    else{
      if (allowed_endpoints.includes(target_table)){
        const new_schedule = make_site_json(request.body.nfts)
        master_list[target_table] = new_schedule
        rotation_position[target_table] = 0
        console.log(`NEW SCHEDULE ADDED TO SCREEN ${target_table} `)
        response.status(200).send('Schedule updated')
      }else{
        response.status(503).send('Forbidden')
      }
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
  // TEMPORARY for gallery opening
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
  cron.schedule("*/2 * * * *", () => {
    console.log("Updating...")
    for (obj in master_list){
      now_showing = master_list[obj][rotation_position[obj]]
      now_showing_list[obj] = now_showing
      rotation_position[obj]++
      if(rotation_position[obj]>Object.keys(master_list[obj]).length-1){
        rotation_position[obj] = 0
      }
    }
    console.log(now_showing_list)
    clients[0].send(JSON.stringify(now_showing_list))
    
  });

  app.listen(PORT, () => {
    //const launch_list = process_input(launch_json)
    console.log(`Our app is running on port ${ PORT }`);
  });
