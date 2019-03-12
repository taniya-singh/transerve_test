var database = require('../config/database');
var Schema = database.Mongoose.Schema

var UserSchema = new Schema({
 email : {type:String, required: true, trim: true},
 image_url : {type:String, required: false, trim: true},
 firstname : {type:String,required: false, trim: true},
 lastname : {type:String,required: false, trim: true},
 image : {type:String,required: false, trim: true,default:''},
 phone : {type:String,required: false, trim: true},
 address1 : {type:String,required: false, trim: true},
 address2 : {type:String,required: false, trim: true},
 city : {type:String,required: false, trim: true},
 state : {type:String,required: false, trim: true},
 zipcode : {type:String,required: false, trim: true},
 password : {type:String, required: true },
 addedPromoCode : {type:Boolean, required: false, default:false },
 promoCode : {type:String, required: true },
 token : { type:String, required: false },
 stripeId : {type:String, required: false,default:'' },
 default_card:{type:String, required: false,default:''},
 default_card_token:{type:String, required: false,default:''},
 status: { type:Boolean, required: true, default:false },
 social: { type:Boolean, required: true, default:false },
 socialId: { type:String, required: false },
 recoverCode:{type:String, required: false},
 is_deleted:{type:Boolean,required:true,default:false},
 favorites:{type:Array,required:false,default:[]},
 cards:{type:Array,required:false,default:[]},
 location:{
	latitude:{type:String, required: true},
	longitude:{type:String, required: true},
	 },
 device: {
	deviceToken:{ type:String, required: false },
	deviceType:{ type:String, required: false , enum : ['android','ios','web'], default:'web'},
	},
 register_type : {type:String, required:false, enum : ['fb','gp','nm']},
 confirmCode : {type:String, required:false},
 created_at : {type : Date, default: Date.now}
})
module.exports = database.Mongoose.model('users',UserSchema)
