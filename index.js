// Importing packages I need
import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import {dirname} from "path";
import {fileURLToPath} from "url"

// Setting some essential constants
const __dirname = dirname(fileURLToPath(import.meta.url));  // Getting the exact full path to this folder
const app = express();                                  // Initializing app
const port = 3000;                                      // Setting application port number

// Middlware
app.use(bodyParser.urlencoded({extended: true}));       // Setting up the body parser for forms
app.use(express.static(__dirname + "/public"));         // Showing my express application where the public folder is

// Establishing database connection
const db = new pg.Client(
    {
        user: 'postgres',
        database: 'secrets',
        host: 'localhost',
        password: '002468',
        port: 5432
    }
);
db.connect();

// Home page get route
app.get('/', (req, res)=> {
    res.render("index.ejs");
})

app.get('/login', (req, res)=> {
    res.render("login.ejs");
})

app.get('/register', (req, res)=> {
    res.render("register.ejs");
})

app.get('/secrets', (req, res)=> {
    res.render("secrets.ejs");
})

app.post('/register', (req, res)=> {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

})

app.post('/login', (req, res)=> {
    const email = req.body.email;
    const password = req.body.password;
    
})


// App listener
app.listen(port, ()=> {
    console.log(`Listening to port ${port}.`);
})