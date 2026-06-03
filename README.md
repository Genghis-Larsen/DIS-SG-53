# DIS-SG-53 Arcade Project

Project for Databases and Information Systems 2026 made by CWS242 and PNL419.

This project is a small local arcade web app. The app contains three small games and stores submitted scores in a PostgreSQL database.

The three games are:

- Fibonacci
- Alphabet
- Gates

The web app is built with Flask, HTML, CSS, JavaScript, PostgreSQL, and SQL.

## Project structure

```text
DIS-SG-53/
├── arcade/
│   ├── app.py
│   ├── schema.sql
│   ├── seed.sql
│   ├── .env.example
│   ├── templates/
│   └── static/
├── requirements.txt
└── README.md
```

The main application is in `arcade/app.py`.

The database schema is in `arcade/schema.sql`.

The optional test data is in `arcade/seed.sql`.

The `arcade/.env.example` file is included as an example. The user must copy its contents into a new `arcade/.env` file and then insert their own PostgreSQL information.

## Database model

The database is based on an arcade highscore system.

The main tables are:

- `game`
- `score`
- `fib_score`
- `alphabet_score`
- `gates_score`

The `game` table stores the available games. The `score` table stores shared score information, such as nickname, game, time taken, and when the score was achieved. The game specific score tables store extra score information for each game.


## Setup instructions

### 1. Clone the repository

```bash
git clone https://github.com/Genghis-Larsen/DIS-SG-53.git
cd DIS-SG-53
```

### 2. Create a virtual environment

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the PostgreSQL database

Open PostgreSQL and create a database named `arcade`:

```sql
CREATE DATABASE arcade;
```

## Important `.env` setup

The project includes an example environment file:

```text
arcade/.env.example
```

Do not edit `arcade/.env.example` directly. Instead, create a new file called:

```text
arcade/.env
```

Then copy the contents from `arcade/.env.example` into the new `arcade/.env` file.

After that, edit `arcade/.env` with your own PostgreSQL information.

Example:

```env
DB_NAME=arcade
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
```

This is important because PostgreSQL usernames and passwords are different on different computers.

If the app cannot connect to the database, `arcade/.env` is the first thing to check.

## Initialize the database

Go into the `arcade` folder:

```bash
cd arcade
```

Run the schema file:

```bash
psql -U postgres -d arcade -f schema.sql
```

If your PostgreSQL username is not `postgres`, replace `postgres` with your own username.

Example:

```bash
psql -U your_username -d arcade -f schema.sql
```

This creates the tables and inserts the three games.

### Optional test data

If you want example scores in the database, run:

```bash
psql -U postgres -d arcade -f seed.sql
```

This is only for testing/demo data.

## Run instructions

From inside the `arcade` folder, run:

```bash
python app.py
```

Then open the app in a browser:

```text
http://127.0.0.1:5000
```

To stop the app, press:

```text
Ctrl + C
```

Then deactivate the virtual environment:

```bash
deactivate
```

## Interaction instructions

1. Open the front page.
2. Choose one of the games: Fibonacci, Alphabet, or Gates.
3. Play the game.
4. When the game ends, enter a nickname.
5. The nickname must use capital letters A-Z and be at most 10 characters long.
6. Submit the score.
7. View the scoreboard for the game.

The scoreboards show the submitted scores from the PostgreSQL database.

## AI declaration

We used AI during our development of our project. It was used for the CSS part of the project to make sure that the project looked good. It was also used as a helping hand on how to run the program using the Powershell/Terminal commands. 