# MovieAPI
Movie API with MySQL and Docker Container

Endpoints:

POST {baseurl}:{port}/seed -> Seeds the database with specified schema and number of movie titles, creates tables if not exist.

GET {baseur}:{port}/truncate -> Deletes all information from tables (reviews and movies)

POST {baseur}:{port}/disable-movie -> Disables movie with given title and schema

POST {baseurl}:{port}/get-reviews -> Gets reviews from a given movie title

POST {baseurl}:{port}/filter-movies -> Filters movies with a given configuration and retrieves them

POST {baseurl}:{port}/review-movie -> Allows to post a review to a given movie title (if movie exists in database)

POST {baseurl}:{port}/schema-migration -> Performs a schema migration, moves all data to new schema and creates tables

Docker:
Deploys the API on port 7500 (External) and 3000 (Internal)
Deploys MySql on port 3307 (External) and 3306 (Internal). Creates database "moviedb"
Deploys Adminer on port 6050 (External) and 8080 (Internal)


