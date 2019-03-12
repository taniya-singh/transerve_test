var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var adminMdl =  require('../../models/admin.js')
var bandMdl =  require('../../models/bands.js')
var playlistMdl = require('../../models/playlists.js')
var defautsongsMdl = require('../../models/songlist.js')
var songMdl = require('../../models/songs.js');

var mongoose = require('mongoose');




/*________________________________________________________________________________
*@Date: 14 Septemper 2017
*@Method : getallAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to get all playlists.
__________________________________________________________________________________*/

var getallAction = function(req,res)
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
			playlistMdl.find({'playlistName': new RegExp(search),"is_deleted":false}).exec(function(err,totaldata){
				if (err) { throw err ;}
				playlistMdl.aggregate([
				
			    {$lookup:{
			        from:"bands",
			        localField:"bandId",
			        foreignField:"_id",
			        as:"bandinfo" 
			        }
			    },
    			{$unwind:"$bandinfo"},
    			{
					$match:{$and:[{$or:[{'playlistName':RegExp(search)},{'bandinfo.bandName':RegExp(search)}]},{'is_deleted':false}]}
				}
				]).skip((page*10)-10).limit(10).exec(function(err,playlistdata){
					if (err) { throw err ;}
					for(var i=0;i<playlistdata.length;i++){
						  playlistdata[i].bandName=playlistdata[i].bandinfo.bandName;
					}
					res.json(jsend.success({'playlists':playlistdata,'totalPages':Math.ceil(totaldata.length/10)}))
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
var deleteAction=function(req,res){
	if(req.body.token){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body._id){
					var id=req.body._id
					playlistMdl.update({"_id":id},{$set:{"is_deleted":true}},function(err,deleted){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							songMdl.update({"playlistId":id},{$set:{"is_deleted":true}},function(err,del){
								if(err) throw err;
								else{
									console.log(del)
									res.json(jsend.success({"deleted":del,"message":"Playlist Deleted Successfully"}))
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

/*________________________________________________________________________________
*@Date: 14 September 2017
*@Method : updateinfoAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to update information of particular band.
________________________________________________________________________________ */

var updateAction=function(req,res){
	if(req.body.token && req.body.id){
		var update={};
		var token=req.body.token;
		var id=req.body.id;
		adminMdl.find({"token":token},function(err,admin){
			if(err){
				res.json(jsend.failure("Invalid token"))
			}else{
				if(admin.length>0){
					if(req.body.playlistName && req.body.playlistName!=""){
						update.playlistName=req.body.playlistName;
					}
					playlistMdl.update({"_id":id},{$set:update},function(err,updated){
						if(err){
							res.json(jsend.failure("Error"))
						}else{
							res.json(jsend.success({'update':updated,'message':"Playlist updated successfully"}))
						}
					})
				}else{
				res.json(jsend.failure("Invalid token"))
				return
				}
			}
		})
	}else{
		res.json(jsend.failure("No token or Id found"))
		return
	}
}


var getAction=function(req,res){
	if(req.params.token && req.params.token!=""){
    var token=req.params.token;
    adminMdl.find({"token":token},function(err,admin){
      if(err){
        res.json(jsend.failure("Error"))
        return
      }else{
        if(admin.length>0){
          if(req.params.id){
            var playlistid=req.params.id
            playlistMdl.aggregate([
                  {
                    $match:{'_id' :mongoose.Types.ObjectId(playlistid)}
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
                ],function(err,playlist_detail){
                    if(err){
                      res.json(jsend.failure("Error"))
                      return
                     }else{
                     	for(var i=0;i<playlist_detail.length;i++){
                     		playlist_detail[i].bandName=playlist_detail[i].bandDetails.bandName;
                     	}
                       res.json(jsend.success({'playlist_detail':playlist_detail}))
                       return
                     }
                   })
                }else{
                    res.json(jsend.failure("playlist id not found"))
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
var getPlaylistAction=function(req,res){
	var page;
	if(req.params.token && req.params.token!=""){
		var token=req.params.token;
		adminMdl.find({"token":token},function(err,admin){
			if(err){
				res.json(jsend.failure("Error"))
        		return
			}else{
				 if(admin.length>0){
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
					if(req.params.id && req.params.id!=""){
						var id=req.params.id;
						playlistMdl.find({'bandId':id},function(err,totaldata){
							if(err) throw err;
							else{
								if(totaldata.length>0){
									playlistMdl.find({"bandId":id,'playlistName': new RegExp(search)}).skip((page*10)-10).limit(10).exec(function(err,playlist_detail){
										if(err){
											res.json(jsend.failure("Error"))
											return
										}else{
											res.json(jsend.success({'playlist_detail':playlist_detail,'totalPages':Math.ceil(totaldata.length/10),'message':"Playlist found"}))
			                      			return
										}
									})	
								}
							}
 						})	
					}else{
						res.json(jsend.failure("band Id not found"))
						return
					}
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
var playlistCountAction=function(req,res){
	if(req.params.token && req.params.token!=""){
		var token=req.params.token
		adminMdl.find({"token":token},function(err,admindetail){
			if(admindetail.length>0){
				playlistMdl.count({"is_deleted":false},function(err,playlists){
					if(err){
						res.json(jsend.failure("Err"))
						return
					}else{
						res.json(jsend.success({'playlists':playlists,'message':"retreived Successfully"}))
						return
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
var defaultSongAction=function(req,res){
	if(req.params.token && req.params.token!=""){
    var token=req.params.token;
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
    adminMdl.find({"token":token},function(err,admin){
      if(err){
        res.json(jsend.failure("Error"))
        return
      }else{
        if(admin.length>0){
          	if(req.params.id){
            	var bandid=req.params.id
            	defautsongsMdl.find({'bandId':bandid,'is_deleted':false,$or:[{'collectionName': new RegExp(search)},{'track': new RegExp(search)},{'genre': new RegExp(search)},{'artist': new RegExp(search)}]},function(err,totaldata){
            		if(err) throw err;
            		else{
            			defautsongsMdl.find({'bandId':bandid,'is_deleted':false,$or:[{'collectionName': new RegExp(search)},{'track': new RegExp(search)},{'genre': new RegExp(search)},{'artist': new RegExp(search)}]}).skip((page*10)-10).limit(10).exec(function(err,songs){
                    		if(err){
                      			res.json(jsend.failure("Error"))
                      			return
                     		}else{
                       			res.json(jsend.success({'songs':songs,'totalPages':Math.ceil(totaldata.length/10),'message':"songs retreived successfully"}))
                       			return
                       		}
                   		})
            		}
            	})     
        	}else
        	{
            	res.json(jsend.failure("bandid id not found"))
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

var deletedSongAction = function(req,res){
	if(req.body.token){
		var token=req.body.token;
		adminMdl.find({"token":token},function(err,admindetail){
			if(err){
				res.json(jsend.failure("Error"))
			}else{
				if(req.body.id){
					var id=req.body.id
					defautsongsMdl.update({"_id":id},{$set:{"is_deleted":true}},function(err,deleted){
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


var admin = {
	'getAllPlaylists':getallAction,
	'deletePlaylist':deleteAction,
	'fetchPlaylist':getAction,
	'updatePlaylist':updateAction,
	'getBandPlaylist':getPlaylistAction,
	'playlistCount':playlistCountAction,
	'defaultPlaylist':defaultSongAction,
	'deleteSong':deletedSongAction
}

module.exports = admin
