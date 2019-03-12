var database = require('../config/database');
var Schema = database.Mongoose.Schema

var adminSchema = new Schema({
 email :{type:String, required: true, trim: true},
 firstname : {type:String},
 lastname : {type:String, trim: true},
 password : {type:String, required: true },
 token : { type:String, required:true,default:null },
 type: { type:String },
 stripe_accountId:{type:String,required:false,default:''},
 created_at : {type : Date, default: Date.now}
},{collection:'admin_details'})
module.exports = database.Mongoose.model('admin_details',adminSchema)
