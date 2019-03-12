var userMdl =  require('../../models/users.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var adminMdl =  require('../../models/admin.js')
var bandMdl =  require('../../models/bands.js')



/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : getallAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to get all users.
__________________________________________________________________________________*/


var getallAction=function(req,res){
	if(req.params.token && req.params.token!="")
	{
		var token = req.params.token
		adminMdl.find({'token':token}).exec(function(err,admindetail){
			if(err) throw err ;
			if(admindetail.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			if(req.params.page && req.params.page!="")
			{
				var page = req.params.page
			}
			else
			{
				var page =1
			}
			if(req.query.search && req.params.search!="")
			{
				var search = req.query.search
			}
			else
			{
				var search = ""
			}
			userMdl.find({$or:[{'firstname': new RegExp(search)},{'email': new RegExp(search)},{'lastname': new RegExp(search)}],'is_deleted':false}).exec(function(err,totaldata){
				if (err) { throw err ;}
				userMdl.find({ $or:[{'firstname': new RegExp(search)},{'email': new RegExp(search)},{'lastname': new RegExp(search)}],'is_deleted':false}).skip((page*10)-10).limit(10).sort({created_at:-1}).exec(function(err,totalusers){
					if (err) { throw err ;}
					res.json(jsend.success({'users':totalusers,'totalPages':Math.ceil(totaldata.length/10)}))
					return
				})
			})
		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}

/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : updateinfoAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to update user information.
__________________________________________________________________________________*/





var updateinfoAction=function(req,res){
	if(req.body.token && req.body.token !=""){

		var update={};
		var token=req.body.token;
		var id=req.body.id;
		adminMdl.find({"token":token},function(err,admin){
			if(err){
				res.json(jsend.failure("Invalid token"))
			}else{
				if(admin.length>0){
					if(req.body.firstname && req.body.firstname!=""){
						update.firstname=req.body.firstname;
					}
					if(req.body.lastname && req.body.lastname!=""){
						update.lastname=req.body.lastname;
					}
					if(req.body.email && req.body.email!=""){
						update.email=req.body.email;
					}
					userMdl.update({"_id":id},{$set:update},function(err,updated){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							res.json(jsend.success({'update':updated}))
						}
					})
				}else{
				res.json(jsend.failure("Invalid token"))
				return
				}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}

var fetchUserAction=function(req,res){
if(req.body.token && req.body.token!=""){
	var token=req.body.token;
	adminMdl.find({"token":token},function(err,admindetail){
		if(err){
			res.json(jsend.failure("Error"))
		}else{
			if(req.body.id && req.body.id!=""){
				var id=req.body.id;
				userMdl.find({"_id":id,"is_deleted":false},function(err,userdetail){
					if(err){
						res.json(jsend.failure("Error"))
					}else{
						if(userdetail.length>0){
							res.json(jsend.success({"user":userdetail,"message":"User found"}))
						}else{
							res.json(jsend.failure("Invalid user Id"))
						}
					}
				})
			}else{
				res.json(jsend.failure("No token was found"))
			}

		}
	})
}else{
	res.json(jsend.failure("No token was found"))
	return
}
}

var updateUserAction=function(req,res){
	if(req.body.token){
		var update={};
		var token=req.body.token;
		var id=req.body.id;
		adminMdl.find({"token":token},function(err,admin){
			if(err){
				res.json(jsend.failure("Invalid token"))
			}else{
				if(admin.length>0){
					if(req.body.id && req.body.id!=""){
						if(req.body.firstname && req.body.firstname!=""){
							update.firstname=req.body.firstname;
						}
						if(req.body.phone && req.body.phone!=""){
							update.phone=req.body.phone;
						}
						if(req.body.lastname && req.body.lastname!=""){
							update.lastname=req.body.lastname;
						}
						userMdl.update({"_id":id},{$set:update},function(err,updated){
							if(err){
								res.json(jsend.failure("Error"))
							}else{
								res.json(jsend.success({'update':updated,"message":"Updated successfully"}))
							}
						})
				}else{
					res.json(jsend.failure("Id not found"))
				}
			}else{
				res.json(jsend.failure("Invalid token"))
				return
			}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}
var stateChangeAction=function(req,res){
	if(req.body.token){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body.id){
					var _id=req.body.id;
					userMdl.find({"_id":_id},function(err,users){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							if(users.length>0){
								if(users[0].status==true){
									userMdl.update({"_id":_id},{$set:{"status":false}},function(err,dataupdated){
										if(err){
											res.json(jsend.failure("Error"))
										}else{
											res.json(jsend.success({"updated":dataupdated,"message":"Updated successfully"}))
										}
									})
								}else{
									userMdl.update({"_id":_id},{$set:{"status":true}},function(err,dataupdated){
										if(err){
											res.json(jsend.failure("Error"))
										}else{
											res.json(jsend.success({"updated":dataupdated}))
										}
									})
								}
							}
						}
					})

				}else{
					res.json(jsend.failure("Band id not found"))
					return;
				}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}
var deleteUserAction=function(req,res){
		if(req.body.token){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body.id){
					var id=req.body.id
					userMdl.update({"_id":id},{$set:{"is_deleted":true}},function(err,deleted){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							res.json(jsend.success({"deleted":deleted,"message":"Deleted Successfully"}))
						}
					})
				}else{
					res.json(jsend.failure("Id not found"))
				}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}

var userCountAction=function(req,res){if(req.params.token && req.params.token!=""){
		var token=req.params.token
		adminMdl.find({"token":token},function(err,admindetail){
			if(admindetail.length>0){
				userMdl.count({"is_deleted":false},function(err,userCount){
					if(err){
						res.json(jsend.failure("Err"))
						return
					}else{
						res.json(jsend.success({"userCount":userCount,"message":"total user count retreived Successfully"}))
					}
				})
			}else{
				res.json(jsend.failure("Invalid token"))
				return
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}

var admin = {
	'totalUsers':getallAction,
	'updateInfo':updateinfoAction,
	'fetchUser':fetchUserAction,
	'updateUser':updateUserAction,
	'stateChange':stateChangeAction,
	'deleteUser':deleteUserAction,
	'userCount':userCountAction


}

module.exports = admin
