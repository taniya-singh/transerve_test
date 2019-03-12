var jsend =  require('../../plugins/Jsend.js')
var emailtransport =  require('../../config/email.js')
var adminMdl =  require('../../models/admin.js')
var bandMdl =  require('../../models/bands.js')
var songMdl = require('../../models/songs.js')
var mongoose = require('mongoose');
var playlistMdl=require('../../models/playlists.js');
var songlistMdl =  require('../../models/songlist.js')






/*________________________________________________________________________________
*@Date: 17 May 2017
*@Method : getallAction
*Created By: smartData Enterprises Ltd
*Modified On: -
*@Purpose: Function to get all users.
__________________________________________________________________________________*/

var getSongsAction  = function(req,res)
{
   var page,search,id;
    if(req.params.token && req.params.token!="")
    {
      var token = req.params.token
      if(req.params.page && req.params.page!=""){
        var page=req.params.page;
      }else{
        page=1;
      }
      if(req.query.search && req.params.search!=""){
        var search=req.query.search;
      }else{
        search="";
      }
      if(req.params.id && req.params.id!=""){
        var id=req.params.id;
      }
      adminMdl.find({'token':token}).exec(function(err,admindetail){
        if(err) throw err ;
        if(admindetail.length==0){
          res.json(jsend.failure("Invalid Token"))
          return
        }else{

    playlistMdl.find({"_id":id},function(err,data){
      if(err) throw err;
      else{ 


        songlistMdl.find({'_id':{$in:data[0]['songs']}}).exec(function(err,songdata){
          if(err) throw err;
          else{
            if(songdata.length>0){
              res.json(jsend.success({'songs':songdata,'totalPages':Math.ceil(songdata.length/10),'message':"Songs found"}))
                    return        
            }else{
              res.json(jsend.success({'songs':songdata,'totalPages':Math.ceil(songdata.length/10),'message':"No songs found"}))
          
            }
          
          }       
        });

      }   
    })

        }
    })
  }else{
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
        if(req.body.id){
          var id=req.body.id
    if(req.body.playlist_id){
      var playlist_Id=req.body.playlist_id;

      playlistMdl.update({_id:playlist_Id},{$pull:{'songs':id}}).exec(function(err,songs){
        if(err) throw err;
        else{
           res.json(jsend.success({ "deleted": songs, "message": "Deleted Successfully" }))
        }   
      })
    
    }else{
      res.json(jsend.failure("playlistId not found")) 
    }
        }else{
          res.json(jsend.failure("song Id not found"))
        }
      }
    })
  }else{
    res.json(jsend.failure("No token found"))
    return
  }
}

var admin = {
  'getPlaylistSongs':getSongsAction,
  'deleteSong':deleteAction
}

module.exports = admin