var fs  =  require('fs')
var bandMdl =  require('../../models/bands.js')
var bandUserMdl =  require('../../models/bandUsers.js')
var songlistMdl =  require('../../models/songlist.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var base64Img = require('base64-img');
var config =  require('../../config/config.json')
var _ =  require('underscore')


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


	bandUserMdl.find({$and:[{"email":email},{"password":password}]}).exec(function(err,data){
		if(err) throw err ;
		if(data.length<1)
		{
			return res.json(jsend.failure('Wrong Email Or Password'))
		}
		else
		{
			if(data[0].register_method=='indirect' && data[0].status==false)
				{
					data[0].status=true;

				}
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


			bandUserMdl.update({_id:data[0]._id},{$set:{'token':token,'status':true}}).exec((err,bdata)=>{
			 	if(err) throw err ;

				if(data[0].image){}else{ data[0].image='/uploads/banduser.png'   ;}

				var maindata = {
					"name":data[0].name,
					"role":data[0].role,
					"phone":data[0].phone,
					"email":data[0].email,
					"status":data[0].status,
					"location":data[0].location,
					"token":token
				}


				if(data[0].image){
					maindata["image"]=data[0].image
				}


				bandMdl.find({'_id':data[0]['bandId']}).exec(function(err,bdata){
					if(err) throw err ;
					maindata['bandImg']=bdata[0]['bandImg']
					maindata['bandName']=bdata[0]['bandName']
					return res.json(jsend.success(maindata,'Logged In Successfully'))
				})
			})
		}
	})
}

// register start=========================================
var registerAction = function(req,res){
	if(req.body.email &&  req.body.email!="")
	{
		var email = req.body.email.toString().trim()
	}
	else
	{
		return res.json(jsend.failure('Please Enter Email'))
 	}
	if(req.body.name &&  req.body.name!="")
	{
		var bandName = req.body.name.toString().trim()
	}
	else
	{
		var bandName = ''
	}

	if(req.body.phone &&  req.body.phone!="")
	{
		var phone = req.body.name.toString().trim()
	}
	else
	{
		var phone = ''
	}

	if(req.body.password && req.body.password!="")
	{
		var password = req.body.password.toString().trim()
	}
	else
	{
		return res.json(jsend.failure('Password Is Required'))
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
	bandUserMdl.find({"email":email}).limit(1).exec(function(err,banduser){
		if(err) throw err ;
		if(banduser.length>0)
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
			var newband = new bandMdl({
				"bandName":bandName,
			})
			newband.save()
			var newbanduser = new bandUserMdl({
				"phone":phone,
				"email":email,
				"bandId":newband['_id'],
				"password":password,
				"role":'manager',
				"register_type":"nm",
				"register_method":"direct",
				"location":{"latitude":latitude,"longitude":longitude},
				"device":{"device_type":device_type,"device_token":device_token},
				"confirmCode":confirmCode,
				"token":token
			})

			var confirmAccountLink = config.confirmUserUrl + 'band/confirm-account/' + confirmCode
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
				bandUserMdl.update({'_id':data[0]._id},{$set:{"recovertoken":recovertoken}}).exec((err,tokendata)=>{
					if(err) throw err ;
				})
			});

			newbanduser.save()
			res.json(jsend.success({'confirmCode':token},'Registered Successfully'))
			return
		}
	})
}

// logout start=========================================
var logoutAction = function(req,res){

	if(req.body.token || req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			bandUserMdl.update({'token':token},{$unset:{'token':null}}).exec(
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

// confirm account action ===================
var confirmAccountAction = function(req,res)
{
	if(req.body.code &&  req.body.code!="")
	{
		var code = req.body.code.toString()
	}
	else
	{
		res.json(jsend.failure('Code is Required'))
		return
	}

	bandUserMdl.find({'confirmCode':code}).limit(1).exec(function(err,banduser){
			if(err) throw err
			if(banduser.length<1)
			{
				res.json(jsend.failure('Invalid Code'))
				return
			}
			if(banduser[0].status && banduser[0].status==true)
			{
				res.json(jsend.success([],'Account Already Confirmed'))
				return
			}
			bandUserMdl.update({_id:v[0]._id},{$set:{'status':true}}).exec((err,data)=>{ if(err){ throw err ;}})
			res.json(jsend.success([],'Confirmed Successfully'))
			return
	})
}

// Info start=========================================
var infoAction = function(req,res){

	if(req.body.token && req.body.token !="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,data){
			var social = false ;
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			if(data[0].socialId && data[0].socialId != '')
			{
				social = true ;
			}
			if(data[0].image){}else{ data[0].image='/uploads/banduser.png'   ;}
			var maindata = {
				"name":data[0].name,
				"role":data[0].role,
				"image":data[0].image,
				"phone":data[0].phone,
				"email":data[0].email,
				"status":data[0].status,
				"location":data[0].location,
				"password" : data[0].password,
				"social" : social,
				"instrument" : data[0].instrument
			}
			bandMdl.find({'_id':data[0]['bandId']}).exec(function(err,bdata){
				if(err) throw err ;
				maindata['bandImg']=bdata[0]['bandImg']
				maindata['bandName']=bdata[0]['bandName']
				res.json(jsend.success(maindata))
				return
			})
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
		bandUserMdl.find({'token':token}).exec(function(err,data){
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

			bandUserMdl.update({'token':token},{$set:{'password':npass}}).exec(
				function(err,data){
					if(err) throw err ;
					res.json(jsend.success([],'Password Changed Successfully'))
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
	bandUserMdl.find({'email':email}).exec(function(err,data){
		if(err) throw err

		if(data.length<1)
		{
			res.json(jsend.failure('No Such Band Registered'))
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
			bandUserMdl.update({'_id':data[0]._id},{$set:{"recoverCode":recoverCode}}).exec((err,tokendata)=>{
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
		res.json(jsend.failure('Band Id Is Required'))
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

	bandUserMdl.update({'_id':id},{$set:{"password":password}}).exec((err,tokendata)=>{
		if(err) throw err ;
		res.json(jsend.success([],'Password Changed Successfully'))
		return
	})

}

// update action =======================
var updateProfileAction = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			var udata = {}
			var bdata = {}
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}


			if(req.body.bandname &&  req.body.bandname!="")
			{
				 bdata['bandName'] = req.body.bandname.toString().trim()
			}

			if(req.body.username &&  req.body.username!="")

			{
				udata['name'] = req.body.username.toString().trim()
			}

			if(req.body.phone &&  req.body.phone!="")
			{
				udata['phone'] = req.body.phone.toString().trim()
			}

			if(req.body.instrument &&  req.body.instrument!="")
			{
				udata['instrument'] = req.body.instrument.toString().trim()
			}


			bandUserMdl.find({'token':token}).exec(function(err,data){
				if(err) throw err ;
				if(data.length<1)
				{
					res.json(jsend.failure('Token Expired'))
					return
				}
				if(req.files && req.files.length>0)
				{
					req.files = _.groupBy(req.files,"fieldname")
					if(req.files.length!=0 && req.files.userimage!=undefined)
					{
						if(req.files.userimage[0].size==0)
						{
							res.json(jsend.failure("Invalid Image"))
							return
						}
						var extarr = ['jpg','jpeg','png']
						var realext = req.files.userimage[0].originalname.split('.')
						var realext = realext[realext.length-1].toLowerCase()
						if(extarr.indexOf(realext)==-1)
						{
							res.json(jsend.failure("Not a Valid Format"))
							return
						}
						else
						{
							var usersrc = req.files.userimage[0].destination+"user-avtar/"+data[0]._id+(Math.random()*1000000)+"."+realext ;
							fs.renameSync(req.files.userimage[0].path,usersrc)
							bandUserMdl.update({'token':token},{'image':usersrc}).exec(function(err,data){
								if(err) throw err ;
							})
						}
					}



					if(req.files.length!=0 && req.files.bandimage!=undefined)
					{
						var files = _.groupBy(req.files,"fieldname")
						if(req.files.bandimage[0].size==0)
						{
							res.json(jsend.failure("Invalid Image"))
							return
						}
						var extarr = ['jpg','jpeg','png']
						var realext = req.files.bandimage[0].originalname.split('.')
						var realext = realext[realext.length-1].toLowerCase()
						if(extarr.indexOf(realext)==-1)
						{
							res.json(jsend.failure("Not a Valid Format"))
							return
						}
						else
						{
							var bandsrc = req.files.bandimage[0].destination+"band-avtar/"+data[0]._id+(Math.random()*1000000)+"."+realext ;
							fs.renameSync(req.files.bandimage[0].path,bandsrc)
							bandMdl.update({'_id':data[0]['bandId']},{'bandImg':bandsrc}).exec(function(err,data){
								if(err) throw err ;
							})
						}
					}
				}

				bandMdl.update({'_id':data[0]['bandId']},{$set:bdata} ).exec(function(err,data){
						if(err) throw err ;
						bandUserMdl.update({'token':token},udata).exec(function(err,data){
							if(err) throw err ;


							bandUserMdl.find({'token':token}).exec(function(err,data){
								var social = false ;
								if(err) throw err ;
								if(data[0].image){}else{ data[0].image='/uploads/banduser.png'   ;}
								if(data[0].socialId && data[0].socialId != '')
								{
									social = true ;
								}
								var maindata = {
									"name":data[0].name,
									"role":data[0].role,
									"image":data[0].image,
									"phone":data[0].phone,
									"email":data[0].email,
									"status":data[0].status,
									"location":data[0].location,
									"password" : data[0].password,
									"social" : social,
									"instrument" : data[0].instrument
								}
								bandMdl.find({'_id':data[0]['bandId']}).exec(function(err,bdata){
									if(err) throw err ;
									maindata['bandImg']=bdata[0]['bandImg']
									maindata['bandName']=bdata[0]['bandName']
									res.json(jsend.success(maindata))
									return
								})
							})

						})
				})
			})
		})
	}
	else
	{
		res.json(jsend.failure('No Token Found'))
		return
	}
}

var updateImage = function (req,res){

	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,userdata){
			if(err) throw err ;
			var date=new Date().getTime();
			var dest=__dirname+"/../../uploads/";
			var name= userdata[0]._id+date;
			if(userdata.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

				if(req.body.bandImg && req.body.bandImg.length>0)
				{

					base64Img.img(req.body.bandImg, dest, name, function(err, filepath) {
						if(err) throw err;
							var dirarr= __dirname.split('/')
						dirarr.splice(dirarr.length-2,2)
						dirarr = dirarr.join('/')
						filepath=filepath.replace(dirarr,"")
						bandMdl.update({'_id':userdata[0]['bandId']},{$set:{'bandImg':filepath}} ).exec(function(err,data){
						if(err) throw err ;

								res.json(jsend.success(filepath));
						})
					});
				}

				if(req.body.userImg && req.body.userImg.length>0)
				{

					base64Img.img(req.body.userImg, dest, name, function(err, filepath) {
						if(err) throw err;
							var dirarr= __dirname.split('/')
						dirarr.splice(dirarr.length-2,2)
						dirarr = dirarr.join('/')
						filepath=filepath.replace(dirarr,"")
						console.log("/////",filepath)
						bandUserMdl.update({'_id':userdata[0]['_id']},{$set:{'image':filepath}} ).exec(function(err,data){
						if(err) throw err ;

								res.json(jsend.success(filepath));
						})
					});
				}


		})
	}
	else
	{
		res.json(jsend.failure('No Token Found'))
		return
	}
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
		res.json(jsend.failure('Email is required'))
		return
	}


	if(req.body.name &&  req.body.name!="")
	{
		var bandName = req.body.name.toString().trim().toLowerCase()
	}
	else
	{
		var bandName = ''
	}

	if(req.body.phone &&  req.body.phone!="")
	{
		var phone = req.body.phone.toString().trim()
	}
	else
	{
		var phone = ''
	}

	if(req.body.social_id &&  req.body.social_id!="")
	{
		var socialId = req.body.social_id.toString().trim()
	}
	else
	{
		res.json(jsend.failure('Social ID is required'))
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

	if(req.body.image_url &&  req.body.image_url !="")
	{
		var image_url = req.body.image_url.toString().trim()
	}
	else
	{
		var image_url = '';
	}

	if(req.body.register_type && req.body.register_type!="")
	{
		var register_type = req.body.register_type.toString().trim()
	}
	else
	{
		register_type = "wb"
	}
	bandUserMdl.find({$or:[{"socialId":socialId},{"email":email}]}).limit(1).exec(function(err,banduser){
		if(err) throw err ;
		if(banduser.length>0)
		{
			var token = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for (var i = 0; i < 14; i++)
			{
				token += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			bandUserMdl.update({_id:banduser[0]._id},{$set:{'token':token}}).exec((err,data)=>{
				if(err) throw err ;
				return res.json(jsend.success({"token":token},'logged in successfully'))
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
			var newband = new bandMdl({
				"bandName":bandName,
			})
			newband.save()
			var newbanduser = new bandUserMdl({
				"email":email,
				"bandId":newband['id'],
				"phone":phone,
				"role":'Manager',
				"image_url":image_url,
				"password":Math.floor(Math.random()*1000000000),
				"socialId":socialId,
				"status":true,
				"location":{"latitude":latitude,"longitude":longitude},
				"device":{"device_type":device_type,"device_token":device_token},
				"confirmCode":"",
				"register_type":register_type,
				"register_method":'direct',
				"token":token
			})
			newbanduser.save()
			res.json(jsend.success({'token':token},'successfully Registered'))
			return
		}
	})
}




// genre start=========================================
var genreAction = function(req,res){

	if(req.body.token || req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			songlistMdl.find({bandId:data[0]['bandId']},{'genre':1}).sort({'genre':1}).exec(function(err,data){
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
		})
	}
	else
	{
		res.json(jsend.failure("no token found"))
		return
	}
}




var band = {
	'login':loginAction,
	'register':registerAction,
	'logout':logoutAction,
	'info':infoAction,
	'confirm':confirmAccountAction,
	'changePassword':changePasswordAction,
	'forgetPassword':forgetPasswordAction,
	'changeRecoverPassword':changeRecoverPasswordAction,
	'updateProfile':updateProfileAction,
	'genre':genreAction,
	'social':socialAction,
	'updateImage':updateImage
}

module.exports = band
