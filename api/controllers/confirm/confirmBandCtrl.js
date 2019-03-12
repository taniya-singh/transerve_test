var fs  =  require('fs')
var bandMdl =  require('../../models/bands.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var bandUserMdl =  require('../../models/bandUsers.js')



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
	bandUserMdl.find({'confirmCode':code}).limit(1).exec(function(err,banddata){
			if(err) throw err
			if(banddata.length<1)
			{
				res.render('account-confirmed',{message:'Invalid Code'})
				return
			}
			if(banddata[0].status && banddata[0].status==true)
			{
				res.render('account-confirmed',{message:'Account already Confirmed'})
				return
			}
			bandUserMdl.update({_id:banddata[0]._id},{$set:{'status':true}}).exec((err,data)=>{ if(err){ throw err ;}})
			res.render('account-confirmed',{message:'Account Succesfully Confirmed'})
			return
	})
}


var confirm = {
	'confirm':confirmAccountAction,	
}

module.exports = confirm
