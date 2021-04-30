# Project Title

API for Brightmoments.io

## Built With
Express
Postgrsql or MariaDB


## Authors

* **Jessica Martin** - *Developer, API designer* - [PersonofNote](https://github.com/PersonofNote)


## Devlog

### 4/26/21

#### DONE 
* Set up project and dependencies
* Create endpoints for global screens, location collections of screens, individual screens
* Test with Postman

#### TODO NEXT
* Decide on MariaDB vs Postgres
* Design and set up db schema
* Coordinate with Stan to receive Pi pushes
* Secure endpoints


### POST SCHEMA
{
    “ScreenId” : String,
    “AdvertiseTo” : URL
    “ExhibitionName” : String,
    “DisplayNFTs” : [
        {
               “NFT” : String,
               “AssetUrl” : URL
        } 
    ],
    “DisplayOrder” : [
       {
            “MinimumDisplayDurationInSeconds” : Int,
            “NFT” : String
        },
       {
            “MinimumDisplayDurationInSeconds” : Int,
            “NFT” : String
        }
    ]
}

Notes on post schema: Is the minimum display duration locked?
