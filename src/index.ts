import express from 'express';
import { Seed } from './models/seedModel';
import { Disable } from './models/disableModel';
import { Review } from './models/reviewModel';
import bodyParser  from 'body-parser';
import cors from 'cors';
import mysql from 'mysql';
import faker from 'faker';
import { Filter } from './models/filterModel';
import { ReviewMovie } from './models/reviewMovieModel';
import { SchemaMigration } from './models/schemaModel';
var movieNames = require('./movienames');
var process = require('dotenv').config();
const app = express();

const port = 3000;
var log : any;
const db = mysql.createConnection({
  host     : process.parsed.DB_HOST,
  port     : process.parsed.DB_PORT,
  user     : process.parsed.DB_USER,
  password : process.parsed.DB_PASSWORD,
  database : process.parsed.DB_NAME
});


let retries = 0;

setTimeout(() => {
    db.connect(async (err: any) => {
      if (err) {
        console.log("Error...", err);
        new Promise(res => setTimeout(res, 5000));
        retries++;
      }
      console.log("Connected!");
    });
  }, 2000)



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.all('/*', (req : any, res : any, next : any) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.post('/seed', (req:any, res:any) => {
  let data : Seed = req.body;
  let schema = data.Seed.schema;
  if(data.Seed.num == undefined){
    res.send("Error deserializing JSON : Missing field num");
  }
    let num = data.Seed.num;
    try{
      let createtb_movies : string = `CREATE TABLE IF NOT EXISTS ${schema}.tb_movies (title varchar(50) NOT NULL,description varchar(1000) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL,PRIMARY KEY(title))`;
      let createtb_reviews : string = `CREATE TABLE IF NOT EXISTS ${schema}.tb_reviews (title varchar(50) NOT NULL,review varchar(1000) NOT NULL, author varchar(100) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL)`;
      console.log(createtb_movies, createtb_reviews);
      db.query(createtb_movies, (error : any, results : any, fields : any) => {
            if(error){
              console.log(error);
              throw error;
            }
            console.log(results, fields);
          });
        db.query(createtb_reviews,(error : any, results : any, fields : any) => {
          if(error){
            console.log(error);
            throw error;
            }
          console.log(results, fields);
        });
    }
    catch(e){
      res.send(e)
      console.log(e);
    }
    try{
      for(let i = 1; i <= num; i++){
        let movieNamesLength = movieNames.GetMovies.length;
        let ran = Math.floor(Math.random() * movieNamesLength);
        let title : string = mysql.escape(movieNames.GetMovies[ran]);
        let author : string = mysql.escape(faker.name.findName());
        let description : string = mysql.escape(faker.lorem.paragraph());
        let published = mysql.escape(faker.date.past());
        let enabled : boolean = true;
        let review : string = mysql.escape(faker.lorem.paragraph());
        console.log(title);
        db.query(`INSERT INTO ${schema}.tb_movies (title, description, published, enabled) VALUES (${title}, ${description}, ${published}, ${enabled})`, (error : any, results: any, fields: any) => {
          if(error) throw error;
        });
        db.query(`INSERT INTO ${schema}.tb_reviews (title, review, author, published, enabled) VALUES (${title}, ${review}, ${author}, ${published}, ${enabled})`, (error : any, results: any, fields : any) => {
          if(error) throw error;
        })
      
      }
    }
    catch(e){
      console.log(e);
      res.send(e);
    }
    res.send("Database seed completed");
});

app.get('/truncate', (req:any, res:any) => {
  try{
    let truncate_movies : string = 'TRUNCATE moviedb.tb_movies';
    let truncate_reviews : string = 'TRUNCATE moviedb.tb_reviews';
    db.query(truncate_movies, (error:any, result:any, fields:any) => {
      if(error) throw error;
    })
    db.query(truncate_reviews, (error:any, result:any, fields:any) => {
      if(error) throw error;
    })
    res.send("Tables truncated");
  }
  catch(e){
    console.log(e);
    res.send("Error deleting data");
  }
});

app.post('/disable-movie', (req: any, res: any) => {
  let data : Disable = req.body;
  let schema = data.Disable.schema;
  if(data.Disable.title == undefined) res.send("Error deserializing JSON");
  let title = mysql.escape(data.Disable.title);
  let checkMovie : string = `SELECT 1 FROM ${schema}.tb_movies WHERE title=${title}`;
  console.log(checkMovie);
  db.query(checkMovie, (error: any, results : any, fields : any) => {
    if(error) {
      console.log("Error performing query");
      throw error;
    }
    if(results.length == 0){
      console.log("Could not find movie with that title");
      res.send("Could not find movie with that title");
    }
    else
    {
    let updateQuery : string = `UPDATE ${schema}.tb_movies SET enabled = 0 WHERE title=${title}`;
    db.query(updateQuery, (error: any, results: any, fields : any) => {
      if(error){
        throw error;
      }
      })
    }
  })
  res.send("Success");
});

app.post('/get-reviews', async (req:any, res: any) => {
  let data : Review = req.body;
  let schema = data.Review.schema;
  if(data.Review.title == undefined) {
    res.send("Error deserializing JSON");
    throw "Error deserializing JSON";
  }
  try{
    let title = mysql.escape(data.Review.title);
    let getReviews : string = `SELECT * FROM ${schema}.tb_reviews WHERE title = ${title}`;
    db.query(getReviews, (error:any, results:any, fields:any) => {
      if(error){
        throw error;
      }
      console.log(results);
      res.send(results);
      log = results;
    });
  }
  catch(e){

  }
});

app.post('/filter-movies', (req, res) => {
  let data : Filter = req.body;
  let schema = data.Filter.schema;
  let result : any;
  if(data.Filter.order == null || data.Filter.orderBy == null){
    res.send("Missing properties");
  }
    if(data.Filter.orderBy == "title" || data.Filter.orderBy == "published"){
      if(data.Filter.amount == undefined || data.Filter.amount == null){
      let orderBy = mysql.escape(data.Filter.orderBy);
      if(data.Filter.order == "asc"){
          let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} DESC`;
          db.query(query, (error : any, results : any, fields : any) => {
            if (error) throw error;
              res.send(results);
            console.log(results);
          })
        }
        else{
          let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} ASC`;
          db.query(query, (error : any, results : any, fields : any) => {
            if (error) throw error;
              res.send(results);
            console.log(results);
          })
        }
     
      }
      else{
        let orderBy = mysql.escape(data.Filter.orderBy);
        let amount = mysql.escape(data.Filter.amount);
        if(data.Filter.order == "asc"){
          let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} ASC LIMIT ${amount}`;
          db.query(query, (error : any, results : any, fields: any) => {
            if(error) throw error;
              res.send(results);
              console.log(results);
          })
        }
        else {
          let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} DESC LIMIT ${amount}`;
          db.query(query, (error : any, results : any, fields: any) => {
            if(error) throw error;
              res.send(results);
            console.log(results);
          })
        }
      }
    }
    if(data.Filter.enabled != null && data.Filter.orderBy == "enabled"){
        if(data.Filter.amount == null){
          let enabled = mysql.escape(data.Filter.enabled);
          let query = `SELECT * FROM ${schema}.tb_movies WHERE enabled = ${enabled}`;
          db.query(query, (error : any, results : any, fields : any) => {
            if (error) throw error;
              res.send(results);
            console.log(results);
          })
        }
        else {
          let enabled = mysql.escape(data.Filter.enabled);
          let amount = mysql.escape(data.Filter.amount);
          let query = `SELECT * FROM ${schema}.tb_movies WHERE enabled = ${enabled} LIMIT ${amount}`;
          db.query(query, (error : any, results : any, fields : any) => {
            if (error) throw error;
            res.send(results);
            console.log(results);
          })
        }
      }
})

app.post('/review-movie', (req, res) => {
  let data : ReviewMovie = req.body;
  let schema = data.ReviewMovie.schema;
  if(data.ReviewMovie.title == undefined || data.ReviewMovie.review == undefined || data.ReviewMovie.author == undefined){
    res.send("Missing one field");
  }
  let title = mysql.escape(data.ReviewMovie.title);
  let query = `SELECT * FROM ${schema}.tb_movies WHERE title = ${title}`;
  db.query(query, (error:any, results:any, fields:any) => {
    if(error) throw error;
    if(results.length == 0) res.send("Cannot find movie for this title");
    let author = mysql.escape(data.ReviewMovie.author);
    let review = mysql.escape(data.ReviewMovie.review);
    let published = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    console.log(published);
    let enabled = 1;
    let update = `INSERT INTO ${schema}.tb_reviews (title, review, author, published, enabled) VALUES (${title}, ${review}, ${author}, '${published}', ${enabled})`;
    db.query(update, (error:any, results:any, fields: any) => {
      if(error) throw error;
      res.send("Review Inserted successfully: " + results);
    });
  })
})

app.post('/schema-migration', (req, res) => {
  let data : SchemaMigration = req.body;
  if(data.Schema.newschema == undefined || data.Schema.oldschema == undefined) return res.send("Missing field");
  let schema = data.Schema.newschema;
  let oldschema = data.Schema.oldschema;
  let migrate = `CREATE SCHEMA ${schema}`;
  db.query(migrate, (error : any ,results : any, fields: any) => {
    if(error) throw error;
  })
  let createTables0 = `CREATE TABLE IF NOT EXISTS ${schema}.tb_movies (title varchar(50) NOT NULL,description varchar(1000) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL,PRIMARY KEY(title))`
  db.query(createTables0, (error : any, results: any, fields: any) => {
    if(error) throw error;
  })
  let createTables1 = `CREATE TABLE IF NOT EXISTS ${schema}.tb_reviews (title varchar(50) NOT NULL,review varchar(1000) NOT NULL, author varchar(100) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL)`
  db.query(createTables1, (error: any, results : any, fields : any) => {
    if(error) throw error;
  })
  let insertValues0 = `INSERT INTO ${schema}.tb_movies SELECT * FROM ${oldschema}.tb_movies`;
  db.query(insertValues0, (error : any, results : any, fields : any) => {
    if(error) throw error;
  })
  let insertValues1 = `INSERT INTO ${schema}.tb_reviews SELECT * FROM ${oldschema}.tb_reviews`;
  db.query(insertValues1, (error : any, results : any, fields : any) => {
    if(error) throw error;
  })
  res.send("Database migration succeeded");
})
app.listen(port, "", () => {
    console.log(`Listening on port ${port}`);
});
