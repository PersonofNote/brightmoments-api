/**
 * 
 * This file is deprecated. I am keeping it in case we do decide to come back to using our own database
 * but the vote is to use Notion as much as possible as a CMS/database solution
 * 
 */

require('dotenv').config()

const {Pool} = require('pg')
const isProduction = process.env.NODE_ENV === 'production'

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: { rejectUnauthorized: false },
})

module.exports = {pool}