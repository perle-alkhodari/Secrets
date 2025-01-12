// Importing packages I need
import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcryptjs from "bcryptjs";
import {dirname} from "path";
import {fileURLToPath} from "url"
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

// Setting some essential constants
const __dirname = dirname(fileURLToPath(import.meta.url));  // Getting the exact full path to this folder
const app = express();                                      // Initializing app
const port = 3000;                                          // Setting application port number
const saltRounds = 10;                                      // Used for salting while hashing passwords

// Middlware
app.use(bodyParser.urlencoded({extended: true}));           // Setting up the body parser for forms
app.use(express.static(__dirname + "/public"));             // Showing my express application where the public folder is
app.use(session(                                            // Using session as middleware for storing logged in out states
    {
        secret: "SECRETSIGNATURE",
        resave: false,
        saveUninitialized: true
    }
))
app.use(passport.initialize());                             // Initializing passport middleware
app.use(passport.session());                                // Necessary steps

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
        var exists = await emailExists(email);

        // Handle the error
        if (exists) {
            res.render("register.ejs", {error: "An account is already registered with this email. Try logging in."})
        }

        // Otherwise add the new user into the database
        else {
            bcryptjs.hash(password, saltRounds, async (err, hash) => {
                // error handle first
                if (err) {
                    console.log("Error during password hashing.");
                }
                // adding the user with their hashed password
                else {
                    await addUser(username, email, hash);
                    res.render("secrets.ejs");
                }
            })
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
        const user = await getUser(email);
        if (user.length < 1) {
            // Let user know that this email is not registered
            res.render("login.ejs", {emailError: "This email is not registered."})
        }
        else {
            // Since the user exists, check if the password is correct
            var savedPassword = await getUserPassword(email);
            // Hash the entered password
            bcryptjs.compare(password, savedPassword, (err, result)=>{
                if (err) {
                    console.log("error comparing passwords.");
                }
                if (result) {
                    res.render("secrets.ejs");
                }
                else {
                    res.render("login.ejs", {passwordError: "The password is incorrect."});
                }
            })
        }
    }
    catch (err) {
        console.log(err);
    }

})

// ---------------------------- PASSPORT THINGS

// Setting up the login process here

// Saving user data to local storage
passport.serializeUser( (user, cb)=> {
    cb(null, user);
})
passport.deserializeUser( (user, cb)=> {
    cb(null, user);
})



// App listener
app.listen(port, ()=> {
    console.log(`Listening to port ${port}.`);
})


// ----------------------------- FUNCTIONS


// Helper functions
function areEqual(a, b) {
    return a == b;
}

// Database Queries
async function getUser(email) {
    var result = await db.query(
        "SELECT * FROM users WHERE email = $1", [email]
    )
    return result.rows;
}

async function addUser(username, email, password) {
    await db.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
        [username, email, password]
    );
}

async function getUserPassword(email) {
    var result = await db.query(
        "SELECT password FROM users WHERE email = $1", [email]
    );
    var password = result.rows[0].password;
    return password;
}

async function emailExists(email) {
    var isExisting;

    var result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    isExisting = (result.rows.length == 0) ? false : true;

    return isExisting;
}