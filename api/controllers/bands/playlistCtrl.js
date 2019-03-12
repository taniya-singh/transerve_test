var bandMdl =  require('../../models/bands.js')
var bandUserMdl =  require('../../models/bandUsers.js')
var playlistMdl =  require('../../models/playlists.js')
var jsend =  require('../../plugins/Jsend.js')



var getAllAction  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err ;
			if(banduser.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.page && req.body.page!="")
			{
				var page = req.body.page
			}
			else
			{
				var page =1
			}

			if(req.query.search && req.body.search!="")
			{
				var search = req.query.search
			}
			else
			{
				var search = ""
			}
			playlistMdl.find({'bandId':banduser[0].bandId,'playlistName': new RegExp(search)}).skip((page-1)*10).limit(10).sort({'created_at':-1}).exec(function(err,playlistdata){
				res.json(jsend.success({'playlists':playlistdata}))
				return
			})

		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}

var getAction  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err ;
			if(banduser.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.page && req.body.page!="")
			{
				var page = req.body.page
			}
			else
			{
				var page =1
			}

			if(req.query.search && req.body.search!="")
			{
				var search = req.query.search
			}
			else
			{
				var search = ""
			}
			if(req.body.playlistId && req.body.playlistId!="")
			{
				var playlistId=req.body.playlistId
			}
			else
			{
				res.json(jsend.failure("PLaylist id not found"))
				return
			}
			playlistMdl.find({'bandId':banduser[0].bandId,'_id': playlistId}).skip((page-1)*10).limit(10).sort({'created_at':-1}).exec(function(err,playlistdata){
				res.json(jsend.success(playlistdata,"Fetched Successfully"))
				return
			})

		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}




var addAction  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err ;
			if(banduser.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.name && req.body.name!="")
			{
				var playlistName = req.body.name.toString().trim()
			}
			else
			{
				res.json(jsend.failure('playlist Name is required'))
				return
			}

			var newlist = new playlistMdl({
				'bandId' : banduser[0].bandId,
				'playlistName': playlistName
			})
			newlist.save()
			res.json(jsend.success({'id':newlist._id},"Playlist successfully added"))
			return
		})
	}
	else
	{
		res.json(jsend.failure("no token found"))
		return
	}
}

var updateAction  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err ;
			if(banduser.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}


			if(req.body.playlist_id && req.body.playlist_id!="")
			{
				var playlistId = req.body.playlist_id.toString()
			}
			else
			{
				res.json(jsend.failure('Playlist ID is required'))
				return
			}

			if(req.body.name && req.body.name!="")
			{
				var playlistName = req.body.name.toString().toLowerCase().trim()
			}
			else
			{
				res.json(jsend.failure('Playlist Name is required'))
				return
			}

			playlistMdl.update({'_id':playlistId},{$set:{'playlistName':playlistName}}).exec(function(err,data){
				if(err) throw err ;
				res.json(jsend.success([],"Playlist Updated successfully"))
				return
			})
		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}


var deleteAction  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err) throw err ;
			if(banduser.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.playlist_id && req.body.playlist_id!="")
			{
				var playlistId = req.body.playlist_id.toString()
			}
			else
			{
				res.json(jsend.failure('Playlist ID is required'))
				return
			}
			playlistMdl.remove({'_id':playlistId}).exec(function(err,data){
				if(err) throw err ;
				res.json(jsend.success([],"Playlist successfully Deleted"))
				return
			})
		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}




var playlist = {
	'getAll':getAllAction,
	'add':addAction,
	'update':updateAction,
	'delete':deleteAction,
	'get':getAction
}

module.exports = playlist
