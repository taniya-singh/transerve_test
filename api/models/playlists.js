var database = require('../config/database');
var Schema = database.Mongoose.Schema

var PlaylistSchema = new Schema({
 bandId: {type:Schema.Types.ObjectId,required: true, trim: true},
 playlistName : {type:String,required: true, trim: true},
 songs : {type:Array, required: false, default:[]},
 created_at : {type : Date, default: Date.now},
 is_deleted:{type:Boolean,default:false,required:true}

})
module.exports = database.Mongoose.model('playlists',PlaylistSchema)
