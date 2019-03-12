var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express')
var multer = require('multer')
var bodyparser = require('body-parser')
var cookieParser = require('cookie-parser');
var cors = require('cors')
var database = require('./config/database')
var config = require('./config/config')
var router = require('./routes')
var CronJob = require('cron').CronJob;
var evaluateCredit =  require('./controllers/crons')
new CronJob('*/15 * * * * *', evaluateCredit , null, true);

app.get('/',evaluateCredit)

//middlewares
app.set('env',config.environment)
app.set('views', './views')
app.set('view engine', 'ejs')
app.use(cors())
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))
app.use(cookieParser());
app.use('/uploads',express.static(__dirname+'/uploads'))
app.use('/',router)

//logging
switch (app.get('env')) {
    case 'development':
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        app.use(require('express-logger')({
            path: __dirname + '/server.log'
        }));
        break;
}

//----socket code ---//

var bandUserMdl =  require('./models/bandUsers.js')
var userMdl =  require('./models/users.js')
var playlistMdl =  require('./models/playlists.js')
var playedMdl =  require('./models/played.js')
var creditMdl =  require('./models/credits.js')
var requestMdl =  require('./models/requests.js')
var eventMdl =  require('./models/events.js')
var songlistMdl =  require('./models/songlist.js')
var async = require('async')
var moment = require('moment-timezone')
var dateFormat = require('dateformat')


io.on('connection',function(socket){

	socket.on('play',function(data){
			try {
			   var bodyData=JSON.parse(data);
			}
			catch(err) {
			   socket.emit("failure",{"message":"Invalid Json","data":{},"status":"failure"})
			   return
			}
			if(bodyData.token && bodyData.token!="")
			{
			var token = bodyData.token
			bandUserMdl.find({'token':token}).exec(function(err,banddata){
				if(err) throw err ;
				if(banddata.length==0)
				{
					socket.emit("failure",{"message":"Invalid Token","data":{},"status":"failure"})
					return
				}

				if(bodyData.event_id && bodyData.event_id!="")
				{
					var eventId = bodyData.event_id			}
				else
				{
					socket.emit("failure",{"message":"Event ID is Required","data":{},"status":"failure"})
					return
				}


				if(bodyData.song_id && bodyData.song_id!="")
				{
					var songId = bodyData.song_id			}
				else
				{
					socket.emit("failure",{"message":"Song ID is required","data":{},"status":"failure"})
					return
				}


				playedMdl.find({'eventId':eventId,'songId':songId}).exec(function(err,data){
					if(err) throw err ;
					if(data.length<1)
					{
						var playedSong = new playedMdl({'eventId':eventId, 'songId':songId})
						playedSong.save()
						socket.emit("success",{"message":"Successfully Played","data":{},"status":"success"})
						io.sockets.emit("newEvent",{"message":"New Song Requested/Played","data":{'eventId':eventId},"status":"success"})
						return
					}
					else
					{
						socket.emit("success",{"message":"Already Played","data":{},"status":"success"})
						return
					}
				})

			})
		}
		else{
			socket.emit("failure",{"message":"No token found","data":{},"status":"failure"})
			return
		}

	})

	socket.on("userRequest",function(data){

			try {
			   var bodyData=JSON.parse(data);
			}
			catch(err) {
			   socket.emit("failure",{"message":"Invalid Json","data":{},"status":"failure"})
			   return
			}

			if(bodyData.token && bodyData.token!="")
			{
				var token = bodyData.token
				userMdl.find({'token':token}).exec(function(err,userdata){
					if(err) throw err ;
					if(userdata.length==0)
					{
						socket.emit("failure",{"message":"Invalid Token","data":{},"status":"failure"})
						return
					}


					if(bodyData.event_id && bodyData.event_id!="")
					{
						var eventId = bodyData.event_id
					}
					else
					{
						socket.emit("failure",{"message":"Event Id is Required","data":{},"status":"failure"})
						return
					}


					eventMdl.find({'_id':eventId}).exec(function(err,data){
						if(err) throw err ;
						if(data.length<1)
						{
							socket.emit("failure",{"message":"Event Not Found","data":{},"status":"failure"})
							return
						}
						songlistMdl.find({'bandId':data[0]['bandId']}).lean().exec(function(err,songs){

              (function isPlayed(socket,inRecNum,songs){
								if(inRecNum==songs.length)
								{
									(function getSongData(socket,recNum,songs){
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
                      socket.emit("success",{"message":"","data":songs,"status":"success"})
        							return
										}	else
											{
												requestMdl.find({'songId':songs[recNum]['_id'],'eventId':eventId}).exec(function(err,data){

													songs[recNum]['credits']=0
													songs[recNum]['remaining']=0
													if(data.length<1)
													{
														songs[recNum]['votes']=0
														getSongData(socket,++recNum,songs)
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

                                getSongData(socket,++recNum,songs)
                              }
                            })
                          }

												})
											}
										})(socket,0,songs)

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
										isPlayed(socket,++inRecNum,songs)
									})
								}
							})(socket,0,songs)

						})

					})

				})
			}
			else{
				socket.emit("failure",{"message":"No token found","data":{},"status":"failure"})
				return
			}
		})
//===============================================================
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

	socket.on("requestList",function(data){
			try {
			   var bodyData=JSON.parse(data);
			}
			catch(err) {
			   socket.emit("failure",{"message":"Invalid Json","data":{},"status":"failure"})
			   return
			}
			if(bodyData.token && bodyData.token!="")
			{
				var token = bodyData.token
				bandUserMdl.find({'token':token}).exec(function(err,banduser){
					if(err) throw err ;
					if(banduser.length==0)
					{
						socket.emit("failure",{"message":"Invalid Token","data":{},"status":"failure"})
						return
					}

					if(bodyData.timezone && bodyData.timezone!="")
					{
						var timezone = bodyData.timezone
					}
					else
					{
						var timezone = "America/New_York"
					}
					if(bodyData.event_id && bodyData.event_id!="")
					{
						var eventId = bodyData.event_id
					}
					else
					{
						socket.emit("failure",{"message":"Event Id is Required","data":{},"status":"failure"})
						return
					}

					eventMdl.find({'_id':eventId}).lean().exec(function(err,eventdata){
						if(err) throw err ;

						if(eventdata.length<1){
							socket.emit("failure",{"message":"Event Not Found","data":{},"status":"failure"})
							return
						}
						process.env.TZ = timezone
						var now =new Date()
						var now = new Date(moment(now).tz(timezone).format('YYYY-MM-DD HH:mm'))
						var eventEndIn = new Date(moment(eventdata[0]['endTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
						var eventStartIn = new Date(moment(eventdata[0]['startTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
						process.env.TZ = 'UTC'

						if(((eventStartIn.getTime()-1800)< now.getTime() && (eventEndIn.getTime()+1800) > now.getTime()) || eventdata[0]['started']== true )
						{
							if(eventdata[0]['ended']== true ){
								eventdata[0]['live']=false;
								eventdata[0]['started']=true;
								eventdata[0]['ended']=true;
							}
							else{
								if((eventEndIn.getTime()+1800) < now.getTime() ){
									eventdata[0]['live']=false;
									eventdata[0]['started']=true;
									eventdata[0]['ended']=false;
								}
								else{
									eventdata[0]['live']=true;
									eventdata[0]['started']=true;
									eventdata[0]['ended']=false;
								}
							}
						}
						else
						{
							if((eventStartIn.getTime()-1800) > now.getTime()) {
								eventdata[0]['live']=false;
								eventdata[0]['started']=false;
								eventdata[0]['ended']=false;
							}

							if((eventEndIn.getTime()+1800) < now.getTime()) {
								eventdata[0]['live']=false;
								eventdata[0]['started']=true;
								eventdata[0]['ended']=false;
							}
							eventdata[0]['live']=false;

						}
						if(eventdata[0]['live']==false)
						{
							socket.emit("failure",{"message":'Event is not live, Start the Event',"data":{},"status":"failure"})
							return
						}
						else
						{
							songlistMdl.find({'bandId':banduser[0]['bandId']}).lean().exec(function(err,songs){
								(function getSongData(socket,recNum,songs){
									if(recNum==songs.length)
									{
										var maxCredit=0;
										for(var k=0;k<songs.length;k++)
										{
											if(songs[k]['credits']>maxCredit)
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


										(function isPlayed(socket,inRecNum,songs){
											if(inRecNum==songs.length)
											{

												if(eventdata[0]['playlistId'] && eventdata[0]['playlistId']!='')
												{
													playlistMdl.find({'_id':eventdata[0]['playlistId']}).exec(function(err,data){
														if(err) throw err;
														songlistMdl.find({'_id':{$in:data[0]['songs']}}).lean().exec(function(err,playdata){
															if(err) throw err;
															(function isSetlistPlayed(socket,slRecNum,playdata){

																if(slRecNum==playdata.length)
																{

                                  playdata.sort(dynamicSort("played"));
                                  songs.sort(dynamicSort("played"));

																	socket.emit("success",{"message":"","data":{'setlist':playdata,'requested':songs},"status":"success"})
																	return
																}
																else
																{
																	playedMdl.find({'eventId':eventId,'songId':playdata[slRecNum]['_id']}).exec(function(err,smdata){
																		if(err) throw err ;
																		if(smdata.length>0)
																		{
																		   playdata[slRecNum]['played']=true
																		}
																		else
																		{
																		   playdata[slRecNum]['played']=false
																		}
																		isSetlistPlayed(socket,++slRecNum,playdata)
																	})
																}

															})(socket,0,playdata)


														})
													})
												}
												else
												{
                          songs.sort(dynamicSort("played"));
													socket.emit("success",{"message":"","data":{'setlist':[],'requested':songs},"status":"success"})
													return
												}
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
													isPlayed(socket,++inRecNum,songs)
												})
											}
										})(socket,0,songs)

									}
									else
									{
										requestMdl.find({'songId':songs[recNum]['_id'],'eventId':eventId}).exec(function(err,data){
											songs[recNum]['credits']=0
											songs[recNum]['remaining']=0
											if(data.length<1)
											{
												songs[recNum]['votes']=0
												getSongData(socket,++recNum,songs)
											}
											else
											{	songs[recNum]['requested']=true
												songs[recNum]['votes']=data.length
												for(var k=0;k<data.length;k++)
												{
													songs[recNum]['credits']+=parseInt(data[k]['credits'])
												}
												songs[recNum]['credits'] = songs[recNum]['credits']*0.7
												songs[recNum]['remaining']=0
												getSongData(socket,++recNum,songs)
											}

										})
									}
								})(socket,0,songs)
							})
						}


					})
				})
			}
			else{
				socket.emit("failure",{"message":"No token found","data":{},"status":"failure"})
				return
			}
	})

  function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function(a, b) {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
    }
  }


	socket.on('info',function(data){
		try {
		   var bodyData=JSON.parse(data);
		}
		catch(err) {
		   socket.emit("failure",{"message":"Invalid Json","data":{},"status":"failure"})
		   return
		}
		socket['usertoken']=data.token;
		socket.emit('sendInfo',{"message":"Connected Successfully","status":"Success"})
	})


	socket.on('request',function(data){
		try {
		   var bodyData=JSON.parse(data);
		}
		catch(err) {
		   socket.emit("failure",{"message":"Invalid Json","data":{},"status":"failure"})
		   return
		}
		if(bodyData.token && bodyData.token!="")
		{
			var token = bodyData.token
			userMdl.find({'token':token}).exec(function(err,userdata){
				if(err) throw err ;
				if(userdata.length==0)
				{
					socket.emit('failure',{"message":"Invalid Token","data":{},"status":"failure"})
					return
				}

				if(bodyData.event_id && bodyData.event_id!="")
				{
					var eventId = bodyData.event_id
				}
				else
				{
					socket.emit("failure",{"message":"Event Id is Required","data":{},"status":"failure"})
					return
				}

				if(bodyData.song_id && bodyData.song_id!="")
				{
					var songId = bodyData.song_id
				}
				else
				{
					socket.emit("failure",{"message":"Song Id is Required","data":{},"status":"failure"})
					return
				}

				if(bodyData.credits && bodyData.credits!="")
				{
					var credits = bodyData.credits
				}
				else
				{
					socket.emit("failure",{"message":"Credit is Required","data":{},"status":"failure"})
					return
				}

				eventMdl.find({'_id':eventId}).exec(function(err,edata){
					if(err) throw err ;
					if(edata.length<1)
					{
						socket.emit("failure",{"message":"Event Not Found","data":{},"status":"failure"})
						return
					}
					songlistMdl.find({'bandId':edata[0]['bandId'],'_id':songId}).exec(function(err,data){
						creditMdl.find({'userId':userdata[0]['_id']}).exec(function(err,data){
							if(err) throw err ;
							if(data.length<1)
							{
								socket.emit("failure",{"message":"Insuffcient Credit","data":{},"status":"failure"})
								return
							}
							if(data[0]['creditCount']!=undefined && data[0]['creditCount']>=credits){
                if( edata[0]['ended'] == false )
                {
                  var  request = new requestMdl({'userId':userdata[0]['_id'],'songId':songId,'eventId':eventId,'bandId':edata[0]['bandId'],'credits':credits})
  								request.save()
  								creditMdl.update({'userId':userdata[0]['_id']},{$set:{'creditCount': data[0]['creditCount']-credits}}).exec(function(err,data){
  									if(err) throw err ;
  									socket.emit("success",{"message":"Event Succesfully Requested","data":{'eventId':eventId},"status":"success"})
  									io.sockets.emit("newEvent",{"message":"New Song Requested","data":{'eventId':eventId},"status":"success"})
  									return
  								})
                }
                else {
                  socket.emit("failure",{"message":"Event has ended and request are no longer being accepted","data":{},"status":"failure"})
                  return
                }
							}
							else
							{
								socket.emit("failure",{"message":"Insuffcient Credit","data":{},"status":"failure"})
								return
							}
						})
					})
				})
			})
		}
		else{
			socket.emit("failure",{"message":"No token found","data":{},"status":"failure"})
			return
		}
	})
})

// server started
var server = http.listen( process.env.PORT || config.port, function(){
  console.log('server is runing on port '+server.address().port)
})
