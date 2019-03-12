var database = require('../config/database');
var Schema = database.Mongoose.Schema

var playedSchema = new Schema({
 eventId :{type:Schema.Types.ObjectId, required: true},
 songId :{type:Schema.Types.ObjectId, required: true},
 created_at : {type : Date, default: Date.now},
})
module.exports = database.Mongoose.model('played',playedSchema)
