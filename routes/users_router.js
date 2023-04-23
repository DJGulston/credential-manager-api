const router = require('express').Router();
const controller = require('../controllers/log.controller.js');
const loginRegisterController = require('../controllers/login_register.controller.js');
const normalUserController = require('../controllers/normal_user.controller.js');
const managementUserController = require('../controllers/management_user.controller.js');
const adminUserController = require('../controllers/admin_user.controller.js');

/**
 * Post requests that obtains a list of all users as well as all
 * the organisational units and divisions they each belong to.
 */
router.post('/all-users', controller.getAllUsers);

/**
 * Post request that gets a list of all organisational units and
 * divisions that the user, who is logged in, belongs to, as well
 * as their username and role.
 */
router.post('/orgs-and-divisions', controller.getOrgUnitsAndDivisions);

/**
 * Post request that logs the user in by obtaining a token.
 */
router.post('/login', loginRegisterController.loginUser);

/**
 * Post request that registers a new user with their given username
 * password.
 */
router.post('/register', loginRegisterController.registerUser);

/**
 * Post request that returns a list of all credentials that the user,
 * who is currently logged in, is assigned to.
 */
router.post('/view-credentials', normalUserController.viewCredentials);

/**
 * Post request that adds a new credential to a given organisational
 * unit and division.
 */
router.post('/add-credential', normalUserController.addCredential);

/**
 * Put request that updates any given details (account name, username and/or
 * password) for a particular credential.
 */
router.put('/update-credential', managementUserController.updateCredential);

/**
 * Put request that updates a chosen user's role.
 */
router.put('/update-role', adminUserController.updateRole);

/**
 * Post request that adds a given user's ID to a particular organisational unit
 * and division, and thus, grants that user access to that organisational
 * unit and division.
 */
router.post('/assign-division', adminUserController.assignDivision);

/**
 * Delete request that removes a given user's ID from a particular organisational
 * unit and division, and thus, takes away that user's access to that
 * organisational unit and division.
 */
router.delete('/unassign-division', adminUserController.unassignDivision);

module.exports = router;

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
