var database = require('../config/database');
var Schema = database.Mongoose.Schema

var CommonSchema = new Schema({
 radius :{type:Number,required:true,default:0},
 is_deleted:{type:Boolean,default:false,required:true}
})
module.exports = database.Mongoose.model('common',CommonSchema)
