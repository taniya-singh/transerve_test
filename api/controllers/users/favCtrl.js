var userMdl =  require('../../models/users.js')
var bandMdl =  require('../../models/bands.js')
var jsend =  require('../../plugins/Jsend.js')


var addAction = function(req,res){


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

			if(req.body.bandId && req.body.bandId!="")
			{
				var bandId = req.body.bandId
			}
			else
			{
				res.json(jsend.failure("Band Id is Required"))
				return
			}

			userMdl.find({'token':token,favorites:{$in:[bandId]}}).exec(
				(err,data) =>
				{
					if(err) throw err ;
					if(data.length>0){
						res.json(jsend.failure("Already in Favorite List"))
						return
					}
					userMdl.update({'token':token},{$addToSet:{'favorites':bandId}}).exec(
						(err,data) =>
						{
							if(err) throw err ;
							res.json(jsend.success([],'Added Successfully To Favorites'))
							return
					})
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


var removeAction = function(req,res){


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

			if(req.body.bandId && req.body.bandId!="")
			{
				var bandId = req.body.bandId
			}
			else
			{
				res.json(jsend.failure("Band Id is Required"))
				return
			}

			userMdl.update({'token':token},{$pull:{'favorites':bandId}}).exec(
				(err,data) =>
				{
					if(err) throw err ;
					res.json(jsend.success([],'Removed Successfully From Favorites'))
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


var listAction = function(req,res){


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



			bandMdl.find({_id:{$in:data[0]['favorites']}}).exec(function(err,bdata){
				if(err) throw err;
				res.json(jsend.success(bdata))
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





var fav = {
	'add':addAction,
	'remove':removeAction,
	'list':listAction
}

module.exports = fav
