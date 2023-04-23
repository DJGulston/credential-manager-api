const User = require('../models/User.js');
const OrgUnit = require('../models/OrganisationalUnit.js');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Secret key for the JWT authentication.
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Post request that gets a list of all organisational units and
 * divisions that the user, who is logged in, belongs to.
 */
exports.getOrgUnitsAndDivisions = async (req, res) => {

    try {

        // Authorization header obtained.
        const auth = req.headers['authorization'];
        
        // Token obtained from authorization header.
        const token = auth.split(' ')[1];

        // Token is decoded into user JSON object.
        const user = jwt.verify(token, JWT_SECRET);
    
        try {

            // Obtains the ID of the user who is logged in.
            const userId = user._id;

            // Obtains all the organisational units and divisions assigned to
            // the user who is logged in.
            let orgsResult = await OrgUnit.aggregate([

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

                // Only the organisational unit name and the division names are returned
                // as output.
                {
                    $project: {
                        name: 1,
                        'divisions.name': 1
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
                            $push: '$divisions.name'
                        }
                    }
                }
            ]);

            // Obtains the details of the user who is logged in.
            // This ensures we get the most up-to-date details for that user.
            let userResult = await User.findOne({_id: userId}, {password: false});

            // Combines the user result details and the organisational units into
            // a single object.
            let result = {
                _id: userId,
                username: userResult.username,
                role: userResult.role,
                organisational_units: orgsResult
            };

            res.send(result);
        }
        catch(error) {
            console.log(error);
            res.status(500).send({
                error: 'Something went wrong when retrieving the organisational units.'
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
 * Post requests that obtains a list of all users as well as all
 * the organisational units and divisions they each belong to.
 */
exports.getAllUsers = async (req, res) => {

    try {

        // Authorization header obtained.
        const auth = req.headers['authorization'];

        // Token obtained from authorization header.
        const token = auth.split(' ')[1];
    
        // Token is decoded into user JSON object.
        const user = jwt.verify(token, JWT_SECRET);

        // Obtains the details of the user who is logged in.
        // This ensures we get the most up-to-date details for that user.
        let userResult = await User.findOne({_id: user._id}, {password: false});

        // Checks that the user has a legitimate role, i.e. normal, management or admin.
        if(userResult.role === 'normal' || userResult.role === 'management' || userResult.role === 'admin') {
            try {

                // Stores the result of all users with their organisational units and divisions.
                let result = [];

                // Obtains all users and their details excluding their passwords.
                let usersResult = await User.find({}, {password: false});

                for(let i = 0; i < usersResult.length; i++) {

                    let userId = usersResult[i]._id;

                    // Obtains all the organisational units and divisions assigned to
                    // user i.
                    let orgsResult = await OrgUnit.aggregate([

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
    
                        // Filters out the documents that do not have the same ID as
                        // user i.
                        {
                            $match: {
                                'divisions.users': new mongoose.Types.ObjectId(userId)
                            }
                        },

                        // Only the organisational unit name and the division names are returned
                        // as output.
                        {
                            $project: {
                                name: 1,
                                'divisions.name': 1
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
                                    $push: '$divisions.name'
                                }
                            }
                        }
                    ]);

                    // Combines the user result details and the organisational units into
                    // a single object and adds it to the result array.
                    result.push({
                        _id: userId,
                        username: usersResult[i].username,
                        role: usersResult[i].role,
                        organisational_units: orgsResult
                    });
                }

                res.send(result);
            }
            catch(error) {
                console.log(error);
                res.status(500).send({
                    error: 'Error occurred while retrieving the users.'
                });
            }
        }
        else {
            res.status(403).send({
                error: 'You are not authorized to view the list of all users.'
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
