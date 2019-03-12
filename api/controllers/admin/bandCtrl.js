var userMdl =  require('../../models/users.js')
var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var adminMdl =  require('../../models/admin.js')
var bandMdl =  require('../../models/bands.js')
var songMdl = require('../../models/songs.js')
var playlistMdl = require('../../models/playlists.js')
var bandUserMdl =  require('../../models/bandUsers.js')







/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : loginAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to get all bands.
__________________________________________________________________________________*/

var getallAction  = function(req,res)
{
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
			if(req.query.search && req.params.search!=""){
				var search = req.query.search
			}else{
				var search = ""
			}
			bandMdl.find({'bandName': new RegExp(search)}).exec(function(err,totaldata){
				if (err) { throw err ;}
				bandMdl.find({$or:[{'bandName': new RegExp(search)},{'email':new RegExp(search)}],'is_deleted':false}).skip((page*10)-10).limit(10).exec(function(err,banddata){
					if (err) { throw err ;}
					res.json(jsend.success({'bands':banddata,'totalPages':Math.ceil(totaldata.length/10)}))
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
/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : getInfoAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to get particular band for given id.
__________________________________________________________________________________*/

var getInfoAction=function(req,res){
	if(req.body.token && req.body.token!=""){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admin){
			if(err){
				res.json(jsend.failure("Error"))
				return
			}else{
				if(admin.length>0){
					if(req.body._id){
						var bandid=req.body._id
						bandMdl.find({"_id":bandid,"is_deleted":false},function(err,band_detail){
							if(err){
								res.json(jsend.failure("Error"))
								return
							}else{
								res.json(jsend.success({'band_detail':band_detail}))
								return
							}
						})
					}else{
						res.json(jsend.failure("Band id not found"))
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
/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : updateinfoAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to update information of particular band.
________________________________________________________________________________ */

var updateinfoAction=function(req,res){
	if(req.body.token){
		var update={};
		var token=req.body.token;
		var id=req.body.id;
		adminMdl.find({"token":token},function(err,admin){
			if(err){
				res.json(jsend.failure("Invalid token"))
			}else{
				if(admin.length>0){
					if(req.body.name && req.body.name!=""){
						update.bandName=req.body.name;
					}
					if(req.body.email && req.body.email!=""){
						update.email=req.body.email;
					}
					bandMdl.update({"_id":id},{$set:update},function(err,updated){
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
/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : updateStateAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to update status of band from active to inactive and vice-versa.
________________________________________________________________________________ */

var updateStateAction =function(req,res){
	if(req.body.bandId){
	var bandId=req.body.bandId
	}else{
		res.json(jsend.failure("bandId is required"));	
	}
	if(req.body.token){
		var token=req.body.token;

		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body.banduserId){
					var banduserid=req.body.banduserId;
					bandUserMdl.find({"bandId":bandId},function(err,bands){
					console.log("bands",bands)
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							if(bands.length>0){
								if(bands[0].status==true){
									bandUserMdl.update({"_id":banduserid},{$set:{"status":false}},function(err,dataupdated){
										if(err){
											res.json(jsend.failure("Error"))
										}else{
											res.json(jsend.success({"updated":dataupdated,"banddetails":bands,"message":"updated Successfully"}))
										}
									})
								}else{
									bandUserMdl.update({"_id":banduserid},{$set:{"status":true}},function(err,dataupdated){
										if(err){
											res.json(jsend.failure("Error"))
										}else{
											res.json(jsend.success({"updated":dataupdated,"banddetails":bands,"message":"updated Successfully"}))
										}
									})
								}
							}
						}
					})

				}else{
					res.json(jsend.failure("Band id not found"))
					return;
				}
			}
		})
	}else{
		res.json(jsend.failure("No token found"))
		return
	}
}
/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : deleteAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to delete a band corresponding to given id
________________________________________________________________________________ */

var deleteAction=function(req,res){
	var playlistIds=[];
	if(req.body.token){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body._id){
					var id=req.body._id
					bandMdl.update({"_id":id},{$set:{"is_deleted":true}},function(err,deleted){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							playlistMdl.find({"bandId":id},function(err,playlists){
								if(err) throw err;
								else{
									for(var i=0;i<playlists.length;i++){
										playlistIds.push(playlists[i]._id)		
									}
									playlistMdl.update({"bandId":id},{$set:{"is_deleted":true}},function(err,songsupdated){
										if(err) throw err;
										else{
											for(var i=0;i<playlistIds.length;i++){
												var id=playlistIds[i];
												songMdl.update({"playlistId":id},{$set:{"is_deleted":true}},function(err,songsdeleted){
													if(err) throw err;
													else{			
														console.log(deleted)
														res.json(jsend.success({"deleted":songsdeleted,"message":"Deleted Successfully"}))
													}
												})
											}		
										}
									})	
								}
							})
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

var bandCountAction=function(req,res){
	if(req.params.token && req.params.token!=""){
		var token=req.params.token
		adminMdl.find({"token":token},function(err,admindetail){
			if(admindetail.length>0){
				bandMdl.count({"is_deleted":false},function(err,bandCount){
					if(err){
						res.json(jsend.failure("Err"))
						return
					}else{
						res.json(jsend.success({"bandCount":bandCount,"message":"total band count retreived Successfully"}))
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


var getBandUser =function(req,res){
	if(req.body.token && req.body.token!=""){
		var token=req.body.token
		adminMdl.find({"token":token},function(err,admindetail){

			if(req.body.bandId && req.body.bandId!=""){
				var bandId=req.body.bandId;			
			}else{
				res.json(jsend.failure("BandId is required"));			
			}

			if(admindetail.length>0){
				bandUserMdl.find({'bandId':bandId,"is_deleted":false},function(err,users){
					if(err){
						res.json(jsend.failure("Err"))
						return
					}else{
						res.json(jsend.success(users))

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
	'getAllBands':getallAction,
	'fetchBand':getInfoAction,
	'updateBandInfo':updateinfoAction,
	'changeStatus':updateStateAction,
	'deleteBand':deleteAction,
	'getBandUser':getBandUser,
	'bandCount':bandCountAction
}

module.exports = admin
