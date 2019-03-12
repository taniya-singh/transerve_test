var database = require('../config/database');
var Schema = database.Mongoose.Schema

var RequestSchema = new Schema({
 userId :{type:Schema.Types.ObjectId, required: true},
 eventId :{type:Schema.Types.ObjectId, required: true},
 songId :{type:Schema.Types.ObjectId, required: true},
 bandId :{type:Schema.Types.ObjectId, required: true},
 credits :{type:Number, required: true, default:0 },
 created_at : {type : Date, default: Date.now}
})
module.exports = database.Mongoose.model('requests',RequestSchema)
