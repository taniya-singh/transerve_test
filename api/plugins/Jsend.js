var success = function(data={},message="",code=200){
  return {'status':'Success','message':message,"data":data}
}
var failure = function(message="",data={},code=200){
  return {'status':'Failure','message':message,"data":data}
}
module.exports = {'success':success,'failure':failure}
