var userMdl =  require('../../models/users.js')
var bandMdl =  require('../../models/bands.js')
var eventMdl =  require('../../models/events.js')
var playlistMdl =  require('../../models/playlists.js')
var jsend =  require('../../plugins/Jsend.js')
var mongoose = require('mongoose')
var async = require('async')
var geolib = require('geolib')
var moment = require('moment-timezone')
var dateFormat = require('dateformat')
var _ = require('underscore')

var getAllAction  = function(req,res)
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

			if(req.body.page && req.body.page!="")
			{
				var page = req.params.page
			}
			else
			{
				var page =1
			}

			if(req.body.longitude && req.body.longitude!="")
			{
				var longitude = req.body.longitude
			}
			else
			{
				var longitude =''
			}

			if(req.body.latitude && req.body.latitude!="")
			{
				var latitude = req.body.latitude
			}
			else
			{
				var latitude =''
			}


			if(req.body.search && req.body.search!="")
			{
				var search = req.body.search
			}
			else
			{
				var search = ""
			}


			if(req.body.timezone && req.body.timezone!="")
			{
				var timezone = req.body.timezone
			}
			else
			{
				var timezone = "America/New_York"
			}

			eventMdl.find({"ended" : false}).sort({eventDate:1}).lean().exec(function(err,eventdata){
				if(err) throw err ;
				(function attachBand(req,res,eventdata,recNum,arrLength){

					if(recNum==arrLength){
						//=========
						var dates = [];
						for(var i=0;i<eventdata.length;i++)
						{
							if (new Date(eventdata[i]['eventDate']).getUTCDate() < 10) {
								if (new Date(eventdata[i]['eventDate']).getUTCMonth() < 9) {
									var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[i]['eventDate']).getUTCDate()
								} else {
									var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[i]['eventDate']).getUTCDate()
								}
							} else {
								if (new Date(eveDate).getUTCMonth() < 9) {
									var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[i]['eventDate']).getUTCDate()
								} else {
									var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[i]['eventDate']).getUTCDate()
								}
							}
							dates.push(eveDate)
						}

						var uniqueDates = dates.filter(function(elem, index, self) {
		  					  return index == self.indexOf(elem);
						})
						var finalEvents=[]
						for(var i=0;i<uniqueDates.length;i++)
						{
							var finalEventsIn = []

							for(var j=0;j<eventdata.length;j++)
							{
								if(search!=''){
									var pattern = new RegExp(search)
									if(!(pattern.test(eventdata[j]['venue']['name'])
								  	|| pattern.test(eventdata[j]['venue']['address'])
								  	|| pattern.test(eventdata[j]['bandName'])
								  	)){ continue; }
								}

								if (new Date(eventdata[j]['eventDate']).getUTCDate() < 10) {
									if (new Date(eventdata[j]['eventDate']).getUTCMonth() < 9) {
										var eveDate = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[j]['eventDate']).getUTCDate()
									} else {
										var eveDate = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[j]['eventDate']).getUTCDate()
									}
								} else {
									if (new Date(eventdata[j]['eventDate']).getUTCMonth() < 9) {
										var eveDate = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[j]['eventDate']).getUTCDate()
									} else {
										var eveDate = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[j]['eventDate']).getUTCDate()
									}
								}
								var eventDateIn = new Date(eventdata[j]['endTime'])
								var now =new Date()


								if(now.getTime() <=eventDateIn.getTime() )
								{

									if(eventdata[j]['location']['latitude']!='' && eventdata[j]['location']['longitude'] && longitude!=undefined &&  latitude!=undefined && latitude!='' && longitude!='')
									{
										var locateDiff = geolib.getDistance(
										    {'latitude': latitude, 'longitude': longitude},
										    {'latitude': eventdata[j]['location']['latitude'], longitude: eventdata[j]['location']['longitude']}
										);
										if(locateDiff>1000000){ continue ; }
									}

									if (new Date(eventdata[j]['eventDate']).getUTCDate() < 10) {
										if (new Date(eventdata[j]['eventDate']).getUTCMonth() < 9) {
											var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[j]['eventDate']).getUTCDate()
										} else {
											var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[j]['eventDate']).getUTCDate()
										}
									} else {
										if (new Date(eventdata[j]['eventDate']).getUTCMonth() < 9) {
											var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[j]['eventDate']).getUTCDate()
										} else {
											var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[j]['eventDate']).getUTCDate()
										}
									}

									if(eveDateIn==uniqueDates[i])
									{
										finalEventsIn.push(eventdata[j])
									}
								}

							}

							if(finalEventsIn.length>=1)
							{
								finalEvents.push({'eventDate':uniqueDates[i],'events':finalEventsIn})
							}
						}
						sortedEvents=[]
						finalEvents.forEach(function(obj){
							var dates = _.sortBy(obj.events,function(inobj){
								return  new Date(inobj.startTime).getTime()
							})
							sortedEvents.push({"eventDate":obj.eventDate, "events":dates})
						})
						res.json(jsend.success({'events':sortedEvents}))
						return

					}
					else
					{
						process.env.TZ = timezone
						var now =new Date()
						var now = new Date(moment(now).tz(timezone).format('YYYY-MM-DD HH:mm'))
						var eventEndIn = new Date(moment(eventdata[recNum]['endTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
						var eventStartIn = new Date(moment(eventdata[recNum]['startTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
						process.env.TZ = 'UTC'
						if(((eventStartIn.getTime()-1800)< now.getTime() && (eventEndIn.getTime()+1800) > now.getTime()) || eventdata[recNum]['started']== true )
						{
							if(eventdata[recNum]['ended']== true ){
								eventdata[recNum]['live']=false;
								eventdata[recNum]['started']=true;
								eventdata[recNum]['ended']=true;
							}
							else{
								if((eventEndIn.getTime()+1800) < now.getTime() ){
									eventdata[recNum]['live']=false;
									eventdata[recNum]['started']=true;
									eventdata[recNum]['ended']=true;
								}
								else{
									eventdata[recNum]['live']=true;
									eventdata[recNum]['started']=true;
									eventdata[recNum]['ended']=false;
								}
							}
						}
						else
						{
							if((eventStartIn.getTime()-1800) > now.getTime()) {
								eventdata[recNum]['live']=false;
								eventdata[recNum]['started']=false;
								eventdata[recNum]['ended']=false;
							}

							if((eventEndIn.getTime()+1800) < now.getTime()) {
								eventdata[recNum]['live']=false;
								eventdata[recNum]['started']=true;
								eventdata[recNum]['ended']=true;
							}
							eventdata[recNum]['live']=false;

						}

			    		        bandMdl.find({'_id':eventdata[recNum]['bandId']}).exec(function(err,banddata){
						  	if(err) throw err ;
							eventdata[recNum]['bandName']=banddata[0]['bandName']
							if(banddata[0]['bandImg'] && banddata[0]['bandImg']!="")
								eventdata[recNum]['bandImg']=banddata[0]['bandImg']
							else
								eventdata[recNum]['bandImg']= "/uploads/band-avtar.png"


							if(udata[0].favorites.indexOf(eventdata[recNum]['bandId']) >-1){
								eventdata[recNum]['favorite']= true
							}
							else
							{
								eventdata[recNum]['favorite']= false
							}


							if(eventdata[recNum]['playlistId'])
							{
								playlistMdl.find({'_id':eventdata[recNum]['playlistId'] }).exec(function(err,playlistData){
									if(err) throw err
									if(playlistData.length){
										eventdata[recNum]['playlistName']=playlistData[0]['playlistName']
									}
									attachBand(req,res,eventdata,++recNum,eventdata.length)
								})
							}
							else
							{
								attachBand(req,res,eventdata,++recNum,eventdata.length)
							}

						})

					}

				})(req,res,eventdata,0,eventdata.length)


			})

		})
	}
	else
	{
		res.json(jsend.failure("No token found"))
		return
	}
}

var getDetailsAction  = function(req,res)
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

			if(req.body.id && req.body.id!="")
			{
				var eventId = req.body.id
			}
			else
			{
				res.json(jsend.failure("Event Id is required"))
				return
			}

			eventMdl.find({'_id': eventId}).lean().exec(function(err,eventdata){
				if(err) throw err;
				if(eventdata.length<1)
				{
					res.json(jsend.failure("No event details found"))
					return
				}

				bandMdl.find({'_id':eventdata[0].bandId}).exec(function(err,banddata){
							if(err) throw err;
							eventdata[0]['bandImg'] = banddata[0]['bandImg']
							res.json(jsend.success({'events':eventdata[0]}))
							return
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


var event = {
	'all':getAllAction,
	'details':getDetailsAction,
}

module.exports = event
