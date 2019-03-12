var userMdl =  require('../../models/users.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var adminMdl =  require('../../models/admin.js')
var bandMdl =  require('../../models/bands.js')
var commonMdl =require('../../models/common.js')
var eventMdl = require('../../models/events.js')
var mongoose = require('mongoose');




/*________________________________________________________________________________
*@Date: 8 September 2017
*@Method : addRadiusAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to add radius.
__________________________________________________________________________________*/
var addRadiusAction=function(req,res){
  if(req.body.token){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body.radius){
					var radius=req.body.radius
          var newmodel={};
          newmodel.radius=radius;
          commonMdl.find({},function(err,data){
            if(err){
              res.json(jsend.failure("Error"))
            }else{
              if(data.length>0){
                var id=data[0]._id;
                commonMdl.update({"_id":id},{$set:{"radius":radius}},function(err,radiusupdated){
                  if(err){
                    res.json(jsend.failure("Error"))
                  }else{
                    res.json(jsend.success({"radiusadded":radiusupdated,"message":"Radius updated Successfully"}))
                  }
                })
              }else{
                commonMdl(newmodel).save(newmodel,function(err,radiusadded){
      						if(err){
      							res.json(jsend.failure("Error"))
      						}else{
      							res.json(jsend.success({"radiusadded":radiusadded,"message":"Radius Added Successfully"}))
      						}
      					})
              }
            }
          })
				}else{
					res.json(jsend.failure("radius not found"))
				}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}
var getRadiusAction=function(req,res){
  if(req.params.token && req.params.token!=""){
    var token=req.params.token;
    adminMdl.find({"token":token},function(err,admindetail) {
      if(err){
          res.json(jsend.failure("Error"))
      }else {
          commonMdl.find({},function(err,commondata){
            if(err){
                res.json(jsend.failure("Error"))
            }else{
              res.json(jsend.success({"commondata":commondata,"message":"Radius found"}))
            }
          })
      }
    })
  }else{
    res.json(jsend.failure("No token found"))
		return
  }
}







var admin = {
  'addRadius':addRadiusAction,
  'getRadius':getRadiusAction
}

module.exports = admin
