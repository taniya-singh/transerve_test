var userMdl =  require('../../models/users.js')
var playlistMdl =  require('../../models/playlists.js')
var songMdl =  require('../../models/songs.js')
var songlistMdl =  require('../../models/songlist.js')
var jsend =  require('../../plugins/Jsend.js')


var getAllAction  = function(req,res)
{
	if(req.params.token && req.params.token!="")
	{
		var token = req.params.token
		userMdl.find({'token':token}).exec(function(err,udata){
			if(err) throw err ;
			if(udata.length==0)
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
			playlistMdl.find({'playlistName': new RegExp(search)}).skip((page-1)*10).limit(10).sort({'created_at':-1}).exec(function(err,playlistdata){
				res.json(jsend.success({'playlists':playlistdata}))
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


var songsAction  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		userMdl.find({'token':token}).exec(function(err,udata){
			if(err) throw err ;
			if(udata.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.playlist_id && req.body.playlist_id!="")
			{
				var playlistId = req.body.playlist_id
			}
			else
			{
				res.json(jsend.failure("Playlist Id Is Required"))
				return
			}

			if(req.body.page && req.body.page!="")
			{
				var page = req.body.page
			}
			else
			{
				var page=1
			}

			playlistMdl.find({'_id':playlistId}).exec(function(err,playdata){
				songlistMdl.find({_id:{$in:playdata[0]['songs']}}).skip((page-1)*10).limit(10).sort({'created_at':-1}).exec(function(err,songsdata){
					res.json(jsend.success({'songs':songsdata}))
					return
				})
			})

		})
	}
	else
	{
		res.json(jsend.failure("No Token Found"))
		return
	}
}





var playlist = {
	'songs':songsAction,
	'getAll':getAllAction
}

module.exports = playlist
