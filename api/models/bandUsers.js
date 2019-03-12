var database = require('../config/database');
var Schema = database.Mongoose.Schema

var BandSchema = new Schema({
 bandId:{type:Schema.Types.ObjectId, required: true, trim: true},
 email :{type:String, required: true, trim: true},
 name : {type:String,required: false, trim: true},
 instrument : {type:String,required: false, trim: true},
 image_url : {type:String, required: false, trim: true},
 image : {type:String,required: false, trim: true,default:''},
 role : {type:String,required: false, trim: true, default:'manager'} ,
 password : {type:String, required: true },
 token : { type:String, required: false },
 status: { type:Boolean, required: true, default:false },
 socialId: { type:String, required: false },
 recoverCode:{type:String, required: false},
 location:{
	latitude:{type:String, required: true},
	longitude:{type:String, required: true},
 },
 bank_details:{
	account_holder_name :{type:String, required: false},
	account_number:{type:String, required: false},
  routing_number:{type:String, required: false}
 },
 device: {
	deviceToken:{ type:String, required: false },
	deviceType:{ type:String, required: false , enum : ['android','ios','web'], default:'web'},
	},
 register_type : {type:String, required:false, enum : ['fb','gp','nm']},
 register_method : {type:String, required:false, enum : ['direct','indirect'], default:'direct'},
 confirmCode : {type:String, required:false},
 created_at : {type : Date, default: Date.now},
 is_deleted:{type:Boolean,default:false,required:true},
 stripe_accountId:{type:String,required:false,default:''},
 stripe_customerId:{type:String,required:false,default:''},
 bank_account_token:{type:String,required:false,default:''}
})
module.exports = database.Mongoose.model('bandusers',BandSchema)
