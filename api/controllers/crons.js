var userMdl =  require('../models/users.js')
var creditMdl =  require('../models/credits.js')
var requestMdl =  require('../models/requests.js')
var eventMdl =  require('../models/events.js')
var playedMdl =  require('../models/played.js')
var jsend =  require('../plugins/Jsend.js')
var emailtransport =  require('../config/email.js')
var stripe = require("stripe")("sk_test_4tF0KWX6yPNO8udfwQag7aEM");
var async = require('async')
var _ = require('underscore')

var evaluateCredit = function(req,res)
{
	var totalcredits = 0;

	eventMdl.find({'evaluated':false}).lean().exec(function(err,eventdata){
		if(err) throw err ;

		var finalEvents = []
		for(var j=0;j<eventdata.length;j++)
		{
			process.env.TZ = 'UTC'
			var eventDateOut = new Date(eventdata[j]['endTime'])
			now = new Date()
			if(now.getTime() > eventDateOut.getTime() || eventdata[j]['ended'] == true)
			{
				finalEvents.push(eventdata[j])
			}
		}
		requestArr=[]
		async.eachSeries(finalEvents,function(eventData, callback){

			requestMdl.find({'eventId':eventData['_id']}).lean().exec(function(err, requests){
				if(err) throw err ;
				if(requests.length>0){
					for(let i=0;i<requests.length;i++){
					    requestArr.push(requests[i]);
					}
				 }
				callback()
			})
		},function(err){
			if(err) throw err
			var not_playeds=[];
			async.eachSeries(requestArr,function(request,callback){
				playedMdl.find({"eventId":request['eventId'],"songId":request['songId']}).lean().exec(function(err,playeds){
					if(err) throw err;
					if(playeds.length==0){
						not_playeds.push(request);
					}
					callback()
				})
			},function(err){
				if(err) throw err;

				async.eachSeries(not_playeds,function(notplayed,callback){

					totalcredits =  notplayed.credits;

					if(err) throw err;
						creditMdl.find({'userId':notplayed.userId}).lean().exec(function(err,oldcredits){
							if(err) throw err;

							if(oldcredits.length>0){

							var totalcre = oldcredits[0]['creditCount'] + totalcredits;
							creditMdl.update({"userId":oldcredits[0]['userId']},{$set:{'creditCount':totalcre}},function(err,updated){
								if(err) throw err;
								callback()
						 		return
							})
							}
						})
				},function(err){
					if(err) throw err;
					eveRes = _.pluck(finalEvents,"_id")
					eventMdl.update({_id:{"$in":eveRes}},{$set:{"evaluated":true}},{multi:true}).exec(function(err,res){
						if(err) throw err;
					})
				})
			})
		})
	})
}

module.exports = evaluateCredit
