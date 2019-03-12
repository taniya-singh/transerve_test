var userMdl =  require('../../models/users.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var adminMdl =  require('../../models/admin.js')
var bandMdl =  require('../../models/bands.js')



var loginAction  = function(req,res)
{
	if(req.body.email && req.body.email!="")
	{
		var email = req.body.email.toString().trim()
	}
	else
	{
		 return res.json(jsend.failure('please Enter email'))
	}

	if(req.body.password && req.body.password!="")
	{
		var password = req.body.password.toString()
	}
	else
	{
		 return res.json(jsend.failure('please Enter password'))
	}
	adminMdl.find({$and:[{"email":email},{"password":password}]}).exec(
		function(err,data){
			if(err) throw err ;

			if(data.length<1)
			{
				return res.json(jsend.failure('wrong username or password'))
			}
			else
			{
				delete data[0].token
		        var token = "";
		        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		        for (var i = 0; i < 14; i++)
		        {
		          token += possible.charAt(Math.floor(Math.random() * possible.length));
		        }
		        adminMdl.update({_id:data[0]._id},{$set:{'token':token}}).exec((err,adata)=>{
		          if(err) throw err ;
							return res.json(jsend.success({"token":token},'logged in successfully'))
		        })
			}
		}
	)
}

var logoutAction = function(req,res){

	if(req.body.token || req.body.token!="")
	{
		var token = req.body.token
		adminMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			adminMdl.update({'token':token},{$unset:{'token':null}}).exec(
				(err,data) =>
				{
					if(err) {throw err ;}
					else{
					res.json(jsend.success([],'successfully logged out'))
					return
					}
				}
			)
		})
	}
	else
	{
		res.json(jsend.failure("no token found"))
		return
	}
}

var infoAction = function(req,res){

	if(req.body.token && req.body.token !="")
	{
		var token = req.body.token
		adminMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			var maindata = {
				"email":data[0].email,
				"firstname":data[0].firstname,
				"lastname":data[0].lastname,
				"status":data[0].status
			}
			res.json(jsend.success(maindata))
			return

		})
	}
	else
	{
		res.json(jsend.failure("no token found"))
		return
	}
}

function authAction(req,res)
{
	if(req.body.token && req.body.token !="")
	{
		var token = req.body.token
		adminMdl.find({'token':token}).exec(function(err,data){
			if(err) throw err ;
			if(data.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}
			res.json(jsend.success([],'Valid Token'))
			return
		})
	}
	else
	{
		res.json(jsend.failure("Token Not Found"))
		return
	}
}


var changePasswordAction=function(req,res){

	if(req.body.oldpassword && req.body.oldpassword!="")
	{
		var oldpassword = req.body.oldpassword.toString()
	}
	else
	{
		 return res.json(jsend.failure('please Enter old password'))
	}

	if(req.body.newpassword && req.body.newpassword!="")
	{
		var newpassword = req.body.newpassword.toString()
	}
	else
	{
		 return res.json(jsend.failure('please Enter new password'))
	}

	if(req.body.cpassword && req.body.cpassword!="")
	{
		var cpassword = req.body.cpassword.toString()
	}
	else
	{
		 return res.json(jsend.failure('please Enter confirm password'))
	}
	if(req.body.token){
		adminMdl.find({"token":req.body.token}).exec(function(err,admindetail){
			if(err) throw err ;

			if(admindetail.length>0){
				if(admindetail[0].password!=oldpassword)
				{
					return res.json(jsend.failure("Invalid Old Password"))
				}

				adminMdl.update({token:req.body.token},{$set:{'password':newpassword}},function(err,updated){
					if(err){ throw err ; }
					return res.json(jsend.success({updated},"Password updated successfully"))
				})
			}
			else
			{
				return res.json(jsend.failure("Invalid Token"))
			}
		})
	}
	else
	{
		return res.json(jsend.failure("Token is required"))
	}
}


var admin = {
	'login':loginAction,
	'logout':logoutAction,
	'info':infoAction,
	'auth':authAction,
	'changePassword':changePasswordAction
}

module.exports = admin
