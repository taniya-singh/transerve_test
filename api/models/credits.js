var database = require('../config/database');
var Schema = database.Mongoose.Schema

var CreditSchema = new Schema({
 userId :{type:Schema.Types.ObjectId, required: true},
 creditCount :{type:Number, required: true, default:0 },
 created_at : {type : Date, default: Date.now}
})
module.exports = database.Mongoose.model('credits',CreditSchema)
