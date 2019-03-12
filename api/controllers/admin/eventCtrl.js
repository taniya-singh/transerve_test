var userMdl =  require('../../models/users.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var adminMdl =  require('../../models/admin.js')
var bandMdl =  require('../../models/bands.js')
var eventMdl = require('../../models/events.js')
var mongoose = require('mongoose');




/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : getallAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to get all users.
__________________________________________________________________________________*/

var fetchEventAction=function(req,res)
{
  var now = new Date();
  timestamp=now.getTime();
  	if(req.params.token && req.params.token!="")
  	{
  		var token = req.params.token
  		adminMdl.find({'token':token}).exec(function(err,admindetail){
  			if(err) throw err ;
  			if(admindetail.length==0){
  				res.json(jsend.failure("Invalid Token"))
  				return
  			}
  			if(req.params.page && req.params.page!=""){
  				var page = req.params.page
  			}else{
  				var page =1
  			}
        if(req.params.eventType && req.params.eventType!=""){
          var eventType=req.params.eventType;
        }else{
          var eventType='All';
        }
  			if(req.query.search && req.params.search!=""){
  				var search = req.query.search
  			}else{
  				var search = ""
  			}
  			eventMdl.find({'is_deleted':false}).exec(function(err,totaldata){
  				if (err) { throw err ;}
  				eventMdl.find({'is_deleted':false}).skip((page*10)-10).limit(10).lean().exec(function(err,eventdata){
              if (err) { throw err ;}
              (function attachBand(req,res,recNum,evlength,eventdata){
                if(recNum==evlength)
                {
                  var final_array=[];
                  if(search==''){
                      search_array=eventdata
                  }else{
                    for(var i=0;i<eventdata.length;i++){
                      var pattern = new RegExp(search)
                      if(pattern.test(eventdata[i].venue.name) || pattern.test(eventdata[i].bandName) || pattern.test(eventdata[i].venue.address)){
                      search_array.push(eventdata[i])
                      }
                    }
                  }
                  var final_array=[]
                  for(var i=0;i<search_array.length;i++)
                  {
                    var eventMoment = new Date(search_array[i]['eventDate']).getTime()
                    if(timestamp >= eventMoment &&  eventType=='Past'  )
                    {
                      final_array.push(search_array[i])
                      totaldata=final_array;
                    }
                    if(timestamp <= eventMoment &&  eventType=='Upcomming'  )
                    {
                      final_array.push(search_array[i])
                      totaldata=final_array;
                    }
                  }
                  if(eventType == 'All'){
                    final_array = search_array
                  }
                  res.json(jsend.success({'events':final_array,'totalPages':Math.ceil(totaldata.length/10)}))
        					return
                }
                else
                {
                  bandMdl.find({_id:eventdata[recNum]['bandId']}).exec(function(err,banddata){
                    if(err) throw err ;
                    if(banddata.length>0){
                      eventdata[recNum]['bandName']=banddata[0]['bandName']
                      eventdata[recNum]['bandImg']=banddata[0]['bandImg']   
                    }
                    attachBand(req,res,++recNum,eventdata.length,eventdata)
                  })
                }
              })(req,res,0,eventdata.length,eventdata)
  				})
  			})
  		})
  	}
  	else{
  		res.json(jsend.failure("No token found"))
  		return
  	}
}

var eventDetailAction=function(req,res){
  if(req.params.token && req.params.token!=""){
    var token=req.params.token;
    adminMdl.find({"token":token},function(err,admin){
      if(err){
        res.json(jsend.failure("Error"))
        return
      }else{
        if(admin.length>0){
          if(req.params.id){
            var eventid=req.params.id
            eventMdl.aggregate([
                  {
                    $match:{'_id' :mongoose.Types.ObjectId(eventid)}
                  },
                  {
                    $lookup:{
                    from : "bands",
                    localField:"bandId",
                    foreignField:"_id",
                    as:"bandDetails"}
                  },
                  {
                    $unwind:"$bandDetails"
                  }
                ],function(err,event_detail){
                    if(err){
                      res.json(jsend.failure("Error"))
                      return
                     }else{
                       res.json(jsend.success({'event_detail':event_detail}))
                       return
                     }
                   })
                }else{
                    res.json(jsend.failure("event id not found"))
                    return
                }
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

var eventUpdateAction=function(req,res){
  if(req.body.token){
		var update={};
    update.venue = {};
		var token=req.body.token;
		var id=req.body.id;
		adminMdl.find({"token":token},function(err,admin){
			if(err){
				res.json(jsend.failure("Invalid token"))
			}else{
				if(admin.length>0){
					if(req.body.startTime && req.body.startTime!=""){
						update.startTime=req.body.startTime;
					}
					if(req.body.endTime && req.body.endTime!=""){
						update.endTime=req.body.endTime;
					}
          if(req.body.eventDate && req.body.eventDate!=""){
						update.eventDate=req.body.eventDate;
					}
          if(req.body.venueName && req.body.venueName!=""){
            update.venue.name = req.body.venueName;
          }
          console.log("update",update)
					eventMdl.update({"_id":id},{$set:update},function(err,updated){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							res.json(jsend.success({'update':updated}))
						}
					})
				}else{
				res.json(jsend.failure("Invalid token"))
				return
				}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}

var eventDeleteAction=function(req,res){
  if(req.body.token){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body.id){
					var id=req.body.id
					eventMdl.update({"_id":id},{$set:{"is_deleted":true}},function(err,deleted){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							console.log(deleted)
							res.json(jsend.success({"deleted":deleted,"message":"Deleted Successfully"}))
						}
					})
				}else{
					res.json(jsend.failure("Id not found"))
				}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}

var eventCountAction=function(req,res){if(req.params.token && req.params.token!=""){
		var token=req.params.token
		adminMdl.find({"token":token},function(err,admindetail){
			if(admindetail.length>0){
				eventMdl.count({"is_deleted":false},function(err,eventCount){
					if(err){
						res.json(jsend.failure("Err"))
						return
					}else{
						res.json(jsend.success({"eventCount":eventCount,"message":"total event count retreived Successfully"}))
					}
				})
			}else{
				res.json(jsend.failure("Invalid token"))
				return
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}
var admin = {

  'fetchEvent':fetchEventAction,
  'eventDetail':eventDetailAction,
  'eventUpdate':eventUpdateAction,
  'eventDelete':eventDeleteAction,
  'eventCount':eventCountAction


}

module.exports = admin
