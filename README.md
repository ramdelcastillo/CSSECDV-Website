# CSSECDV-Website
Devs: <br>
Del Castillo, Jose Mari<br>
Borromeo, Matthew<br>
Pecson, Richard <br><br>
Submission Date: March 14, 2025

## Setting up the Application
1. Install Node.js LTS [here](https://nodejs.org/en/download)
2. Clone the repo by running `git clone https://github.com/ramdelcastillo/CSSECDV-Website.git`
3. Navigate to the folder `cd CSSECDV-Website`
4. Run `npm install` to install all the dependencies
5. Create a `.env` file and place these
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=cssecdv_db
DB_PASSWORD=youpassword
DB_PORT=5432
SERVER_PORT=5000
JWT_SECRET=256 bit secret
SECRET=256 bit secret
```

## Setting up PostgreSQL
1. Download PostgreSQL Version 17 [here](https://www.postgresql.org/download/)
2. Follow this [installation guide](https://www.w3schools.com/postgresql/postgresql_install.php)
3. Be sure to include `C:\Program Files\PostgreSQL\17\bin` in your Environmental Variables (both Path and User to be sure)
4. Make sure you are in the project folder `CSSECDV_Website`
5. Run `psql -U postgres -c "CREATE DATABASE cssecdv_db;"` to create the DB
6. Run `psql -U postgres -d cssecdv_db -f setup_db.sql` to intialize the DB
### To reset the database
Run `psql -U postgres -d cssecdv_db -f reset_db.sql`

## How to run the app
Simply run `npm run dev` in the project folder
