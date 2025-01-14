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
import env from "dotenv";

// Setting some essential constants
const __dirname = dirname(fileURLToPath(import.meta.url));  // Getting the exact full path to this folder
const app = express();                                      // Initializing app
const port = 3000;                                          // Setting application port number
const saltRounds = 10;                                      // Used for salting while hashing passwords
const sevenWeeksInMilliseconds = 1000 * 60 * 60 * 24 * 7;   // One week in milliseconds

env.config()                                                // Environment variable setup

// Middlware
app.use(bodyParser.urlencoded({extended: true}));           // Setting up the body parser for forms
app.use(express.static(__dirname + "/public"));             // Showing my express application where the public folder is
app.use(session(                                            // Using session as middleware for storing logged in out states
    {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {                                           // Sets the age (timer) of the cookie
            maxAge: sevenWeeksInMilliseconds                // I set it to a week
        }
    }
))
app.use(passport.initialize());                             // Initializing passport middleware
app.use(passport.session());                                // Necessary steps
app.use((req, res, next) => {                               // Made this middleware to disable login option from all ejs files if the user is already logged in
    if (req.isAuthenticated()) {
        res.locals = {
            loggedIn: true,
            username: req.user[0].username
        }
    }
    next();
});

// Establishing database connection
const db = new pg.Client(
    {
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: 5432
    }
);
db.connect();

// variables
var viewingPostID;

// Home page get route
app.get('/', async (req, res)=> {

    var openSecrets = await getPublicPosts();

    res.render("index.ejs", {openSecrets: openSecrets});
})

app.get('/login', (req, res)=> {
    res.render("login.ejs");
})

app.get('/register', (req, res)=> {
    res.render("register.ejs");
})

app.get("/logout", (req, res)=> {
    var user = req.user;
    req.logout(user, (err)=> {
        if (err) {
            console.log("error logging out.");
        }
        else {
            res.redirect('/');
        }
    })
})

app.get('/secrets', async (req, res)=> {
    // req.isauth comes from passport i think
    if (req.isAuthenticated()) {
        var userID = req.user[0].id;
        var allUserPosts = await getUserPosts(userID);
        res.render("secrets.ejs", {userSecrets: allUserPosts});
    }
    else {
        res.redirect('/login');
    }
})

app.get("/comment-section", async (req, res)=> {
    var postID = viewingPostID;
    var post = await getPost(postID);
    
    var isSignedIn = req.isAuthenticated() ? true : false;
    var comments = await getComments(postID);

    if (!isSignedIn) {
        res.render("comment-section.ejs", {post: post, comments: comments});
    }
    else {
        var user = req.user[0];
        res.render("comment-section.ejs", {post: post, isSignedIn: true, user_id: user.id, comments: comments})
    }
})

app.get("/create-post", async (req, res)=> {
    res.render("create-post.ejs")
})

app.post("/edit-post", async (req, res) => {

    var postID = req.body.updatedItemId;
    var postToEdit = await getPost(postID);
    res.render("edit-post.ejs", {post_id: postToEdit.id, post: postToEdit.post, isPrivate: !postToEdit.public, isAnon: postToEdit.anon})
})

app.post("/delete-post", async (req, res) => {
    
        var postID = req.body.deletedItemId;
    try {
        await deletePost(postID);
        res.redirect("/secrets");
    }
    catch(err) {
        console.log("Error while deleting post");
    }
})

app.post("/submit-edit-post", async (req, res) => {

    var postID = req.body.updatedItemId;
    var updatedPost = req.body.newPost;
    var isPublic = (req.body.isPrivate == "on") ? 'False' : 'True';
    var isAnon = (req.body.isAnon == "on") ? 'True' : 'False';

    try {
        await updatePost(postID, updatedPost, isPublic, isAnon);
        res.redirect("/secrets");
    }
    catch (err) {
        console.log("Error while updating post.");
    }
})


app.post("/submit-post", async (req, res)=> {

    if (req.isAuthenticated()) {
        var newPost = req.body.newPost;
        var isPublic = (req.body.isPrivate == "on") ? 'False' : 'True';
        var isAnon = (req.body.isAnon == "on") ? 'True' : 'False';
        var userID = req.user[0].id;
        
        // add the new post to the db
        try {
            await addPost(newPost, isPublic, isAnon, userID);
            res.redirect('/secrets');
        } catch (err) {
            console.log("Error while submitting a post");
        }

    }
    else {
        res.redirect('/login');
    }
})

app.post("/comment-section", async (req, res)=> {

    var postID = req.body.postItemId;
    var post = await getPost(postID);
    var isSignedIn = req.isAuthenticated() ? true : false;
    var comments = await getComments(postID);

    if (!isSignedIn) {
        res.render("comment-section.ejs", {post: post, comments: comments});
    }
    else {
        var user = req.user[0];
        res.render("comment-section.ejs", {post: post, isSignedIn: true, user_id: user.id, comments: comments})
    }
})

app.post("/create-comment", async (req, res)=> {
    var userID = req.body.userId;
    var postID = req.body.postId;
    var comment = req.body.comment;

    viewingPostID = postID;

    // try adding this comment to the comments table in the secrets db...
    try {
        await addComment(comment, userID, postID);

        res.redirect('/comment-section');
    }
    catch (err) {
        console.log("Error while posting a comment");
    }
})

app.post("/delete-comment", async (req, res) => {

    var commentID = req.body.commentId;
    var postID = req.body.postId;
    viewingPostID = postID;

    // try deleting the comment
    try {
        await deleteComment(commentID);
        res.redirect(`/comment-section`);
    }
    catch (err) {
        console.log("Error while deleting comment");
    }
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
                    var user = await addUser(username, email, hash);
                    req.login(user, (err)=> {
                        if (err) {
                            console.log("error logging in during registering.");
                        }
                        else {
                            res.redirect('/secrets');
                        }
                    })
                }
            })
        }
    } 
    catch(err) {
        console.log("Error while resgistering");
    }

})

app.post('/login', passport.authenticate("local", {      // uses local strategy
    successRedirect: "/secrets",
    failureRedirect: "/login"
}))

// ---------------------------- PASSPORT THINGS

// Setting up the login process here
passport.use(new Strategy(async function(username, password, cb) {

        // Putting everything in a try catch for emergency error handling
        try {
            // Making sure this user exists in the first place...
            const user = await getUser(username);
            if (user.length < 1) {
                // Let user know that this email is not registered
                return cb(null, false);
            }
            else {
                // Since the user exists, check if the password is correct
                var savedPassword = await getUserPassword(username);
                // Hash the entered password
                bcryptjs.compare(password, savedPassword, (err, result)=>{
                    if (err) {
                        return cb(err);
                    }
                    if (result) {
                        return cb(null, user);
                    }
                    else {
                        return cb(null, false);
                    }
                })
            }
        }
        catch (err) {
            return cb(err);
        }

}));

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
    var result = await db.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
        [username, email, password]
    );

    var user = result.rows;
    return user;
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

async function getPublicPosts() {
    var result = await db.query(
        "SELECT p.id, post, username, anon FROM posts AS p JOIN users AS u ON u.id = p.user_id WHERE public = 'True' ORDER BY p.id DESC;"
    )
    return result.rows;
}

async function getUserPosts(userID) {
    var result = await db.query(
        "SELECT id, post, public, anon FROM posts WHERE user_id = $1",
        [userID]
    );

    return result.rows;
}

async function addPost(post, isPublic, isAnon, userID) {
    await db.query(
        "INSERT INTO posts (post, user_id, public, anon) VALUES ($1, $2, $3, $4)",
        [post, userID, isPublic, isAnon]
    );
}

async function getPost(id) {
    var result = await db.query(
        "SELECT * FROM posts WHERE id = $1",
        [id]
    )
    var post = result.rows[0];
    return post;
}

async function updatePost(postID, post, isPublic, isAnon) {
    await db.query(
        "UPDATE posts SET post = $1, public = $2, anon = $3 WHERE id = $4",
        [post, isPublic, isAnon, postID]
    )
}

async function deletePost(post_id) {
    await db.query(
        "DELETE FROM posts WHERE id = $1",
        [post_id]
    )
}

async function addComment(comment, user_id, post_id) {
    await db.query(
        "INSERT INTO comments(comment, user_id, post_id) VALUES ($1, $2, $3)",
        [comment, user_id, post_id]
    );
}

async function getComments(post_id) {
    var result = await db.query(
        "SELECT user_id, comments.id, comment, username FROM comments JOIN users ON users.id = comments.user_id WHERE post_id = $1",
        [post_id]
    );

    return result.rows;
}

async function deleteComment(comment_id) {
    await db.query(
        "DELETE FROM comments WHERE id = $1",
        [comment_id]
    )
}