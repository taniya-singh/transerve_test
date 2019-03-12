var fs  =  require('fs')
var bandMdl =  require('../../models/bands.js')
var bandUserMdl =  require('../../models/bandUsers.js')
var _ =  require('underscore')

var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')

// Add start=========================================
var addAction = function(req,res){

	if(req.body.token || req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err ;
			if(banduser.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			if(req.body.email &&  req.body.email!="")
			{
				var email = req.body.email.toString().trim().toLowerCase()
			}
			else
			{
				return res.json(jsend.failure('please Enter email'))
		 	}
			if(req.body.role &&  req.body.role!="")
			{
				var role = req.body.role.toString().trim().toLowerCase()
			}
			else
			{
				return res.json(jsend.failure('please Select role'))
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
			if(req.body.phone && req.body.phone!="")
			{
				var phone = req.body.phone.toString().trim()
			}
			else
			{
				var phone =""
			}

			if(req.body.device_token && req.body.device_token!="")
			{
				var device_token = req.body.device_token.toString().trim()
			}
			else
			{
				device_token = ""
			}

			bandUserMdl.find({'email':email}).exec(function(err,data){
				if(err) throw err ;
				if(data.length>0)
				{
					return res.json(jsend.failure('Email already Registered'))
				}

				var token = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for (var i = 0; i < 20; i++)
				{
					token += possible.charAt(Math.floor(Math.random() * possible.length));
				}
				var confirmCode = token

				var password = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for (var i = 0; i < 20; i++)
				{
					password += possible.charAt(Math.floor(Math.random() * possible.length));
				}

				var newbanduser = new bandUserMdl({
					"phone":'',
					"email":email,
					"bandId":banduser[0]['bandId'],
					"password":password,
					"role":role,
					"register_type":"nm",
					"location":{"latitude":latitude,"longitude":longitude},
					"device":{"device_type":device_type,"device_token":device_token},
					"confirmCode":confirmCode,
					"token":token,
					"status":false,
					"register_method":'indirect'
				})

				let mailOptions = {
					from: 'Piyushkapoor786@gmail.com',
					to:  req.body.email,
					subject: 'Joined the Band on BandApp',
					html: 'Your account has been created with below credentials<br> <p>Username:'+email+'<br> <p>Password:'+password+'</p><br>Please Login to enjoy our Services'
				};
				emailtransport.sendMail(mailOptions, (error, info) => {
					if (error) {
						return console.log(error);
					}
				});
				if(role=='manager'){
					bandUserMdl.find({'bandId':banduser[0]['bandId'],'role':'manager'}).exec(function(err,data){
						if(err) throw err;
						if(data.length<2)
						{
							newbanduser.save()
							res.json(jsend.success({'confirmCode':token},'Request sent to manager'))
							return
						}
						else
						{
							res.json(jsend.failure("Already Two Manager Exist"))
							return
						}
					})
				}
				else
				{
					newbanduser.save()
					res.json(jsend.success({'confirmCode':token},'Request sent to member'))
					return
				}
			})
		})
	}
	else
	{
		res.json(jsend.failure("no token found"))
		return
	}
}


// List start=========================================
var listAction = function(req,res){

	if(req.body.token || req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err ;
			if(banduser.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			bandUserMdl.find({'bandId':banduser[0]['bandId'],'status':true}).exec(function(err,data){
				if(err) throw err;
				var users = _.map(data,function(obj){
					var maindata= {'bandId':obj['bandId'],
						'email':obj['email'],
						'userid':obj['_id'],
						'name':obj['name'],
						'image':obj['image'],
						'role':obj['role']
						}
						if(obj['_id'].toString()==banduser[0]['_id'].toString())
						{
							maindata['current_user']=true;
						}
						else
						{
							maindata['current_user']=false;
						}

					return maindata ;
				})
				res.json(jsend.success(users))
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

var deleteAction=function(req,res){

	if(req.body.token || req.body.token!=""){
		var token=req.body.token;
		if(req.body.userid || req.body.userid!=""){
			var bandUserId=req.body.userid;
		}
		else{
			res.json(jsend.failure("Band user id is required"))
		}
	 	bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err;
			else{

				bandUserMdl.find({"_id":bandUserId}).exec(function(err,banddata){
					if(err) throw err;
					else{
						if(banddata.length>0){
							var bandinfo={}
							bandinfo['bandName']=banddata[0].name;
							if(banddata[0].image!=""){

								bandinfo['bandImg']=banddata[0].image;
							}
                       				   	bandinfo= new bandMdl(bandinfo)
							bandinfo.save(bandinfo,function(err,band){

							if(err) throw err;
							else{

								var id=band._id
								bandUserMdl.update({"_id":bandUserId},{$set:{"bandId":bandinfo['_id']}}).exec(function 									(err,updated){
									if(err) throw err;
									else{
										res.json(jsend.success({"message":"successfully deleted"}))
									}
								})
							}
						   })

						}
						else
						{
							res.json(jsend.failure("no band found"));

						}
					}
				})
			}
		})
	}else{
		res.json(jsend.failure("no token found"))
		return
	}

}

var updateAction=function(req,res){

	if(req.body.token || req.body.token!=""){
		var token=req.body.token;
		if(req.body.userid || req.body.userid!=""){
			var bandUserId=req.body.userid;
		}
		else{
			res.json(jsend.failure("Band user id is required"))
		}

		if(req.body.role || req.body.role!=""){
			var role=req.body.role.toString().trim().toLowerCase();
		}
		else
		{
			res.json(jsend.failure("Role is required"))
		}


	 	bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err;
			else{
				if(role=='Manager'){
					bandUserMdl.find({'bandId':banduser[0]['bandId'],'role':'Manager'}).exec(function(err,data){
						if(err) throw err;
						if(data.length<2)
						{
							bandUserMdl.update({'_id':bandUserId},{$set:{'role':role}}).exec(function(err,band){
								if(err) throw err;
								else{
									res.json(jsend.success({},"successfully Updated"))
								}
							})
						}
						else
						{
							res.json(jsend.failure("Already Two Manager Exist"))
							return
						}
					})
				}
				else
				{
					bandUserMdl.update({'_id':bandUserId},{$set:{'role':role}}).exec(function(err,band){
						if(err) throw err;
						else{
							res.json(jsend.success({},"successfully Updated"))
						}
					})
				}







			}
		})
	}else{
		res.json(jsend.failure("no token found"))
		return
	}

}



var team = {
	'add':addAction,
	'list':listAction,
	'delete':deleteAction,
	'update':updateAction
}

module.exports = team
