# Credential Manager Backend API

An Express.js API server that interacts with a MongoDB database that stores information about users and their organisational units and divisions that they have access to. The user can register and/or login, and view and manipulate registered user details as well as account credential information that resides within their assigned organisational units and divisions.

---

## Table of Contents

1. How to install the project
2. How to use the project
3. Credit to authors

---

## How to install the project

Before you get to use the project, you need to install all the necessary software on your local machine. As mentioned in the description, this is a Express.js server, and thus, you will have to install Node.js and NPM (Node Package Manager) in order for this server to run on your machine. You will not need to install Node.js and NPM separately, since NPM is automatically installed once you install Node.js. Note that this server was built using Node.js version 16.17.0 and NPM version 9.4.2. However, it is generally recommended that you install the latest LTS (Long-Term Support) version of Node.js and NPM, as it is unlikely that any newer versions of Node and NPM will be unable to run this server. You can download Node.js and NPM [here](https://nodejs.org/en/download). To ensure that you have successfully installed Node.js and NPM, open up a CLI (Command Line Interface) and run the following commands:

- node -v
- npm -v

This should return the version numbers for Node.js and NPM installed on your local machine. For example, 'node -v' might return something like v16.17.0, and 'npm -v' might return something like v9.4.2.

You will also need to install Postman if you would like to send HTTP requests to the server. With Postman, you can create different types of HTTP requests that can send and retrieve data to and from the server's database. You can install Postman [here](https://www.postman.com/downloads/).

Once Node.js, NPM and Postman are installed, ensure that you have downloaded all the project files and directories and saved them in a location that you will easily remember. Now, open up a CLI and navigate to the project's root directory. Once there, you will have to install all the necessary libraries for this server to run. To do this, simply type in the following command:

- npm install

This should create a 'node_modules' directory in the project's root directory where all the required libraries will be installed. You are now ready to run and test this server.

---

## How to use the project

To use this project, you will need to run the server and create HTTP requests in Postman to interact with the server.

To run the server, open up a CLI (Command Line Interface) and navigate to the project's root directory. Here, you can run the server in one of two ways:

- npm start
- npm run dev

The 'npm start' script runs the 'node server.js' command. This run the server as normal, but if you make changes to the server's code while the server is running, you will need to manually restart the server for these changes to take effect.

The 'npm run dev' script runs the 'nodemon server.js' command. This also runs the server as normal. However, in contrast to 'node server.js', if you make changes to the code while the server is running, the server will automatically restart for you and the effects will almost immediately take effect upon saving the new code.

Once the server is running, you may now use Postman to send HTTP requests to the server and get responses from the server. You can create a new HTTP in Postman by navigating to the 'Collections' sections, clicking on 'Create new collection' and then clicking on 'Add request'.

The server has several endpoints that you can interact with. You can find all the API endpoints below (remember to select the correct HTTP request for the endpoint, i.e., POST, PUT, DELETE, GET, etc.):

- 'http://localhost:8080/all-users':
  - This is a POST request that allows an authenticated user to retrieve an entire list of registered users. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

- 'http://localhost:8080/orgs-and-divisions':
  - This is a POST request that retrieves an authenticated user's username, role and assigned organisational units and divisions. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

- 'http://localhost:8080/login':
  - This is a POST request that allows a user to login by retrieving a JWT token. This endpoint needs a JSON body in the following format:

    ```js
    {
        'username': '<username>',
        'password': '<password>'
    }
    ```

- 'http://localhost:8080/register':
  - This is a POST request that allows an unauthenticated user to register a new user account. This endpoint needs a JSON body in the following format:

    ```js
    {
        'username': '<username>',
        'password': '<password>'
    }
    ```

- 'http://localhost:8080/view-credentials':
  - This is a POST request that allows an authenticated user to view an entire list of credentials within their assigned organisational units and divisions. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

- 'http://localhost:8080/add-credential':
  - This is a POST request that allows an authenticated user to add a new account credential to any one of their assigned organisational units and divisions. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

  - This endpoint also needs a JSON body in the following format:

    ```js
    {
        'organisational_unit': '<organisational unit>',
        'division': '<division>',
        'name': '<new account name>',
        'username': '<new account username>',
        'password': '<new account password>'
    }
    ```

- 'http://localhost:8080/update-credential':
  - This is a PUT request that allows an authenticated user to update any account credential within any of their assigned organisational units and divisions. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

  - The endpoint also needs a JSON body in the following format:
  
    ```js
    {
        'organisational_unit': '<organisational unit>',
        'division': '<division>',
        'old_name': '<old account name>',
        'old_username': '<old account username>',
        'old_password': '<old account password>',
        'new_name': '<new account name>',
        'new_username': '<new account username>',
        'new_password': '<new account password>'
    }
    ```

  - Note that the if the user wants to update only one or two aspects of the credential instead of all three, they can simply keep the old value(s) and new value(s) the same for the aspects that they do not want to change. For example, if a user only wants to change the password for a credential in the Software Reviews Finance division and wants to keep the account name and username the same, they can enter the following:

    ```js
    {
        'organisational_unit': 'Software Reviews',
        'division': 'Finance',
        'old_name': 'Yoco',
        'old_username': 'floating.rabbit',
        'old_password': 'def456',
        'new_name': 'Yoco',
        'new_username': 'floating.rabbit',
        'new_password': 'ghi789'
    }
    ```

- 'http://localhost:8080/update-role':
  - This is a PUT request that allows an authenticated user to update the role of any registered user. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

  - This endpoint also needs a JSON body in the following format:

    ```js
    {
        'user_id': '<user ID>',
        'new_role': '<new user role>'
    }
    ```

  - This endpoint uses a user ID to find the user who needs to be updated, and it needs the new role that the user will be assigned to.

- 'http://localhost:8080/assign-division':
  - This is a POST request that allows an authenticated user to assign a registered user to a new organisational unit and division. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

  - This endpoint also needs a JSON body in the following format:

    ```js
    {
        'user_id': '<user ID>',
        'organisational_unit': '<new organisational unit>',
        'division': '<new division>'
    }
    ```

- 'http://localhost:8080/unassign-division':
  - This is a DELETE request that allows an authenticated user to unassign a registered user from an organisational unit and division. This endpoint needs an Authorization header with a JWT login token in the following format:

    ```js
    'Authorization': 'Bearer <token>'
    ```

  - This endpoint also needs a JSON body in the following format:

    ```js
    {
        'user_id': '<user ID>',
        'organisational_unit': '<organisational unit>',
        'division': '<division>'
    }
    ```

---

## Credit to authors

[Dean Justin Gulston](https://github.com/DJGulston)
