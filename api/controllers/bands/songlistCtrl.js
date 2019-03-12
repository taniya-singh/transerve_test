var bandMdl =  require('../../models/bands.js')
var bandUserMdl =  require('../../models/bandUsers.js')
var playlistMdl =  require('../../models/playlists.js')
var playedMdl =  require('../../models/played.js')
var songlistMdl =  require('../../models/songlist.js')
var jsend =  require('../../plugins/Jsend.js')
var itunes = require('itunes-search');
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
			songlistMdl.find({'bandId':banduser[0]['bandId'],is_deleted:false}).sort({'created_at':-1}).exec(function(err,data){
				if(err) throw err ;
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

			if(req.body.songs && (req.body.songs!="" || req.body.songs.length>0 ))
			{
				try{
					var songs = req.body.songs
				}
				catch(e){
					res.json(jsend.failure("Invalid Json"))
					return
				}
			}
			else
			{
				res.json(jsend.failure("Song is Required"))
				return
			}
			(function saveSongs(req,res,recNum,songs){
			  if(recNum==songs.length)
			  {
				res.json(jsend.success([],"All Songs Saved Successfully"))
				return
			  }
			  else
  			  {
				songs[recNum]['bandId']=banduser[0]['bandId']
				var songData = new songlistMdl(songs[recNum])
				songData.save()
				saveSongs(req,res,++recNum,songs)
			  }
			})(req,res,0,songs)
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

			songlistMdl.remove({'_id':songId, bandId:banduser[0]['bandId']}).exec(function(err,data){
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


var manualAction = function(req,res)
{
	var songs={};
	var random=""
	if(req.body.token && req.body.token!=""){
		var token=req.body.token;
		bandUserMdl.find({'token':token}).exec(function(err,banduser){
			if(err){

			}else{
				if(banduser.length>0){
					var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				        for (var i = 0; i < 14; i++)
					{
				          	random += possible.charAt(Math.floor(Math.random() * possible.length));
				        }
					if(req.body.track && req.body.track!=""){
						songs.track=req.body.track
					}
					else
					{
						res.json(jsend.failure("Please enter Track"))
						return
					}
					if(req.body.artist && req.body.artist!=""){
						songs.artist=req.body.artist;
					}
					else
					{
						res.json(jsend.failure("Please enter Artist"))
						return
					}
					if(req.body.collection_name && req.body.collection_name!=""){
						songs.collectionName=req.body.collection_name;
					}
					else
					{
						res.json(jsend.failure("Please enter Collection Name"))
						return
					}
					if(req.body.genre && req.body.genre!=""){
						songs.genre=req.body.genre;
					}
					else
					{
						res.json(jsend.failure("Please enter Genre"))
						return
					}
					if(req.file && req.file!=""){
						if(req.file.size==0)
						{
							res.json(jsend.failure("Invalid Image"))
							return
						}
						var extarr = ['jpg','jpeg','png']
						var realext = req.file.originalname.split('.')
						var realext = realext[realext.length-1].toLowerCase()
							if(extarr.indexOf(realext)==-1)
							{
								res.json(jsend.failure("Not a Valid Format"))
								return
							}
							else
							{

								var src = req.file.destination+banddata[0]._id+random+"."+realext ;
								var path= req.file.destination;
								path=path.substr(path.indexOf("..")+1);
								songs.image=path+banddata[0]._id+random+"."+realext;
								fs.renameSync(req.file.path,src)
							}
					}
					if(req.body.playlistId && req.body.playlistId!=""){
						songs.playlistId=req.body.playlistId
					}

					songs['bandId']=banduser[0].bandId
					var songData = songlistMdl(songs)
					songData.save(songs,function(err,songsdata){
						if(err){
							res.json(jsend.failure("Error"))
							return
						}else{
							if(songsdata!=undefined){
								res.json(jsend.success({},"songs added successfully"))
							}else{
								res.json(jsend.failure("Something wrong happened, please try again later"))

							}
						}
					})
				}else{
					res.json(jsend.failure("Not a valid token"))
					return
				}
			}
		})
	}else{
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

			var options = {
			    media: "music",
			    limit: 50,
			    country:'us'
			}

			itunes.search( term, options, function(response) {
				var result = response.results
				if(result && result.length>0)
				{
				  var songs = [];

					for(var i=0; i<result.length;i++)
					{
						if(response.results[i]['kind']=='song'){
							var song ={}
							song['trackId']=response.results[i]['trackId']
							song['track']=response.results[i]['trackName']
							song['artist']=response.results[i]['artistName']
							song['collectionName']=response.results[i]['collectionName']
							song['genre']=response.results[i]['primaryGenreName']
							song['image']=response.results[i]['artworkUrl100'].replace('100x100bb.jpg','250x250bb.jpg')
							songs.push(song)
						}
					}
				  	res.json(jsend.success(songs))
					return
				}
				else
				{
				  res.json(jsend.failure('No Song Found',[]))
				  return
				}
			})
		})
	}
	else{
		res.json(jsend.failure("No token found"))
		return
	}
}

var playAction = function(req,res){

	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		bandUserMdl.find({'token':token}).exec(function(err,banddata){
			if(err) throw err ;
			if(banddata.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.event_id && req.body.event_id!="")
			{
				var eventId = req.body.event_id		}
			else
			{
				res.json(jsend.failure('Event ID is required'))
				return
			}


			if(req.body.song_id && req.body.song_id!="")
			{
				var songId = req.body.song_id			}
			else
			{
				res.json(jsend.failure('Song ID is required'))
				return
			}


			playedMdl.find({'eventId':eventId,'songId':songId}).exec(function(err,data){
				if(err) throw err ;
				if(data.length<1)
				{
					var playedSong = new playedMdl({'eventId':eventId, 'songId':songId})
					playedSong.save()
					res.json(jsend.success([],'Successfully Played'))
					return
				}
				else
				{
					res.json(jsend.success([],'Already Played'))
					return
				}
			})

		})
	}
	else{
		res.json(jsend.failure("No token f ound"))
		return
	}


}


var songlist = {
	'getAll':getAllAction,
	'add':addAction,
	'delete':deleteAction,
	'manual':manualAction,
	'search':searchAction,
	'play':playAction
}

module.exports = songlist
