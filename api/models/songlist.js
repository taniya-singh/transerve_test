var database = require('../config/database');
var Schema = database.Mongoose.Schema

var SongListSchema = new Schema({
 bandId : {type:Schema.Types.ObjectId, required: true },
 track :{type:String, required: true, trim: true},
 artist : {type:String,required: false, trim: true},
 collectionName : {type:String,required: false, trim: true},
 genre : {type:String,required: false, trim: true},
 image : {type:String },
 is_deleted:{type:Boolean, required:false, trim:true, default:false }
})
module.exports = database.Mongoose.model('songlists',SongListSchema)
