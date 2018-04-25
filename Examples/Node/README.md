## Node - Express - PostgreSQL - Sequelize

This is an example project for using `secure-password` with the above mentioned stack.

Make sure to have [Docker and Docker-Compose](https://docs.docker.com/install/) installed.

To run this project:

1. Clone this repo
2. `cd Examples/Node`
3. Run `docker-compose up`
4. The server should now be live at [http://localhost:8000](http://localhost:8000)

Create a user: 

```bash
curl -X POST \
  http://localhost:8000/users/create \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'name=test%20user&email=test%40gmail.com&password=password123'
```

Log user in:

```bash
curl -X POST \
  http://localhost:8000/users/login \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'id=932a8419-258f-4fdd-acf8-693589735ca2&password=password123'
```

Configuration files:

- `Dockerfile` tells Docker how to build this project, super simple Dockerfil has a lot of room for improvement, but wanted to keep it simple
- `docker-compose.yml` this allows us to run a `PostgreSQL` container and a `Node` container and allow them to communicate
- `.sequelizerc` tells the `sequelize-cli` where to find the configuration/models/migrations/seeder files
- `src/server/config/sequelize-config.json` this file tells the sequelize-cli which is used to run migrations/etc what the credentials for our DB are.

Important files:

- `src/server/app.js` this has the routes for creating/logging in a user. There are comments which describe what each function does, take a look at it!
- `src/server/models/user.js` the user model which is a JavaScript/Sequelize representation of what the DB model looks like. Take a look at how to handle encrypting the password.
- `src/server/utils/passwordHelper.js` this is a simple wrapper around `secure-password` which uses promises.