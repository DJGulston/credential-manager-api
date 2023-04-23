const User = require('../models/User.js');
const OrgUnit = require('../models/OrganisationalUnit.js');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Put request that updates a chosen user's role.
 */
exports.updateRole = async (req, res) => {

    try {

        // Obtains the ID of the user whose role we wish to update.
        const userId = req.body.user_id;

        // Obtains the new role that we wish to assign to the user.
        const newRole = req.body.new_role;

        const auth = req.headers['authorization'];
        const token = auth.split(' ')[1];

        const user = jwt.verify(token, JWT_SECRET);

        try {

            // Obtains the ID of the user who is logged in.
            const adminId = user._id;

            // Obtains the user details of the logged in user.
            let adminUserResult = await User.findOne({_id: adminId}, {password: false});

            // Obtains the logged in user's role.
            const adminRole = adminUserResult.role;

            // If the logged in user is an admin, we proceed with the role change.
            if(adminRole === 'admin') {

                // If the new role is not a normal, management or admin role, then we
                // an error message is sent back indicating that the given role is an
                // invalid role.
                if(newRole !== 'normal' && newRole !== 'management' && newRole !== 'admin') {
                    res.status(403).send({
                        error: `Cannot update user role. '${newRole}' is not a valid role.`
                    });
                }
                else {
                    // Changes the user role.
                    const result = await User.updateOne(

                        // Filters on the given user ID.
                        {
                            _id: userId
                        },

                        // Sets the role of the user.
                        {
                            $set: {
                                role: newRole
                            }
                        }
                    );

                    console.log(result);

                    // Sends a success message back once the role has been updated.
                    res.send({
                        message: `User role has been updated to '${newRole}'.`
                    });
                }

            }
            else {

                // If the logged in user is not an admin, we send back an error message.
                res.status(403).send({
                    error: 'You are not an admin and are therefore unauthorized to update user roles.'
                });
            }
            
        }
        catch(error) {
            console.log(error);
            res.send(500).send({
                error: 'Error occurred when attempting to update user role.'
            });
        }
    }
    catch(error) {
        console.log(error);
        res.send(401).send({
            error: 'Bad JWT!'
        });
    }
}

/**
 * Post request that adds a given user's ID to a particular organisational unit
 * and division, and thus, grants that user access to that organisational
 * unit and division.
 */
exports.assignDivision = async (req, res) => {

    try {

        // Obtains the ID of the user who we wish to assign to a new division.
        const userId = req.body.user_id;

        // Obtains the organisational unit and division that we wish to assign
        // the user to.
        const orgUnit = req.body.organisational_unit;
        const division = req.body.division;

        const auth = req.headers['authorization'];
        const token = auth.split(' ')[1];

        const user = jwt.verify(token, JWT_SECRET);

        try {

            // Obtains the ID of the user who is logged in.
            const adminId = user._id;

            // Obtains the user details of the logged in user.
            let adminUserResult = await User.findOne({_id: adminId}, {password: false});

            // Obtains the logged in user's role.
            const adminRole = adminUserResult.role;

            // If the logged in user is an admin, we proceed with the
            // assignment of the user to a division.
            if(adminRole === 'admin') {

                // Obtains the organisational units, divisions and accounts filtered on
                // the admin's user ID and the given organisational unit and division.
                let adminResult = await OrgUnit.aggregate([

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
                    // user who is currently logged in, as well as documents that do
                    // not belong to the given organisational unit and division.
                    {
                        $match: {
                            'divisions.users': new mongoose.Types.ObjectId(adminId),
                            name: orgUnit,
                            'divisions.name': division
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
                    }

                ]);

                // If the result returns nothing, that means the logged in user (i.e. the admin)
                // does not belong to the given organisational unit and division.
                if(adminResult.length <= 0) {
                    res.status(403).send({
                        error: `You are not authorized to assign a user to the '${orgUnit} ${division}' division since you are not part of this division.`
                    });
                }
                else {

                    // If the result returns at least one organisational unit, that means the
                    // logged in user is part of the given organisational unit and division,
                    // and thus, we can proceed with the assignment of the given user to
                    // the given division.

                    // Obtains the organisational units, divisions and accounts filtered on the
                    // given user ID, organisational unit and division.
                    let userResult = await OrgUnit.aggregate([

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
                        // given user, as well as documents that do not belong to the
                        // given organisational unit and division.
                        {
                            $match: {
                                'divisions.users': new mongoose.Types.ObjectId(userId),
                                name: orgUnit,
                                'divisions.name': division
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
                        }

                    ]);

                    // If the result returns at least one organisational unit, that means that the
                    // given user ID already exists in given organisational unit and division, and
                    // thus, the user has already been assigned to the division before.
                    if(userResult.length > 0) {
                        res.status(403).send({
                            error: `Cannot assign user. User is already assigned to the '${orgUnit} ${division}' division.`
                        });
                    }
                    else {

                        // If the result returns nothing, that means that the given user has not yet been
                        // assigned to the given division, and thus, we proceed with the assignment
                        // of the given user to the given division.
                        let updateResult = await OrgUnit.updateOne(

                            // Filters on the given organisational unit and division.
                            {
                                name: orgUnit,
                                'divisions.name': division
                            },

                            // Adds the given user's ID to the users array within the filtered division.
                            {
                                $push: {
                                    'divisions.$.users': new mongoose.Types.ObjectId(userId)
                                }
                            }

                        );

                        console.log(updateResult);

                        // Success message is sent back to the user once the user is
                        // assigned to the division.
                        res.send({
                            message: `User has been assigned to the '${orgUnit} ${division}' division.`
                        });
                    }
                }
            }
            else {

                // If the logged in user does not have an 'admin' role, we send
                // back an error message.
                res.status(403).send({
                    error: 'You are not an admin and are therefore unauthorized to assign users to divisions.'
                });
            }
            
        }
        catch(error) {
            console.log(error);
            res.send(500).send({
                error: 'Error occurred when attempting to assign user division.'
            });
        }
    }
    catch(error) {
        console.log(error);
        res.send(401).send({
            error: 'Bad JWT!'
        });
    }
}

/**
 * Delete request that removes a given user's ID from a particular organisational
 * unit and division, and thus, takes away that user's access to that
 * organisational unit and division.
 */
exports.unassignDivision = async (req, res) => {
    try {

        // Obtains the ID of the user who we wish to unassign/remove
        // from an organisational unit and division.
        const userId = req.body.user_id;

        // Obtains the organisational unit and division that we wish
        // to remove/unassign the user from.
        const orgUnit = req.body.organisational_unit;
        const division = req.body.division;

        const auth = req.headers['authorization'];
        const token = auth.split(' ')[1];

        const user = jwt.verify(token, JWT_SECRET);

        try {

            // Obtains the ID of the user who is logged in.
            const adminId = user._id;

            // Obtains the user details of the logged in user.
            let adminUserResult = await User.findOne({_id: adminId}, {password: false});

            // Obtains the logged in user's role.
            const adminRole = adminUserResult.role;

            // If the logged in user is an admin, we proceed with the
            // unassignment of the user from a division.
            if(adminRole === 'admin') {

                // Obtains the organisational units, divisions and accounts filtered on
                // the admin's user ID and the given organisational unit and division.
                let adminResult = await OrgUnit.aggregate([

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
                    // user who is currently logged in, as well as documents that do
                    // not belong to the given organisational unit and division.
                    {
                        $match: {
                            'divisions.users': new mongoose.Types.ObjectId(adminId),
                            name: orgUnit,
                            'divisions.name': division
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
                    }
                ]);

                // If the result returns nothing, that means the logged in user (i.e. the admin)
                // does not belong to the given organisational unit and division.
                if(adminResult.length <= 0) {
                    res.status(403).send({
                        error: `You are not authorized to unassign a user from the '${orgUnit} ${division}' division since you are not part of this division.`
                    });
                }
                else {

                    // If the result returns at least one organisational unit, that means the
                    // logged in user is part of the given organisational unit and division,
                    // and thus, we can proceed with the unassignment of the given user from
                    // the given division.

                    // Obtains the organisational units, divisions and accounts filtered on the
                    // given user ID, organisational unit and division.
                    let userResult = await OrgUnit.aggregate([

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
                        // given user, as well as documents that do not belong to the
                        // given organisational unit and division.
                        {
                            $match: {
                                'divisions.users': new mongoose.Types.ObjectId(userId),
                                name: orgUnit,
                                'divisions.name': division
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
                        }
                    ]);

                    // If the result returns nothing, that means that the given user does not
                    // belong to the given organisational unit and division, and thus, they are
                    // already unassigned from the given given organisational unit and division.
                    if(userResult.length <= 0) {
                        res.status(403).send({
                            error: `Cannot unassign user. User does not belong to the '${orgUnit} ${division}' division.`
                        });
                    }
                    else {

                        // If the result returns at least one organisational unit, that means
                        // that the given user belongs to the given organisational unit and
                        // division, and thus, we can proceed with the unassignment of the
                        // given user from the division.

                        // Removes the given user's ID from the given organisational unit
                        // and division.
                        let updateResult = await OrgUnit.updateOne(
                            
                            // Filters on the given user's ID, organisational unit
                            // and division.
                            {
                                name: orgUnit,
                                'divisions.users': new mongoose.Types.ObjectId(userId),
                                'divisions.name': division
                            },

                            // Removes the given user's ID from the filtered users array.
                            {
                                $pull: {
                                    'divisions.$.users': new mongoose.Types.ObjectId(userId)
                                }
                            }
                        );

                        console.log(updateResult);

                        // Success message sent back once the user has been unassigned/removed
                        // from the given division.
                        res.send({
                            message: `User has been unassigned from the '${orgUnit} ${division}' division.`
                        });
                    }
                }
            }
            else {

                // If the user does not have an 'admin' role, we send back an error message.
                res.status(403).send({
                    error: 'You are not an admin and are therefore unauthorized to unassign users from divisions.'
                });
            }
            
        }
        catch(error) {
            console.log(error);
            res.send(500).send({
                error: 'Error occurred when attempting to unassign user division.'
            });
        }
    }
    catch(error) {
        console.log(error);
        res.send(401).send({
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
