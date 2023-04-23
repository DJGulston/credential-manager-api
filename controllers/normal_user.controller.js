const OrgUnit = require('../models/OrganisationalUnit.js');
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Post request that returns a list of all credentials that the user,
 * who is currently logged in, is assigned to.
 */
exports.viewCredentials = async (req, res) => {

    try {

        const auth = req.headers['authorization'];

        const token = auth.split(' ')[1];

        const user = jwt.verify(token, JWT_SECRET);

        try {

            // Obtains the ID of the user currently logged in.
            const userId = user._id;
    
            // Obtains the most up-to-date details for the logged in user.
            let userResult = await User.findOne({_id: userId}, {password: false});

            // Gets the role of the logged in user.
            const userRole = userResult.role;

            if(userRole === 'normal' || userRole === 'management' || userRole === 'admin') {

                // Gets all the organisational units and divisions that
                // logged in user is assigned to, as well as the account
                // credentials.
                let result = await OrgUnit.aggregate([

                    // Splits each document into multiple documents according to each
                    // unique division within the document.
                    {
                        $unwind: {
                            path: '$divisions',
                            preserveNullAndEmptyArrays: false
                        }
                    },
    
                    // Splits each document again into multiple documents according to
                    // each unique user within each division.
                    {
                        $unwind: {
                            path: '$divisions.users',
                            preserveNullAndEmptyArrays: false
                        }
                    },
    
                    // Filters out the documents that do not have the same ID as the
                    // user who is currently logged in.
                    {
                        $match: {
                            'divisions.users': new mongoose.Types.ObjectId(userId)
                        }
                    },
    
                    // Only the organisational unit name, division names and accounts are returned
                    // as output.
                    {
                        $project: {
                            name: 1,
                            'divisions.name': 1,
                            'divisions.accounts': 1
                        }
                    },

                    // Groups the divisions that were split into multiple documents back into
                    // a single array according to the organisational unit ID.
                    {
                        $group: {
                            _id: '$_id',
                            name: {
                                $first: '$name'
                            },
                            divisions: {
                                $push: {
                                    name: '$divisions.name',
                                    accounts: '$divisions.accounts'
                                }
                            }
                        }
                    }
                ]);
        
                res.send(result);
            }
            else {

                // Error message sent back is the user does not have a 'normal',
                // 'management' or 'admin' role
                res.status(403).send({
                    error: `${userRole} is not a valid role. You are not authorized to view credentials.`
                });
            }

            
        }
        catch(error) {
            console.log(error);
            res.status(500).send({
                error: 'Error occurred when attempting to view credentials.'
            });
        }

    }
    catch(error) {
        console.log(error);
        res.status(401).send({
            error: 'Bad JWT!'
        });
    }
}

/**
 * Post request that adds a new credential to a given organisational
 * unit and division.
 */
exports.addCredential = async (req, res) => {
    
    try {

        // Obtains the organisational unit and division that we would
        // like to the new credential to.
        const division = req.body.division;
        const orgUnit = req.body.organisational_unit;

        // Obtains the account credential values that we wish to add.
        const accountName = req.body.name;
        const accountUsername = req.body.username;
        const accountPassword = req.body.password;

        const auth = req.headers['authorization'];

        const token = auth.split(' ')[1];

        const user = jwt.verify(token, JWT_SECRET);

        try {

            // Obtains the ID of the user currently logged in.
            const userId = user._id;
    
            // Obtains the most up-to-date details for the logged in user.
            let userResult = await User.findOne({_id: userId}, {password: false});

            // Gets the role of the logged in user.
            const userRole = userResult.role;

            if(userRole === 'normal' || userRole === 'management' || userRole === 'admin') {
                let result = await OrgUnit.aggregate([

                    // Splits each document into multiple documents according to each
                    // unique division within the document.
                    {
                        $unwind: {
                            path: '$divisions',
                            preserveNullAndEmptyArrays: false
                        }
                    },
    
                    // Splits each document again into multiple documents according to
                    // each unique user within each division.
                    {
                        $unwind: {
                            path: '$divisions.users',
                            preserveNullAndEmptyArrays: false
                        }
                    },
    
                    // Filters out the documents that do not have the same ID as the
                    // user who is currently logged in, as well as documents that are
                    // not part of the given organisational unit and division.
                    {
                        $match: {
                            'divisions.users': new mongoose.Types.ObjectId(userId),
                            name: orgUnit,
                            'divisions.name': division
                        }
                    },
    
                    // Only the organisational unit name, division names, users and
                    // accounts are returned as output.
                    {
                        $project: {
                            name: 1,
                            'divisions.name': 1,
                            'divisions.users': 1,
                            'divisions.accounts': 1
                        }
                    }
                ]);

                // If no results were returned, that means the user does not belong to the given
                // organisational unit and division, and thus, we send back an error message.
                if(result.length <= 0) {
                    res.status(403).send({
                        error: `You are not authorized to add a new credential to the ${orgUnit} ${division} division since you are not part of this division.`
                    });
                }
                else {

                    // If there is at least one result, that means the user belongs to the given
                    // organisational unit and division, and thus, we can proceed with the addition
                    // of a new credential.

                    // Keeps track of whether the given account name and username already exists
                    // in the given organisational unit and division.
                    let accountAlreadyExists = false;

                    for(let i = 0; i < result.length; i++) {

                        // Obtains the accounts array.
                        let accounts = result[i].divisions.accounts;
    
                        for(let j = 0; j < accounts.length; j++) {

                            // Obtains the account name and username of account j.
                            let account_name_j = accounts[j].name;
                            let account_username_j = accounts[j].username;
    
                            // If the given account name and username is equal to that of
                            // account j, then that means the account credential already exist
                            // in that given organisational unit and division, and thus, we
                            // set the accountAlreadyExists status to true.
                            if(accountName === account_name_j && accountUsername === account_username_j) {
                                accountAlreadyExists = true;
                            }
                        }
                    }

                    // If the account credential does not already exist in the given
                    // organisational unit and division, then we proceed with the addition
                    // of the new account credential.
                    if(!accountAlreadyExists) {

                        try {

                            // Adds the new account credential to the given organisational
                            // unit and division.
                            let updateResult = await OrgUnit.updateOne(

                                // Filters on the organisational unit and division.
                                {
                                    name: orgUnit,
                                    'divisions.name': division
                                },
    
                                // Pushes the new account to the accounts array.
                                {
                                    $push: {
                                        'divisions.$.accounts': {
                                            name: accountName,
                                            username: accountUsername,
                                            password: accountPassword
                                        }
                                    }
                                }
                            );
    
                            console.log(updateResult);
    
                            // Success message sent back to the user once the credential is added.
                            res.send({
                                message: `New credential added to the ${orgUnit} ${division} division.`
                            });

                        }
                        catch(error) {
                            console.log(error);
                            res.status(500).send({
                                error: 'Error occurred when attempting to add new credential.'
                            });
                        }
                    }
                    else {

                        // If the account credential already exists in the given organisational unit
                        // and division, we send back an error message.
                        res.status(403).send({
                            error: `Cannot add new credential. This credential already exists in the ${orgUnit} ${division} division.`
                        });
                    }
                    
                }

            }
            else {

                // If the user does not have a 'normal', 'management' or 'admin' role,
                // then we send back an error message.
                res.status(403).send({
                    error: `${userRole} is not a valid role. You are not authorized to add a new credential.`
                });
            }

            
        }
        catch(error) {
            console.log(error);
            res.status(500).send({
                error: 'Error occurred when attempting to view credentials.'
            });
        }

    }
    catch(error) {
        console.log(error);
        res.status(401).send({
            error: 'Bad JWT!'
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
