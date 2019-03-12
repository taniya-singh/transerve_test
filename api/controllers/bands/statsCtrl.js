var bandMdl =  require('../../models/bands.js')
var playlistMdl =  require('../../models/playlists.js')
var playedMdl =  require('../../models/played.js')
var creditMdl =  require('../../models/credits.js')
var requestMdl =  require('../../models/requests.js')
var eventMdl =  require('../../models/events.js')
var songlistMdl =  require('../../models/songlist.js')
var jsend =  require('../../plugins/Jsend.js');
var bandUserMdl =  require('../../models/bandUsers.js');
var mongoose = require('mongoose');
var _ = require('underscore');



var getstats  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		var token = req.body.token;
		bandUserMdl.find({"token":token},function(err,banduser){
			if(err) throw err;
			if(banduser.length==0){
				res.json(jsend.failure("Invalid Token"))
				return
			}
			else {
				var bandid=banduser[0]['bandId'];
			}
			getMostPlayedSongs(bandid,function(err,playedsongs,notplayed){
				if(err) throw err;
				popularUsers(bandid,function(err,users){
					if(err) throw err;
					res.json(jsend.success({"most_played_songs":playedsongs,"not_played_songs":notplayed,"popular_users":users}))
				})
			})
		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}


var getMostPlayedSongs=function(bandid,cb)		
{	

	var mostplayed=[];
		var notplayed=[];
		
		requestMdl.aggregate([
		    {$match:{"bandId":mongoose.Types.ObjectId(bandid)}},
		    {
		        $group:{
		                    _id:{"songid":"$songId","bandid":"$bandId"},
		                    count:{$sum:1}
		                }
		    },
		    {
			$lookup:{
				from:"playeds",
		                localField:"_id.songid",
		                foreignField:"songId",
		                as:"song_array",
			}
		    },
		    {
		        $lookup:{
		                    from:"songlists",
		                    localField:"_id.songid",
		                    foreignField:"_id",
		                    as:"song_details"
		                }
		    },
		    {
		        $unwind:"$song_details"
		    },
		    {$sort:{count:-1}}
      		],function(err,mostplayedsong){
			if(err) throw err;
			else{
				for(var i=0;i<mostplayedsong.length;i++){
					var data={};
					
					data.songname=mostplayedsong[i].song_details.track;
					data.artist=mostplayedsong[i].song_details.artist;
					data.played=mostplayedsong[i].song_array.length;
					data.songrequest=mostplayedsong[i].count;
					mostplayed.push(data);			
				}
				for( var i=0;i<mostplayed.length;i++){
					if(mostplayed[i].played==0){
					var data={};
					 data.songname=mostplayed[i].songname;
					 data.played=mostplayed[i].played;
					 data.songrequest=mostplayed[i].songrequest;
					 data.artist=mostplayed[i].artist;
					 notplayed.push(data);				
					}				
				}
				cb(null,mostplayed,notplayed)
			}							
		})
		
}



var popularUsers=function(bandid,cb)
{
	popularUsersarr =[] 
	requestMdl.aggregate([
            {$match:{"bandId":mongoose.Types.ObjectId(bandid)}},
            {
                $group:{
                            _id:{"userid":"$userId"},
                            totalcredit:{$sum:"$credits"}
                        }
            },
            {
                $lookup:{
                            from:"users",
                            localField:"_id.userid",
                            foreignField:"_id",
                            as:"users"
                        }
            },
            {$sort:{totalcredit:-1}},
            {$unwind:"$users"}
            
            
  ],function(err,users){
			if(err){
				cb(err,{"message":err})
			} 
			else{
				for(i=0 ; i<users.length ; i++){
					var data={};
					data.firstname=users[i].users.firstname;
					data.lastname=users[i].users.lastname;
					data.totalcredit=users[i].totalcredit;
					popularUsersarr.push(data)

				}
				cb(null,popularUsersarr);
			}			
			
		  })
}



var getvenue  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{

		if(req.body.year){
			var year = req.body.year
		}
		else {
			res.json(jsend.failure("Invalid Year"))
			return
		}

		var startdate = req.body.year+"-01-01T00:00:00Z"
		var enddate = req.body.year+"-12-31T23:59:59Z"


		var token = req.body.token;
		bandUserMdl.find({"token":token},function(err,banduser){
			if(err) throw err;
			if(banduser.length==0){
				res.json(jsend.failure("Invalid Token"))
				return
			}
			else {
				var bandid=banduser[0]['bandId'];
			}
		
			eventMdl.find({'bandId':banduser[0]['bandId']}).exec(function(err,data){
				if(err) throw err;
				var events = new Array()	
				for(i=0;i<data.length;i++)
				{
					var eventStamp= new Date(data[i]['startTime']).getTime()
					var startStamp= new Date(startdate).getTime()
					var endStamp= new Date(enddate).getTime()
					if(startStamp<= eventStamp &&  endStamp>= eventStamp)
					{
						events.push(data[i]);
					}
					
				}
				
				var eventArrs = _.groupBy(events,function(o){ return o.venue.name.toLowerCase() ; })
				var i=0					
				for(place in eventArrs)
				{
					eventArrs[place]=_.pluck(eventArrs[place],'_id')
					i++
				}
				
	
				var dataEvents=[];
				_.map(eventArrs,function(o,k){
					dataEvents.push({'place':k,'events':o,'credits':0})
				});
				(function getRequests(req,res,dataEvents,recNum)
				{	
					if(dataEvents.length==recNum){

						dataEvents = _.sortBy(dataEvents, 'credits');
						dataEvents = dataEvents.reverse();
						res.json(jsend.success(dataEvents))
						return
					}
					else
					{
						requestMdl.find({'eventId':{$in:dataEvents[recNum]['events']}}).exec(function(err,requests){
							if(err) throw err;
							
							if(requests.length==0){ getRequests(req,res,dataEvents,++recNum); return ;}
							
							(function getplayeds(req,res,requests,recNumIn)
							{
								if(requests.length==recNumIn)
								{
									getRequests(req,res,dataEvents,++recNum)
									return
								}
								else{
									playedMdl.find({'eventId':requests[recNumIn]['eventId'],'songId':requests[recNumIn]['songId']}).exec(function(err,playeds){
										if(err) throw err;
										if(playeds.length>0)
										{
											dataEvents[recNum]['credits']+=requests[recNumIn]['credits']
										}	
										getplayeds(req,res,requests,++recNumIn)
										return
									})
								}

							})(req,res,requests,0)
						})
						}

				})(req,res,dataEvents,0)					
					
			})
		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}




var getweek  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		if(req.body.startdate){
			var startdate = req.body.startdate
		}
		else {
			res.json(jsend.failure("Invalid Start Date"))
			return
		}
		var days = []

		for(i=0;i<7;i++){
			
			days.push(new Date(new Date(startdate).getTime() + (86400000*i)))
		}
		var token = req.body.token;
		bandUserMdl.find({"token":token},function(err,banduser){
			if(err) throw err;
			if(banduser.length==0){
				res.json(jsend.failure("Invalid Token"))
				return
			}
			else {
				var bandid=banduser[0]['bandId'];
			}
			eventMdl.find({'bandId':banduser[0]['bandId']}).exec(function(err,data){
				if(err) throw err;
				var events = new Array()
				for(i=0;i<data.length;i++)
				{
					data[i]['day'] =['SU','M','TU','W','TH','F','SA'][new Date(data[i]['startTime']).getDay()] 					
					var eventStamp= new Date(data[i]['startTime']).getTime()
					var startStamp= new Date(days[0]).getTime()
					var endStamp= new Date(days[days.length-1]).getTime()
					

					if(eventStamp<= eventStamp &&  endStamp>= eventStamp)
					{
						events.push(data[i]);
					}
							
				}
				
				var eventArrs = _.groupBy(events,function(o){ return o.day.toLowerCase() ; })
				var i=0					
				for(wdays in eventArrs)
				{
					eventArrs[wdays]=_.pluck(eventArrs[wdays],'_id')
					i++
				}
				
				var dataEvents=[];
				_.map(eventArrs,function(o,k){
					dataEvents.push({'day':k,'events':o,'credits':0})
				});


				(function getRequests(req,res,dataEvents,recNum)
				{	
					if(dataEvents.length==recNum){
					

						var weekdays = ['SU','M','TU','W','TH','F','SA']
						for(i=0;i<weekdays.length;i++)
						{
							var daysE = _.filter(dataEvents, function(obj){ return obj.day == weekdays[i].toLowerCase(); });							
							if(daysE.length==0)
							{
								dataEvents.push({'day':weekdays[i].toLowerCase(),'events':0,'credits':0})
							}
						}
						dataEvents = _.sortBy(dataEvents, 'credits');
						dataEvents = dataEvents.reverse();
						res.json(jsend.success(dataEvents))
						return
					}
					else
					{
						requestMdl.find({'eventId':{$in:dataEvents[recNum]['events']}}).exec(function(err,requests){
							if(err) throw err;
							
							if(requests.length==0){ getRequests(req,res,dataEvents,++recNum); return ;}
							
							(function getplayeds(req,res,requests,recNumIn)
							{
								if(requests.length==recNumIn)
								{
									getRequests(req,res,dataEvents,++recNum)
									return
								}
								else{
									playedMdl.find({'eventId':requests[recNumIn]['eventId'],'songId':requests[recNumIn]['songId']}).exec(function(err,playeds){
										if(err) throw err;
										if(playeds.length>0)
										{
											dataEvents[recNum]['credits']+=requests[recNumIn]['credits']
										}	
										getplayeds(req,res,requests,++recNumIn)
										return
									})
								}

							})(req,res,requests,0)
						})
						}

				})(req,res,dataEvents,0)					
					
			})
		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}



var getYear  = function(req,res)
{
	if(req.body.token && req.body.token!="")
	{
		console.log(req.body)
		if(req.body.year){
			var startdate = req.body.year+"-01-01T00:00:00Z" 
		}
		else {
			res.json(jsend.failure("Invalid Year"))
			return
		}
		var days = []

		for(i=0;i<365;i++){
			
			days.push(new Date(new Date(startdate).getTime() + (86400000*i)))
		}



		var token = req.body.token;
		bandUserMdl.find({"token":token},function(err,banduser){
			if(err) throw err;
			if(banduser.length==0){
				res.json(jsend.failure("Invalid Token"))
				return
			}
			else {
				var bandid=banduser[0]['bandId'];
			}
			eventMdl.find({'bandId':banduser[0]['bandId']}).exec(function(err,data){
				if(err) throw err;
				var events = new Array()
				for(i=0;i<data.length;i++)
				{
					data[i]['day'] =['SU','M','TU','W','TH','F','SA'][new Date(data[i]['startTime']).getDay()] 					
					var eventStamp= new Date(data[i]['startTime']).getTime()
					var startStamp= new Date(days[0]).getTime()
					var endStamp= new Date(days[days.length-1]).getTime()
					

					if(eventStamp<= eventStamp &&  endStamp>= eventStamp)
					{
						events.push(data[i]);
					}
				}
				
				var eventArrs = _.groupBy(events,function(o){ return o.day.toLowerCase() ; })
				var i=0					
				for(wdays in eventArrs)
				{
					eventArrs[wdays]=_.pluck(eventArrs[wdays],'_id')
					i++
				}
				
	
				var dataEvents=[];
				_.map(eventArrs,function(o,k){
					dataEvents.push({'day':k,'events':o,'credits':0})
				});
				(function getRequests(req,res,dataEvents,recNum)
				{	
					if(dataEvents.length==recNum){
						var weekdays = ['SU','M','TU','W','TH','F','SA']
						for(i=0;i<weekdays.length;i++)
						{
							var daysE = _.filter(dataEvents, function(obj){ return obj.day == weekdays[i].toLowerCase(); });							
							if(daysE.length==0)
							{
								dataEvents.push({'day':weekdays[i].toLowerCase(),'events':0,'credits':0})
							}
						}
						dataEvents = _.sortBy(dataEvents, 'credits');
						dataEvents = dataEvents.reverse();
						res.json(jsend.success(dataEvents))
						return
					}
					else
					{
						requestMdl.find({'eventId':{$in:dataEvents[recNum]['events']}}).exec(function(err,requests){
							if(err) throw err;
							if(requests.length==0){ getRequests(req,res,dataEvents,++recNum); return ;}
							(function getplayeds(req,res,requests,recNumIn)
							{
								if(requests.length==recNumIn)
								{
									getRequests(req,res,dataEvents,++recNum)
									return
								}
								else{
									console.log({'eventId':requests[recNumIn]['eventId'],'songId':requests[recNumIn]['songId']})
									playedMdl.find({'eventId':requests[recNumIn]['eventId'],'songId':requests[recNumIn]['songId']}).exec(function(err,playeds){
										if(err) throw err;
										if(playeds.length>0)
										{
											dataEvents[recNum]['credits']+=requests[recNumIn]['credits']
										}	
										getplayeds(req,res,requests,++recNumIn)
										return
									})
								}

							})(req,res,requests,0)
						})
					}

				})(req,res,dataEvents,0)					
					
			})
		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}







var stats = {
	'stats':getstats,
	'week':getweek,
	'year':getYear,
	'venue':getvenue
}

module.exports = stats
