var database = require('../config/database');
var Schema = database.Mongoose.Schema

var SongSchema = new Schema({
 track :{type:String, required: true, trim: true},
 artist : {type:String,required: false, trim: true},
 collectionName : {type:String,required: false, trim: true},
 genre : {type:String,required: false, trim: true},
 image : {type:String },
 playlistId : {type:Schema.Types.ObjectId, required: true },
 requested : {type:Boolean, required: false, default: false },
 created_at : {type : Date, default: Date.now},
 is_deleted : {type:Boolean,default:false}
})
module.exports = database.Mongoose.model('songs',SongSchema)
