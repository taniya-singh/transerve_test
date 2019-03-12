var userMdl =  require('../../models/users.js')
var songlistMdl =  require('../../models/songlist.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var config =  require('../../config/config.json')
var stripe = require("stripe")("sk_test_4tF0KWX6yPNO8udfwQag7aEM");
var _ =  require('underscore')
var fs  =  require('fs')

// login start=========================================
var loginAction  = function(req,res)
{
	if(req.body.email && req.body.email!="")
	{
		var email = req.body.email.toString().trim()
	}
	else
	{
		 return res.json(jsend.failure('Please Enter Email'))
	}

	if(req.body.password && req.body.password!="")
	{
		var password = req.body.password.toString()
	}
	else
	{
		 return res.json(jsend.failure('Please Enter Password'))
	}

	if(req.body.latitude && req.body.latitude!="")
	{
		var latitude = req.body.latitude.toString().trim()
	}
	else
	{
		var latitude = "0.0"
	}

	if(req.body.longitude && req.body.longitude!="")
	{
		var longitude = req.body.longitude.toString().trim()
	}
	else
	{
		var longitude = "0.0"
	}

	if(req.body.device_type && req.body.device_type!="")
	{
		var device_type = req.body.device_type.toString().trim()
	}
	else
	{
		device_type =""
	}

	if(req.body.device_token && req.body.device_token!="")
	{
		var device_token = req.body.device_token.toString().trim()
	}
	else
	{
		device_token = ""
	}

	userMdl.find({$and:[{"email":email},{"password":password}]}).exec(
		function(err,data){
				if(err) throw err ;

				if(data.length<1)
				{
					return res.json(jsend.failure('Wrong Email Or Password'))
				}
				else
				{
					delete data[0].token
					if(data[0].status==null || data[0].status==false || data[0].status!=true)
					{
						return res.json(jsend.failure('Please Confirm Your Account'))
					}

					var token = "";
					var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
					for (var i = 0; i < 14; i++)
					{
					  token += possible.charAt(Math.floor(Math.random() * possible.length));
					}

					userMdl.update({_id:data[0]._id},{$set:{'token':token}}).exec((err,udata)=>{
					 	 if(err) throw err ;
						return res.json(jsend.success({"token":token,"fname":data[0].firstname,"lname":data[0].lastname,"location":{"latitude":latitude,"longitude":longitude},
						"device":{"device_type":device_type,"device_token":device_token}},'logged in successfully'))
					})
				}
		}
	)
}


// register start=========================================
var registerAction = function(req,res){

	if(req.body.email &&  req.body.email!="")
	{
		var email = req.body.email.toString().trim().toLowerCase()
	}
	else
	{
		return res.json(jsend.failure('Please Enter Email'))
 	}

	if(req.body.fname &&  req.body.fname!="")
	{
		var fname = req.body.fname.toString().trim().toLowerCase()
	}
	else
	{
		var fname =""
	}

	if(req.body.lname &&  req.body.lname!="")
	{
		var lname = req.body.lname.toString().trim()
	}
	else
	{
		var lname =""
	}


	if(req.body.phone &&  req.body.phone!="")
	{
		var phone = req.body.phone.toString().trim()
	}
	else
	{
		var phone =""
	}

	if(req.body.password && req.body.password!="")
	{
		var password = req.body.password.toString().trim()
	}
	else
	{
		return res.json(jsend.failure('Password is Required'))
	}

	if(req.body.latitude && req.body.latitude!="")
	{
		var latitude = req.body.latitude.toString().trim()
	}
	else
	{
		var latitude="0.0";
	}

	if(req.body.longitude && req.body.longitude!="")
	{
		var longitude = req.body.longitude.toString().trim()
	}
	else
	{
		var longitude = "0.0"
	}

	if(req.body.device_type && req.body.device_type!="")
	{
		var device_type = req.body.device_type.toString().trim()
	}
	else
	{
		device_type =""
	}

	if(req.body.device_token && req.body.device_token!="")
	{
		var device_token = req.body.device_token.toString().trim()
	}
	else
	{
		device_token = ""
	}
	userMdl.find({"email":email}).limit(1).exec(function(err,userdata){
		if(err) throw err ;
		if(userdata.length>0)
		{
			res.json(jsend.failure('Email Already Registered'))
			return
		}
		else
		{
			var token = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for (var i = 0; i < 20; i++)
			{
				token += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			var confirmCode = token

			var promoCode = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
			for (var i = 0; i < 6; i++)
			{
				promoCode += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			var newuser = new userMdl({
				"email":email,
				"firstname":fname,
				"lastname":lname,
				"phone":phone,
				"promoCode":promoCode,
				"password":password,
				"register_type":"nm",
				"location":{"latitude":latitude,"longitude":longitude},
				"device":{"device_type":device_type,"device_token":device_token},
				"confirmCode":confirmCode,
				"token":token
			})


			var confirmAccountLink = config.confirmUserUrl + 'user/confirm-account/' + confirmCode
			let mailOptions = {
				from: 'Piyushkapoor786@gmail.com',
				to:  req.body.email,
				subject: 'Confirm Account on BandApp',
				html: 'Please click the following link to cofirm the account <p><a href="'+confirmAccountLink+'">'+confirmAccountLink+'</a></p>'
			};
			emailtransport.sendMail(mailOptions, (error, info) => {
				if (error) {
					return console.log(error);
				}
				userMdl.update({'_id':data[0]._id},{$set:{"recovertoken":recovertoken}}).exec((err,tokendata)=>{
					if(err) throw err ;
				})
			});
			newuser.save()
			setTimeout(function(){ createStripeAccount(token , res , fname , latitude , longitude , device_type , device_token);
 			}, 3000);
		}
	})
}


// logout start=========================================
var logoutAction = function(req,res){

	if(req.body.token || req.body.token!="")
	{
		var token = req.body.token
		userMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			userMdl.update({'token':token},{$unset:{'token':null}}).exec(
				(err,data) =>
				{
					if(err) throw err ;
					res.json(jsend.success([],'Successfully Logged Out'))
					return
				}
			)
		})
	}
	else
	{
		res.json(jsend.failure("No Token Found"))
		return
	}
}

// Info start=========================================
var infoAction = function(req,res){
	if(req.body.token && req.body.token !="")
	{
		var token = req.body.token
		var image = '';
		var social = false ;
		userMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(data[0].socialId)
			{
				social = true ;
			}

			if(data[0].image == '')
			{
				 image = data[0].image_url
			}
			else {
				image = data[0].image
			}

			var maindata = {
				"email":data[0].email,
				"image": image,
				"fname":data[0].firstname,
				"lname":data[0].lastname,
				"phone":data[0].phone,
				"address1":data[0].address1,
				"address2":data[0].address2,
				"city":data[0].city,
				"state":data[0].state,
				"zipcode":data[0].zipcode,
				"status":data[0].status,
				"location":data[0].location,
				"promoCode":data[0].promoCode,
				"password": data[0].password,
				"social": social,
				"addedPromoCode":data[0].addedPromoCode ? data[0].addedPromoCode : false
			}

			res.json(jsend.success(maindata))
			return
		})
	}
	else
	{
		res.json(jsend.failure("No Token Found"))
		return
	}
}

// change-password start=========================================
var changePasswordAction = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		userMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.opass && req.body.opass!="")
			{
				var opass = req.body.opass.toString().trim()
			}
			else
			{
				res.json(jsend.failure('Old Password Is Required'))
				return
			}

			if(req.body.npass && req.body.npass!="")
			{
				var npass = req.body.npass.toString().trim()
			}
			else
			{
				res.json(jsend.failure('New Password Is Required'))
				return
			}

			if(data[0].password != req.body.opass)
			{
				res.json(jsend.failure('Incorrect Old Password'))
				return
			}

			userMdl.update({'token':token},{$set:{'password':npass}}).exec(
				function(err,data){
					if(err) throw err ;
					res.json(jsend.success({},'Password Changed Successfully'))
					return
				}
			)
		})
	}
	else
	{
		res.json(jsend.failure("No Token Found"))
	}
	return
}

//forget password action =========================
var forgetPasswordAction =  function(req,res)
{
	if(req.body.email && req.body.email!="")
	{
		var email = req.body.email.toString().toLowerCase().trim()
	}
	else
	{
		res.json(jsend.failure('Email Is Required'))
		return
	}

	var recoverCode = Math.floor(Math.random()*1000000)
	userMdl.find({'email':email}).exec(function(err,data){
		if(err) throw err

		if(data.length<1)
		{
			res.json(jsend.failure('No Such User Registered'))
			return
		}


		if(data[0].status==null || data[0].status==false || data[0].status!=true)
		{
			res.json(jsend.failure('Please Confirm Your Account In Email'))
			return
		}

		let mailOptions = {
			from: 'Piyushkapoor786@gmail.com',
			to:  req.body.email,
			subject: 'Forgot Password BandApp',
			html: 'Your Forget password code is <h1>'+recoverCode+'</h1>'
		};

		emailtransport.sendMail(mailOptions, (error, info) => {
			if (error) {
				return console.log(error);
			}
				if(err) throw err ;
			})
			userMdl.update({'_id':data[0]._id},{$set:{"recoverCode":recoverCode}}).exec((err,tokendata)=>{
		});

		res.json(jsend.success({'id':data[0]._id,'code':recoverCode},'Verification code is sent to your email id'))
	})
}


//change password action =========================
var changeRecoverPasswordAction =  function(req,res)
{
	if(req.body.id && req.body.id!="")
	{
		var id = req.body.id.toString().trim()
	}
	else
	{
		res.json(jsend.failure('User Id Is Required'))
		return
	}

	if(req.body.password && req.body.password!="")
	{
		var password = req.body.password.toString().toLowerCase().trim()
	}
	else
	{
		res.json(jsend.failure('Email Is Required'))
		return
	}

	userMdl.update({'_id':id},{$set:{"password":password}}).exec((err,tokendata)=>{
		if(err) throw err ;
		res.json(jsend.success({},'Password Changed Successfully '))
		return
	})

}


// social action =======================
var socialAction = function(req,res)
{

	if(req.body.email &&  req.body.email!="")
	{
		var email = req.body.email.toString().trim().toLowerCase()
	}
	else
	{
		var email = req.body.email.toString().trim().toLowerCase()
	}

	if(req.body.fname &&  req.body.fname!="")
	{
		var fname = req.body.fname.toString().trim().toLowerCase()
	}
	else
	{
		var fname =""
	}

	if(req.body.lname &&  req.body.lname!="")
	{
		var lname = req.body.lname.toString().trim().toLowerCase()
	}
	else
	{
		var lname =""
	}

	if(req.body.phone &&  req.body.phone!="")
	{
		var phone = req.body.phone.toString().trim().toLowerCase()
	}
	else
	{
		var phone = '';
	}

	if(req.body.image_url &&  req.body.image_url !="")
	{
		var image_url = req.body.image_url.toString().trim()
	}
	else
	{
		var image_url = '';
	}

	if(req.body.social_id &&  req.body.social_id!="")
	{
		var socialId = req.body.social_id.toString().trim()
	}
	else
	{
		res.json(jsend.failure('Social ID Is Required'))
		return
	}

	if(req.body.latitude && req.body.latitude!="")
	{
		var latitude = req.body.latitude.toString().trim()
	}
	else
	{
		var latitude = "0.0"
	}

	if(req.body.longitude && req.body.longitude!="")
	{
		var longitude = req.body.longitude.toString().trim()
	}
	else
	{
		var longitude = "0.0"
	}

	if(req.body.device_type && req.body.device_type!="")
	{
		var device_type = req.body.device_type.toString().trim()
	}
	else
	{
		device_type =""
	}

	if(req.body.device_token && req.body.device_token!="")
	{
		var device_token = req.body.device_token.toString().trim()
	}
	else
	{
		device_token = ""
	}

	if(req.body.register_type && req.body.register_type!="")
	{
		var register_type = req.body.register_type.toString().trim()
	}
	else
	{
		register_type = "wb"
	}

	userMdl.find({$or:[{"socialId":socialId},{"email":email}]}).limit(1).exec(function(err,userdata){
		if(err) throw err ;
		if(userdata.length>0)
		{
			var token = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for (var i = 0; i < 14; i++)
			{
				token += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			userMdl.update({_id:userdata[0]._id},{$set:{'token':token}}).exec((err,data)=>{
				if(err) throw err ;
				return res.json(jsend.success({"token":token,"name":userdata[0].name,"location":userdata[0].location,"device":userdata[0].device},'logged in successfully'))
			})
		}
		else
		{
			var token = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for (var i = 0; i < 14; i++)
			{
				token += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			var promoCode = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
			for (var i = 0; i < 6; i++)
			{
				promoCode += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			var newuser = new userMdl({
				"email":email,
				"firstname":fname,
				"lastname":lname,
				"password":Math.floor(Math.random()*1000000000),
				"socialId":socialId,
				"promoCode":promoCode,
				"image_url":image_url,
				"status":true,
				"location":{"latitude":latitude,"longitude":longitude},
				"device":{"device_type":device_type,"device_token":device_token},
				"confirmCode":"",
				"registerType":register_type,
				"token":token
			})
			newuser.save()
			setTimeout(function(){ createStripeAccount(token , res , fname , latitude , longitude , device_type , device_token);
 			}, 3000);
		}
	})
}

createStripeAccount = function(usertoken, res , fname , latitude , longitude , device_type , device_token) {
	if(usertoken && usertoken!=""){
		var token = usertoken;
	}else{
		res.json(jsend.failure("No Token Found"))
			return
	}

	userMdl.find({"token":token}).exec(function(err,userDetail){
		if(err) throw err;
		if(userDetail.length==0){
			res.json(jsend.failure("Invalid Token"))
			return
		}else{
			if(userDetail[0].stripeId=='' || !userDetail[0].stripeId){
				stripe.customers.create({
				  description: userDetail[0].email

				},function(err, customer) {
				  if(err) throw err;
				  if(customer.length==0){
				  	res.json(jsend.failure("User Not Created"))
					return
				  } else{
				  	userMdl.update({"token":token},{$set:{"stripeId":customer.id}},function(err,updated){
				  		if(err) throw err;
				  		if(updated.length==0){
				  			res.json(jsend.failure("User Not Updated"))
							return
				  		}
							else{
								res.json(jsend.success({'token':token,"fname":fname,"location":{"latitude":latitude,"longitude":longitude},
								"device":{"device_type":device_type,"device_token":device_token}},'successfully Registered'))
								return
				  		}
				  	})
				  }
				});
			}else{
				stripe.customers.retrieve(
				 userDetail[0].stripeId,
				  function(err, customer) {
				    if(err) throw err;
				    res.json(jsend.success(customer,'Retreived Successfully'))
					return
				  }
				);
			}
		}
	}, function(err){
		res.json(jsend.failure("Error"))
		return
	})
}

// update action =======================
var updateProfileAction = function(req,res)
{
	var updateData={}
	var social = false ;
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		userMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(data[0].socialId && data[0].socialId != "")
			{
				social = true ;
			}

			updateData.social = social ;

			if(req.body.firstname &&  req.body.firstname!="")
			{
				updateData.firstname = req.body.firstname.toString().trim().toLowerCase()
			}

			if(req.body.lastname &&  req.body.lastname!="")
			{
				updateData.lastname = req.body.lastname.toString().trim().toLowerCase()
			}

			if(req.body.phone &&  req.body.phone!="")
			{
				updateData.phone = req.body.phone.toString().trim().toLowerCase()
			}

			if(req.body.address1 &&  req.body.address1!="")
			{
				updateData.address1 = req.body.address1.toString().trim()
			}

			if(req.body.address2 &&  req.body.address2!="")
			{
				updateData.address2 = req.body.address2.toString().trim()
			}

			if(req.body.city &&  req.body.city!="")
			{
				updateData.city = req.body.city.toString().trim()
			}

			if(req.body.state &&  req.body.state!="")
			{
				updateData.state = req.body.state.toString().trim()
			}

			if(req.body.zipcode &&  req.body.zipcode!="")
			{
				updateData.zipcode = req.body.zipcode.toString().trim()
			}


			userMdl.find({'token':token}).exec(function(err,data){
				if(err) throw err ;

				if( data[0].email != req.body.email )
				{

					var conftoken = "";
					var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
					for (var i = 0; i < 20; i++)
					{
						conftoken += possible.charAt(Math.floor(Math.random() * possible.length));
					}
					var confirmCode = conftoken;
					var confirmAccountLink = config.confirmUserUrl + 'user/confirm-account/' + confirmCode ;
					let mailOptions = {
						from: 'developer.bandapp@gmail.com',
						to:  req.body.email,
						subject: 'Confirm Account on BandApp',
						html: 'Please click the following link to cofirm the gmail account <p><a href="'+confirmAccountLink+'">'+confirmAccountLink+'</a></p>'
					};
					emailtransport.sendMail(mailOptions, (error, info) => {
						if (error) {
							return console.log(error);
						}
					});
					updateData.confirmCode = confirmCode ;
				}
				if(data.length<1)
				{
					res.json(jsend.failure('Token Expired'))
					return
				}
				if(req.files && req.files.length>0)
				{

						if(req.files[0].size==0)
						{
							res.json(jsend.failure("Invalid Image"))
							return
						}
						var extarr = ['jpg','jpeg','png']
						var realext = req.files[0].originalname.split('.')
						var realext = realext[realext.length-1].toLowerCase();
						if(extarr.indexOf(realext)==-1)
						{
							res.json(jsend.failure("Not a Valid Format"))
							return
						}
						else
						{
							var usersrc = req.files[0].destination+"user-avtar/"+data[0]._id+(Math.random()*1000000)+"."+realext ;
							fs.renameSync(req.files[0].path,usersrc)
							userMdl.update({'token':token},{'image':usersrc}).exec(function(err,data){
								if(err) throw err ;
							})
						}
				}
				userMdl.update({'token':token},{$set:updateData}).exec(function(err,udata){
						if(err) throw err ;

						userMdl.find({'token':token}).exec(function(err,data){
						if(err) throw err ;
							res.json(jsend.success(data[0],'Updated Successfully'))
						})
				})
			})
		})
	}
	else
	{
		res.json(jsend.failure('Token Is Required'))
		return
	}
}

var updateLatLongAction=function(req,res){
	if(req.body.token &&  req.body.token!=""){
		var token=req.body.token;
		if(req.body.latitude && req.body.latitude!="")
		{
			var latitude = req.body.latitude.toString().trim()
		}
		if(req.body.longitude && req.body.longitude!="")
		{
			var longitude = req.body.longitude.toString().trim()
		}
		if(req.body.device_type && req.body.device_type!="")
		{
			var device_type = req.body.device_type.toString().trim()
		}
		if(req.body.device_token && req.body.device_token!="")
		{
			var device_token = req.body.device_token.toString().trim()
		}
		userMdl.update({token:token},{$set:{"location.latitude":latitude,"location.longitude":longitude}},function(err,data){
			if(err){
				res.json(jsend.failure('Error'))
			}else{
				if(device_token!=undefined){
					userMdl.update({token:tok},{$set:{"device.deviceType":device_type,"device.deviceToken":device_token}},function(err,deviceupdation){
						if(err){
							res.json(jsend.failure('Error'))
						}else{
							res.json(jsend.success([],'Updated Successfully'))
						}
					})
				}else{
					res.json(jsend.success([],'Updated Successfully'))
				}
			}
		})
	}
	else{
		res.json(jsend.failure('Token Is Required'))
		return
	}
}


// confirm account action ===================
var confirmAccountAction = function(req,res)
{
	if(req.params.code &&  req.params.code!="")
	{
		var code = req.params.code.toString()
	}
	else
	{
		res.json(jsend.failure('Code is required'))
		return
	}
	userMdl.find({'confirmCode':code}).limit(1).exec(function(err,userdata){
			if(err) throw err
			if(userdata.length<1)
			{
				res.render('account-confirmed',{message:'Invalid Code'})
				return
			}
			if(userdata[0].status && userdata[0].status==true)
			{
				res.render('account-confirmed',{message:'Account already Confirmed'})
				return
			}
			userMdl.update({_id:userdata[0]._id},{$set:{'status':true}}).exec((err,data)=>{ if(err){ throw err ;}})
			res.render('account-confirmed',{message:'Account Succesfully Confirmed'})
			return
	})
}


var genreAction=function(req,res){
	if(req.body.token &&  req.body.token!=""){
		var token=req.body.token;


		    songlistMdl.find({},{'genre':1}).sort({'genre':1}).exec(function(err,data){
				if(err) throw err ;
				data = _.groupBy(data,'genre')
				data =  _.map(data,function(obj,key){
					return { "name":key,"occ":obj.length }
				})
				data = _.sortBy(data,function(obj){ return obj['occ']; })
				data=data.reverse()
				data = _.map(data,function(obj){ return obj['name'] ;})
				res.json(jsend.success(data))
				return
			})

	}
	else{
		res.json(jsend.failure('Token Is Required'))
		return
	}
}




var user = {
	'login':loginAction,
	'register':registerAction,
	'logout':logoutAction,
	'info':infoAction,
	'confirm':confirmAccountAction,
	'changePassword':changePasswordAction,
	'forgetPassword':forgetPasswordAction,
	'changeRecoverPassword':changeRecoverPasswordAction,
	'social':socialAction,
	'updateProfile':updateProfileAction,
	'updateLatLong':updateLatLongAction,
	'genre':genreAction
}

module.exports = user
