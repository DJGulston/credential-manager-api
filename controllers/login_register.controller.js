const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Post request that registers a new user with their given username
 * password.
 */
exports.registerUser = async (req, res) => {
    try {

        // Obtains the username and password of the user who is registering.
        const username = req.body.username;
        const password = req.body.password;

        // Sets the user's default role to 'normal'.
        const defaultRole = 'normal';

        // Gets a list all users excluding their passwords.
        const userList = await User.find({}, {password: false});

        // Keeps track of whether the given username has already been
        // registered.
        let usernameFound = false;

        // Stores the username of the already registered user.
        let existingUsername = '';

        for(let i = 0; i < userList.length; i++) {

            // Gets the username of user i.
            let currentUsername = userList[i].username;

            // If the given username matches the user i's username, we cannot
            // register the given user, and thus, we set usernameFound to true.
            if(currentUsername.toLowerCase() === username.toLowerCase()) {
                usernameFound = true;
                existingUsername = currentUsername;
            }
        }

        // If the given username is already registered, we send back an error message.
        if(usernameFound) {
            res.status(403).send({
                error: `Cannot register new user. Username '${existingUsername}' is already taken.`
            });
        }
        else {

            // If the given username is not already registered, then we register the new user.

            // Generates a salt to encrypt the given password.
            const salt = await bcrypt.genSalt(10);

            // Encrypts the given password using one-way hashing.
            const encryptedPassword = await bcrypt.hash(password, salt);

            // Creates a new user document in the User collection,
            // i.e. registers the new user.
            let result = await User.create({
                username: username,
                password: encryptedPassword,
                role: defaultRole
            });

            console.log(result);

            res.send({
                message: 'New user registered.'
            });
        }

    }
    catch(error) {
        console.log(error);
        res.status(500).send({
            error: 'Error occurred while attempting to register new user.'
        });
    }
}

/**
 * Post request that logs the user in by obtaining a token.
 */
exports.loginUser = async (req, res) => {
    try {

        // Obtains the username and password of the user trying to login.
        const username = req.body.username;
        const password = req.body.password;

        // Obtains a list of a all users.
        const userList = await User.find();

        let userPayload = {};

        for(let i = 0; i < userList.length; i++) {

            // Obtains the username and encrypted password of user i.
            let username_i = userList[i].username;
            let password_hash_i = userList[i].password;

            // Checks if the user's given password matches user i's password.
            let passwordMatches = await bcrypt.compare(password, password_hash_i);

            // If the username and password matches that of user i, that means the user
            // exists, and thus, we can set the payload for the user trying to login.
            if(username.toLowerCase() === username_i.toLowerCase() && passwordMatches) {
                userPayload['_id'] = userList[i]._id;
                userPayload['username'] = username_i;
                userPayload['role'] = userList[i].role;
            }
        }

        // If the payload is set, i.e. is not empty, we send back a token, and thus, the
        // user is logged in.
        if(JSON.stringify(userPayload) !== '{}') {
            const token = jwt.sign(userPayload, JWT_SECRET, {algorithm: 'HS256'});

            res.send({
                token: token
            });
        }
        else {

            // If the payload is not set, i.e. empty, we send back an error message.
            res.status(403).send({
                error: 'Incorrect login details.'
            });
        }
        
    }
    catch(error) {
        console.log(error);
        res.status(500).send({
            error: 'Error occurred while attempting to login.'
        });
    }
}

/*

References:

How to define an array in a Mongoose Schema:
- https://mongoosejs.com/docs/schematypes.html#arrays

How to define an object array in a Mongoose Schema:
- https://stackoverflow.com/questions/19695058/how-to-define-object-in-array-in-mongoose-schema-correctly-with-2d-geo-index

How to create Mongoose schema model by adding 3 parameters in the model function if the collection is stored as camelCase:
- https://stackoverflow.com/questions/65681487/mongoose-doesnt-allow-me-to-use-camelcase-collection-name

How to reference a model according to their Object ID in the Mongoose schema function:
- https://stackoverflow.com/questions/22244421/how-to-create-mongoose-schema-with-array-of-object-ids

How to populate a nested array in Mongoose:
- https://stackoverflow.com/questions/19222520/populate-nested-array-in-mongoose

How to query a value in a nested array in Mongoose:
- https://stackoverflow.com/questions/62970436/query-nested-array-of-object-mongoose

How to add an element to a nested object array in Mongoose:
- https://stackoverflow.com/questions/70481291/adding-element-inside-nested-array-in-mongoose
- https://www.mongodb.com/community/forums/t/pushing-elements-to-nested-array/109075

How to update a field in a nested object array in Mongoose:
- https://www.mongodb.com/community/forums/t/updating-nested-array-of-objects/173893/3
- https://www.mongodb.com/docs/manual/reference/operator/update/positional-filtered/
- https://www.mongodb.com/docs/manual/reference/operator/update/positional-all/

How to remove an element from a nested object array in Mongoose:
- https://www.mongodb.com/community/forums/t/how-to-delete-a-specific-nested-subdocument-completely-from-an-document/100219/4

How to convert a string to a MongoDB ObjectId:
- https://stackoverflow.com/questions/6578178/node-js-mongoose-js-string-to-objectid-function

What functions can you use in aggregation:
- https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/

How to use an aggregation pipeline for nested documents:
- https://www.tutorialspoint.com/how-can-i-aggregate-nested-documents-in-mongodb

How to separate a document with an array into multiple documents using the $unwind pipeline stage:
- https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/

How to $unwind a double nested object array:
- https://stackoverflow.com/questions/57164135/mongodb-double-nested-array-to-reserve-unwind

How to display certain fields in the aggregation pipeline using $project:
- https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/

How to keep existing fields after using the $group pipeline stage in MongoDB aggregation:
- https://stackoverflow.com/questions/16662405/mongo-group-query-how-to-keep-fields

How to group a set of documents by a specific field (i.e. how to group divisions by organisational unit):
- https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/#pivot-data

How to $match multiple values in MongoDB aggregation:
- https://stackoverflow.com/questions/60608138/mongo-aggregation-match-multiple-values

*/
