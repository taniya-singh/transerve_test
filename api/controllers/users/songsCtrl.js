var userMdl =  require('../../models/users.js')
var playlistMdl =  require('../../models/playlists.js')
var playedMdl =  require('../../models/played.js')
var creditMdl =  require('../../models/credits.js')
var requestMdl =  require('../../models/requests.js')
var eventMdl =  require('../../models/events.js')
var songlistMdl =  require('../../models/songlist.js')
var jsend =  require('../../plugins/Jsend.js')
var itunes = require('itunes-search')
var _ =  require('underscore')

var getAllAction  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		userMdl.find({'token':token}).exec(function(err,userdata){
			if(err) throw err ;
			if(userdata.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}


			if(req.body.event_id && req.body.event_id!="")
			{
				var eventId = req.body.event_id
			}
			else
			{
				res.json(jsend.failure("Event Id Is Required"))
				return
			}


			eventMdl.find({'_id':eventId}).exec(function(err,data){
				if(err) throw err ;
				if(data.length<1)
				{
					res.json(jsend.failure("Event Not Found"))
					return
				}
				songlistMdl.find({'bandId':data[0]['bandId']}).lean().exec(function(err,songs){

							(function isPlayed(req,res,inRecNum,songs){
								if(inRecNum==songs.length)
								{
									(function getSongData(req,res,recNum,songs){
										if(recNum==songs.length)
										{
											var maxCredit=0;
											for(var k=0;k<songs.length;k++)
											{
												if(songs[k]['credits']>maxCredit && songs[k]['played'] != true)
												{
													maxCredit = songs[k]['credits']
												}
											}

											for(var k=0;k<songs.length;k++)
											{
												songs[k]['remaining'] = maxCredit - songs[k]['credits']
											}

											songs.sort(function(a, b) {
												return parseFloat(a.remaining) - parseFloat(b.remaining);
											});
											res.json(jsend.success(songs))
											return
										}	else
											{
												requestMdl.find({'songId':songs[recNum]['_id'],'eventId':eventId}).exec(function(err,data){

													songs[recNum]['credits']=0
													songs[recNum]['remaining']=0
													if(data.length<1)
													{
														songs[recNum]['votes']=0
														getSongData(req,res,++recNum,songs)
													}
													else
													{
														var songsArray = [];
														getUsersData(0, data, [], function(error, songsArray) {
										          if(!error){
																songs[recNum]['requested']=true
																songs[recNum]['votes']=data.length


																for(var k=0;k<data.length;k++)
																{
																	songs[recNum]['credits']+=parseInt(data[k]['credits'])
																}

																songs[recNum]['remaining']=0

																var uniqueUsers = removeDuplicates(songsArray, "_id");
																songs[recNum]['users'] = uniqueUsers ;

																getSongData(req,res,++recNum,songs)
										          }
										      	})
													}
												})
											}
										})(req,res,0,songs)

								}
								else
								{
									playedMdl.find({'eventId':eventId,'songId':songs[inRecNum]['_id']}).exec(function(err,indata){
										if(err) throw err ;
										if(indata.length>0)
										{
										   songs[inRecNum]['played']=true
										}
										else
										{
										   songs[inRecNum]['played']=false
										}
										isPlayed(req,res,++inRecNum,songs)
									})
								}
							})(req,res,0,songs)
				})

			})

		})
	}
	else{
		res.json(jsend.failure("No Token Found"))
		return
	}
}

function removeDuplicates(originalArray, prop) {
            var newArray = [];
            var lookupObject = {};

            for (var i in originalArray) {
              lookupObject[originalArray[i][prop]] = originalArray[i];
            }

            for (i in lookupObject) {
              newArray.push(lookupObject[i]);
            }
            return newArray;
          }

function getUsersData(i, data, songsArray, callbackresult) {
  if(i < data.length){
		userMdl.find({'_id':data[i].userId}).exec(function(err,userdata){
			songsArray.push(userdata[0])
			i = i+1;
			getUsersData(i, data, songsArray, callbackresult);
		});
  } else {
    callbackresult(null, songsArray);
  }
}


var requestAction = function(req,res){
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token
		userMdl.find({'token':token}).exec(function(err,userdata){
			if(err) throw err ;
			if(userdata.length==0)
			{
				res.json(jsend.failure("Invalid Token"))
				return
			}

			if(req.body.event_id && req.body.event_id!="")
			{
				var eventId = req.body.event_id
			}
			else
			{
				res.json(jsend.failure("Event Id is Required"))
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

			if(req.body.credits && req.body.credits!="")
			{
				var credits = req.body.credits
			}
			else
			{
				res.json(jsend.failure("Credit is Required"))
				return
			}

			eventMdl.find({'_id':eventId}).exec(function(err,edata){
				if(err) throw err ;
				if(edata.length<1)
				{
					res.json(jsend.failure("Event Not Found"))
					return
				}
				songlistMdl.find({'bandId':edata[0]['bandId'],'_id':songId}).exec(function(err,data){
					creditMdl.find({'userId':userdata[0]['_id']}).exec(function(err,data){
						if(err) throw err ;
						if(data.length<1)
						{
							res.json(jsend.failure("Insuffcient Credit"))
							return
						}

						if(data[0]['creditCount']!=undefined && data[0]['creditCount']>=credits){
							var  request = new requestMdl({'userId':userdata[0]['_id'],'songId':songId,'eventId':eventId,'bandId':edata[0]['bandId'],'credits':credits})
							request.save()
							creditMdl.update({'userId':userdata[0]['_id']},{$set:{'creditCount': data[0]['creditCount']-credits}}).exec(function(err,data){
								if(err) throw err ;
								res.json(jsend.success([],"Request Sent Successfully"))
								return
							})

						}
						else
						{
							res.json(jsend.failure("Insuffcient Credit"))
							return
						}
					})
				})
			})
		})
	}
	else{
		res.json(jsend.failure("No Token Found"))
		return
	}
}



var song = {
	'getAll':getAllAction,
	'request':requestAction,
}

module.exports = song
