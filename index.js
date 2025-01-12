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

app.post('/register', async (req, res)=> {
    // Getting form data
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    // Putting everything in a try block
    try {

        // Making sure the email is unique...
        var result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length > 0) {

            // Handle the error
            res.render("register.ejs", {error: "An account is already registered with this email. Try logging in."})

        }

        else {
            
            // Otherwise add the new user into the database
            await db.query(
                "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
                [username, email, password]
            );

            res.render("secrets.ejs");
        }
    } 

    catch(err) {
        console.log(err);
    }

})

app.post('/login', async (req, res)=> {
    // Getting form data
    const email = req.body.email;
    const password = req.body.password;

    // Putting everything in a try catch for emergency error handling
    try {
        
        // Making sure this user exists in the first place...
        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length == 0) {

            // Let user know that this email is not registered
            res.render("login.ejs", {emailError: "This email is not registered."})

        }

        else {

            // Since the user exists, check if the password is correct
            var user = result.rows;
            var savedPassword = user[0].password;

            // If the passwords match
            if (savedPassword == password) {
                // let the user see the secrets
                res.render("secrets.ejs");
            }

            // Otherwise take them back to login with feedback
            else {
                res.render("login.ejs", {passwordError: "The password is incorrect."});
            }
        }

    }

    catch (err) {
        console.log(err);
    }
    
})


// App listener
app.listen(port, ()=> {
    console.log(`Listening to port ${port}.`);
})