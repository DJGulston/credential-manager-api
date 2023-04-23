const OrgUnit = require('../models/OrganisationalUnit.js');
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Put request that updates any given details (account name, username and/or
 * password) for a particular credential.
 */
exports.updateCredential = async (req, res) => {
    
    try {

        // Obtains the organisational unit and division for the credential we
        // would like to update.
        const division = req.body.division;
        const orgUnit = req.body.organisational_unit;

        // Obtains the current credential details.
        const oldAccountName = req.body.old_name;
        const oldAccountUsername = req.body.old_username;
        const oldAccountPassword = req.body.old_password;

        // Obtains the new credential details we would like to use
        // for the update.
        const newAccountName = req.body.new_name;
        const newAccountUsername = req.body.new_username;
        const newAccountPassword = req.body.new_password;

        const auth = req.headers['authorization'];

        const token = auth.split(' ')[1];

        const user = jwt.verify(token, JWT_SECRET);

        // If any of the new credential values for the existing account are blank, we send
        // an error message back.
        if(newAccountName === '' || newAccountUsername === '' || newAccountPassword ==='') {
            res.status(403).send({
                error: 'Cannot update credential! You have not entered any new credential values for the existing account.'
            });
        }
        else {

            // If all the new credential values for the existing account have a value, then
            // we proceed with the update.

            try {

                // Obtains the ID of the user currently logged in.
                const userId = user._id;
    
                // Obtains the most up-to-date details for the logged in user.
                let userResult = await User.findOne({_id: userId}, {password: false});
    
                // Gets the role of the logged in user.
                const userRole = userResult.role;
    
                // If the user has a 'management' or 'admin' role, we proceed with the
                // credential update.
                if(userRole === 'management' || userRole === 'admin') {

                    // Obtains all account credentials that the currently logged in user has
                    // access to.
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
                        // not within the given organisational unit and division.
                        {
                            $match: {
                                'divisions.users': new mongoose.Types.ObjectId(userId),
                                name: orgUnit,
                                'divisions.name': division
                            }
                        },
        
                        // Only returns the organisational unit name, division name, users
                        // within that division and accounts within that division as output.
                        {
                            $project: {
                                name: 1,
                                'divisions.name': 1,
                                'divisions.users': 1,
                                'divisions.accounts': 1
                            }
                        }
                    ]);
    
                    // If the result is empty, that means we have not found the currently logged
                    // in user within the given organisational unit and division, and thus, we
                    // send back an error message.
                    if(result.length <= 0) {
                        res.status(403).send({
                            error: `You are not authorized to update a credential in the ${orgUnit} ${division} division since you are not part of this division.`
                        });
                    }
                    else {

                        // If the result is not empty, that means the currently logged in user exists in the
                        // given organisational unit and division, and thus, we can proceed with the update.

                        // Keeps track of whether the new credential values already exist in the organisational
                        // unit and division.
                        let accountAlreadyExists = false;
    
                        for(let i = 0; i < result.length; i++) {

                            // Array of account credentials that the user has access to.
                            let accounts = result[i].divisions.accounts;
        
                            for(let j = 0; j < accounts.length; j++) {

                                // Gets the name and username of account j.
                                let account_name_j = accounts[j].name;
                                let account_username_j = accounts[j].username;
        
                                // If the given new account name and username is equivalent to that of account j,
                                // i.e. the new account name and username already exist in the given organisational
                                // unit and division, and if the old account name and username is not the same as
                                // the new account name and username, then we set the accountAlreadyExists status
                                // to true.
                                if(newAccountName === account_name_j && newAccountUsername === account_username_j
                                    && oldAccountName !== newAccountName && oldAccountUsername !== newAccountUsername) {
                                    accountAlreadyExists = true;
                                }
                            }
                        }
    
                        // If the new account name and username does not already exist in the organisational unit
                        // and division, then we proceed with the update.
                        if(!accountAlreadyExists) {

                            try {

                                // Updates the credential values for the old account with the new account
                                // credential values.
                                let updateResult = await OrgUnit.updateOne(

                                    // Filters the documents by their organisational units, divisions
                                    // and account details.
                                    {
                                        name: orgUnit,
                                        'divisions.name': division,
                                        'divisions.accounts.name': oldAccountName,
                                        'divisions.accounts.username': oldAccountUsername,
                                        'divisions.accounts.password': oldAccountPassword
                                    },
            
                                    // Sets the values of the matching account in the account array.
                                    {
                                        $set: {
                                            'divisions.$[].accounts.$[acc].name': newAccountName,
                                            'divisions.$[].accounts.$[acc].username': newAccountUsername,
                                            'divisions.$[].accounts.$[acc].password': newAccountPassword
                                        }
                                    },
            
                                    // Filters the accounts array by its current name, username and password.
                                    // If this is not done, the wrong account might be updated.
                                    {
                                        arrayFilters: [{
                                            'acc.name': oldAccountName,
                                            'acc.username': oldAccountUsername,
                                            'acc.password': oldAccountPassword
                                        }]
                                    }
                                );
            
                                console.log(updateResult);
            
                                // If one or more accounts have been modified, that means we have
                                // updated an account's credential value(s).
                                if(updateResult.modifiedCount > 0) {
                                    res.send({
                                        message: 'Updated credential.'
                                    });
                                }
                                else {

                                    // If account's credential value(s) was/were updated, then we
                                    // send back an error message.
                                    res.status(403).send({
                                        error: 'No new credential values were entered. Nothing was updated.'
                                    });
                                }
            
                            }
                            catch(error) {
                                console.log(error);
                                res.status(500).send({
                                    error: 'Error occurred when attempting to update the credential.'
                                });
                            }
                        }
                        else {

                            // If the new account name and username already exists in the organisational unit
                            // and division, then we send back an error message.

                            res.status(403).send({
                                error: `The username '${newAccountUsername}' is already being used for the ${newAccountName} account in this ${orgUnit} ${division} division.`
                            });
                        }
                    }
                }
                else {

                    // If the user does not have a management or admin role, we send back an error message.
                    res.status(403).send({
                        error: 'Invalid role. You are not authorized to update credentials.'
                    });
                }
    
            }
            catch(error) {
                console.log(error);
                res.status(500).send({
                    error: 'Error occurred when attempting to add new credential.'
                });
            }
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
