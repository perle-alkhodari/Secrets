Section 1 ////////////////////// HOW TO START THE SERVER

    STEP 1: At the root level of the project do npm i in the terminal to 
            install all the packages needed to run the application.

    STEP 2: Download pgAdmin4 and save the password you create with it.

    STEP 3: Create a database in pgAdmin4 call it whatever you want.

    STEP 4: Go to section 3 of this read me and create these tables in
            pgAdmin by running this query in your database.

    STEP 5: Go to section 4 of this read me and familiarize yourself with
            the environment variables in the application.

    STEP 6: Make a .env file in the root level.

    STEP 7: Go to section 4 of this read me, copy paste section 3 into 
            your .env and replace the # with your credentials. NOTE:
            SESSION_SECRET is some random string that YOU make up to
            secure your session.

    STEP 8: In the terminal run node --watch index.js or node index.js
            if you're not planning on making any changes to the code.

Section 2 ////////////////////// THIS APPLICATION USES POSTGRES

    NOTE: The name of the database is in an environment variable.

    NOTE: There are so far three tables in the database, here is
    the sql code that creates them (download postresql and run
    these sql commands after creating the database).

Section 3 ////////////////////// DATABASE TABLES USED IN THIS APPLICATION

    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(60) NOT NULL,
        email VARCHAR(60) UNIQUE NOT NULL,
        password VARCHAR(60) NOT NULL
    )

    CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        post VARCHAR(580) NOT NULL,
        user_id INTEGER REFERENCES user(id) NOT NULL,
        public BOOL NOT NULL,
        anon BOOL NOT NULL
    )

    CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES post(id),
        user_id INTEGER REFERENCES user(id),
        comment VARCHAR(500) NOT NULL,
        UNIQUE (comment, user_id)
    )

Section 4 ////////////////////// ENVIRONMENT VARIABLES

    DB_USER="#"
    DB_HOST="#"
    DB_DATABASE="#"
    DB_PASSWORD="#"
    
    SESSION_SECRET="#"
    
Section 5 ////////////////////// WARM REMINDER

    For your sake do not forget to:

    -  .gitignore your node_modules folder and .env file
    -  keep sensitive information in .env file



//made by perle <3
      
