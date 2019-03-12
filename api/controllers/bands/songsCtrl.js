var bandMdl =  require('../../models/bands.js')
var bandUserMdl =  require('../../models/bandUsers.js')
var playlistMdl =  require('../../models/playlists.js')
var playedMdl =  require('../../models/played.js')
var songlistMdl =  require('../../models/songlist.js')
var songMdl =  require('../../models/songs.js')
var jsend =  require('../../plugins/Jsend.js')
var fs  =  require('fs')


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

			if(req.body.playlist_id && req.body.playlist_id!="")
			{
				var playlistId = req.body.playlist_id
			}
			else
			{
				res.json(jsend.failure("Playlist Id is Required"))
				return
			}


			playlistMdl.find({'_id':playlistId}).exec(function(err,data){
				if(err) throw err ;
				if(data[0]['songs']==undefined  || data[0]['songs'].length<1){
					res.json(jsend.failure('No Song Found',[]))
					return
				}
				songlistMdl.find({'_id':{$in: data[0]['songs']}}).exec(function(err,songData){
					if(err) throw err ;
					res.json(jsend.success(songData))
					return
					
				})
			})

		})
	}
	else{
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
			if(req.body.playlist_id && req.body.playlist_id!="")
			{
				var playlistId = req.body.playlist_id
			}
			else
			{
				res.json(jsend.failure("Playlist Id is Required"))
				return
			}

			if(req.body.songs && (req.body.songs!="" || req.body.songs.length>0 ))
			{
				var songs = req.body.songs
			}
			else
			{
				res.json(jsend.failure("Song is Required"))
				return
			}
			playlistMdl.update({'_id':playlistId},{$addToSet:{"songs":{$each:songs}}}).exec(function(err,data){
				if(err) throw err ;
				res.json(jsend.success([],'Successfully Added'))					
				return
			})
		})
	}
	else{
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
	

			if(req.body.song_id && req.body.song_id!="")
			{
				var songId = req.body.song_id
			}
			else
			{
				res.json(jsend.failure("Song Id is Required"))
				return
			}

			if(req.body.playlist_id && req.body.song_id!="")
			{
				var playlistId = req.body.playlist_id
			}
			else
			{
				res.json(jsend.failure("Playlist Id is Required"))
				return
			}

			playlistMdl.update({'_id':playlistId},{$pull:{"songs":songId}}).exec(function(err,data){
				if(err) throw err ;
				res.json(jsend.success([],"Song successfully Deleted from Playlist"))
				return
			})

		})
	}
	else{
		res.json(jsend.failure("No token found"))
		return
	}
}


var searchAction  = function(req,res)
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
		
			if(req.body.search && req.body.search!="")
			{
				var term = req.body.search
			}
			else
			{
				var term = ""
			}

			songlistMdl.find({bandId:banduser[0]['bandId'],$or:[{'track':new RegExp(term,'i')},{'artist':new RegExp(term,'i')},{'collectionName':new RegExp(term,'i')},{'track':new RegExp(term,'i')}]}).exec(function(err,data){
				if(err) throw err ;
				if(data.length<1)
				{
					res.json(jsend.failure("No Such Song Found",[]))
					return
				}
				res.json(jsend.success(data))
				return
				
			})
		})
	}
	else{
		res.json(jsend.failure("No token found"))
		return
	}
}



var song = {
	'getAll':getAllAction,
	'add':addAction,
	'delete':deleteAction,
	'search':searchAction,
}

module.exports = song
