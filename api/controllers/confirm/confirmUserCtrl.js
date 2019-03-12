var userMdl =  require('../../models/users.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')


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

var confirm = {
	'confirm':confirmAccountAction,

}

module.exports = confirm

