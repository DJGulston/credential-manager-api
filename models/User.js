const mongoose = require('mongoose');

/**
 * MongoDB Schema for the User document in the
 * Credentials database.
 */
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: false,
        default: 'normal'
    }
});

module.exports = mongoose.model('User', userSchema);

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
