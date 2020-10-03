"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const mysql_1 = __importDefault(require("mysql"));
const faker_1 = __importDefault(require("faker"));
var movieNames = require('./movienames');
var process = require('dotenv').config();
const app = express_1.default();
const port = 3000;
var log;
const db = mysql_1.default.createConnection({
    host: process.parsed.DB_HOST,
    port: process.parsed.DB_PORT,
    user: process.parsed.DB_USER,
    password: process.parsed.DB_PASSWORD,
    database: process.parsed.DB_NAME
});
db.connect(function (err) {
    if (err)
        throw err;
    console.log("Connected!");
});
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use(cors_1.default());
app.all('/*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.post('/seed', (req, res) => {
    let data = req.body;
    let schema = data.Seed.schema;
    if (data.Seed.num == undefined) {
        res.send("Error deserializing JSON : Missing field num");
    }
    let num = data.Seed.num;
    try {
        let createtb_movies = `CREATE TABLE IF NOT EXISTS ${schema}.tb_movies (title varchar(50) NOT NULL,description varchar(1000) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL,PRIMARY KEY(title))`;
        let createtb_reviews = `CREATE TABLE IF NOT EXISTS ${schema}.tb_reviews (title varchar(50) NOT NULL,review varchar(1000) NOT NULL, author varchar(100) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL)`;
        db.query(createtb_movies, (error, results, fields) => {
            if (error) {
                console.log(error);
                res.send(error);
                throw error;
            }
            console.log(results, fields);
        });
        db.query(createtb_reviews, (error, results, fields) => {
            if (error) {
                console.log(error);
                res.send(error);
                throw error;
            }
            console.log(results, fields);
        });
    }
    catch (e) {
        res.send(e);
        console.log(e);
    }
    try {
        for (let i = 1; i <= num; i++) {
            console.log(movieNames.GetMovies);
            let movieNamesLength = movieNames.GetMovies.length;
            let ran = Math.floor(Math.random() * movieNamesLength);
            let title = mysql_1.default.escape(movieNames.GetMovies[ran]);
            let author = mysql_1.default.escape(faker_1.default.name.findName());
            let description = mysql_1.default.escape(faker_1.default.lorem.paragraph());
            let published = mysql_1.default.escape(faker_1.default.date.past());
            let enabled = true;
            let review = mysql_1.default.escape(faker_1.default.lorem.paragraph());
            console.log(title);
            db.query(`INSERT INTO ${schema}.tb_movies (title, description, published, enabled) VALUES (${title}, ${description}, ${published}, ${enabled})`, (error, results, fields) => {
                if (error)
                    throw error;
            });
            db.query(`INSERT INTO ${schema}.tb_reviews (title, review, author, published, enabled) VALUES (${title}, ${review}, ${author}, ${published}, ${enabled})`, (error, results, fields) => {
                if (error)
                    throw error;
            });
        }
    }
    catch (e) {
        console.log(e);
        res.send(e);
    }
    res.send("Database seed completed");
});
app.get('/truncate', (req, res) => {
    try {
        let truncate_movies = 'TRUNCATE moviedb.tb_movies';
        let truncate_reviews = 'TRUNCATE moviedb.tb_reviews';
        db.query(truncate_movies, (error, result, fields) => {
            if (error)
                throw error;
        });
        db.query(truncate_reviews, (error, result, fields) => {
            if (error)
                throw error;
        });
        res.send("Tables truncated");
    }
    catch (e) {
        console.log(e);
        res.send("Error deleting data");
    }
});
app.post('/disable-movie', (req, res) => {
    let data = req.body;
    let schema = data.Disable.schema;
    if (data.Disable.title == undefined)
        res.send("Error deserializing JSON");
    let title = mysql_1.default.escape(data.Disable.title);
    let checkMovie = `SELECT 1 FROM ${schema}.tb_movies WHERE title=${title}`;
    console.log(checkMovie);
    db.query(checkMovie, (error, results, fields) => {
        if (error) {
            console.log("Error performing query");
            res.send("Error performing query");
            throw error;
        }
        if (results.length == 0) {
            console.log("Could not find movie with that title");
            res.send("Could not find movie with that title");
        }
        else {
            let updateQuery = `UPDATE ${schema}.tb_movies SET enabled = 0 WHERE title=${title}`;
            db.query(updateQuery, (error, results, fields) => {
                if (error) {
                    throw error;
                }
            });
        }
    });
    res.send("Success");
});
app.post('/get-reviews', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let data = req.body;
    let schema = data.Review.schema;
    if (data.Review.title == undefined) {
        res.send("Error deserializing JSON");
        throw "Error deserializing JSON";
    }
    try {
        let title = mysql_1.default.escape(data.Review.title);
        let getReviews = `SELECT * FROM ${schema}.tb_reviews WHERE title = ${title}`;
        db.query(getReviews, (error, results, fields) => {
            if (error) {
                throw error;
            }
            console.log(results);
            log = results;
        });
    }
    catch (e) {
    }
    console.log(log);
    res.send(log);
}));
app.post('/filter-movies', (req, res) => {
    let data = req.body;
    let schema = data.Filter.schema;
    if (data.Filter.order == null || data.Filter.orderBy == null) {
        res.send("Missing properties");
    }
    if (data.Filter.orderBy == "title" || data.Filter.orderBy == "published") {
        if (data.Filter.amount == undefined || data.Filter.amount == null) {
            let orderBy = mysql_1.default.escape(data.Filter.orderBy);
            if (data.Filter.order == "asc") {
                let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} DESC`;
                db.query(query, (error, results, fields) => {
                    if (error)
                        res.send(error);
                    res.send(results);
                });
            }
            else {
                let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} ASC`;
                db.query(query, (error, results, fields) => {
                    if (error)
                        res.send(error);
                    res.send(results);
                });
            }
        }
        else {
            let orderBy = mysql_1.default.escape(data.Filter.orderBy);
            let amount = mysql_1.default.escape(data.Filter.amount);
            if (data.Filter.order == "asc") {
                let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} ASC LIMIT ${amount}`;
                db.query(query, (error, results, fields) => {
                    if (error)
                        res.send(error);
                    res.send(results);
                });
            }
            else {
                let query = `SELECT * FROM ${schema}.tb_movies ORDER BY ${orderBy} DESC LIMIT ${amount}`;
                db.query(query, (error, results, fields) => {
                    if (error)
                        res.send(error);
                    res.send(results);
                });
            }
        }
    }
    if (data.Filter.enabled != null && data.Filter.orderBy == "enabled") {
        if (data.Filter.amount == null) {
            let enabled = mysql_1.default.escape(data.Filter.enabled);
            let query = `SELECT * FROM ${schema}.tb_movies WHERE enabled = ${enabled}`;
            db.query(query, (error, results, fields) => {
                if (error)
                    res.send(error);
                res.send(results);
            });
        }
        else {
            let enabled = mysql_1.default.escape(data.Filter.enabled);
            let amount = mysql_1.default.escape(data.Filter.amount);
            let query = `SELECT * FROM ${schema}.tb_movies WHERE enabled = ${enabled} LIMIT ${amount}`;
            db.query(query, (error, results, fields) => {
                if (error)
                    res.send(error);
                res.send(results);
            });
        }
    }
    else
        res.send("Cannot perform lookup");
});
app.post('/review-movie', (req, res) => {
    let data = req.body;
    let schema = data.ReviewMovie.schema;
    if (data.ReviewMovie.title == undefined || data.ReviewMovie.review == undefined || data.ReviewMovie.author == undefined) {
        res.send("Missing one field");
    }
    let title = mysql_1.default.escape(data.ReviewMovie.title);
    let query = `SELECT * FROM ${schema}.tb_movies WHERE title = ${title}`;
    db.query(query, (error, results, fields) => {
        if (error)
            return res.send("Error performing query: " + error);
        if (results.length == 0)
            res.send("Cannot find movie for this title");
        let author = mysql_1.default.escape(data.ReviewMovie.author);
        let review = mysql_1.default.escape(data.ReviewMovie.review);
        let published = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.log(published);
        let enabled = 1;
        let update = `INSERT INTO ${schema}.tb_reviews (title, review, author, published, enabled) VALUES (${title}, ${review}, ${author}, '${published}', ${enabled})`;
        db.query(update, (error, results, fields) => {
            if (error)
                return res.send("Error inserting into database : " + error);
            res.send("Review Inserted successfully: " + results);
        });
    });
});
app.post('/schema-migration', (req, res) => {
    let data = req.body;
    if (data.Schema.newschema == undefined || data.Schema.oldschema == undefined)
        return res.send("Missing field");
    let schema = data.Schema.newschema;
    let oldschema = data.Schema.oldschema;
    let migrate = `CREATE SCHEMA ${schema}`;
    db.query(migrate, (error, results, fields) => {
        if (error)
            return res.send("Error with schema: " + error);
    });
    let createTables0 = `CREATE TABLE IF NOT EXISTS ${schema}.tb_movies (title varchar(50) NOT NULL,description varchar(1000) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL,PRIMARY KEY(title))`;
    db.query(createTables0, (error, results, fields) => {
        if (error)
            return res.send("Error creating tables: " + error);
    });
    let createTables1 = `CREATE TABLE IF NOT EXISTS ${schema}.tb_reviews (title varchar(50) NOT NULL,review varchar(1000) NOT NULL, author varchar(100) NOT NULL,published timestamp NOT NULL,enabled boolean NOT NULL)`;
    db.query(createTables1, (error, results, fields) => {
        if (error)
            return res.send("Error creating tables: " + error);
    });
    let insertValues0 = `INSERT INTO ${schema}.tb_movies SELECT * FROM ${oldschema}.tb_movies`;
    db.query(insertValues0, (error, results, fields) => {
        if (error)
            return res.send("Error inserting into tables: " + error);
    });
    let insertValues1 = `INSERT INTO ${schema}.tb_reviews SELECT * FROM ${oldschema}.tb_reviews`;
    db.query(insertValues1, (error, results, fields) => {
        if (error)
            return res.send("Error inserting into tables: " + error);
    });
    res.send("Database migration succeeded");
});
app.listen(port, "", () => {
    console.log(`Listening on port ${port}`);
});
