var database = require('../config/database');
var Schema = database.Mongoose.Schema

var EventSchema = new Schema({
 bandId : {type:Schema.Types.ObjectId, required: true, trim: true},
 playlistId : {type:Schema.Types.ObjectId, required: false, trim: true},
 eventDate :{type:Date, required: true, trim: true},
 startTime:{type:String,required:false},
 endTime : {type:String, required: true },
 hourspan : {type:String, required: true },
 started: {type:Boolean, required: false, default :false },
 ended: {type:Boolean, required: false, default :false },
 evaluated: {type:Boolean, required: false, default :false },
 is_deleted:{type:Boolean,required:true,default:false},
 venue : {
	name:{type:String, required: true },
	address:{type:String, required: true }
 },
 location:{
	latitude:{type:String, required: true},
	longitude:{type:String, required: true},
 },
 created_at : {type : Date, default: Date.now}
})
module.exports = database.Mongoose.model('events',EventSchema)
