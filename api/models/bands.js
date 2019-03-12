var database = require('../config/database');
var Schema = database.Mongoose.Schema

var BandSchema = new Schema({
 bandName : {type:String,required: false, trim: true},
 bandImg:{type:String,required:false},
 created_at : {type : Date, default: Date.now},
 is_deleted:{type:Boolean,default:false,required:true}
})
module.exports = database.Mongoose.model('bands',BandSchema)
