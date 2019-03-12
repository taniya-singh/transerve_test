var stripe = require("stripe")("sk_test_4tF0KWX6yPNO8udfwQag7aEM");
var bandUserMdl =  require('../../models/bandUsers.js')
var jsend =  require('../../plugins/Jsend.js')
var userMdl =  require('../../models/users.js')

var createuser=function(req,res){

	if(req.body.token && req.body.token!=""){
		var token=req.body.token;
	}else{
		res.json(jsend.failure("No Token Found"))
			return
	}
	userMdl.find({"token":token}).exec(function(err,userDetail){
		if(err) throw err;
		if(userDetail.length==0){
			res.json(jsend.failure("Invalid Token"))
			return
		}else{
			if(userDetail[0].stripeId==''){
				stripe.customers.create({
				  description: userDetail[0].email

				},function(err, customer) {
				  if(err) throw err;
				  if(customer.length==0){
				  	res.json(jsend.failure("User Not Created"))
					return
				  } else{
				  	userMdl.update({"token":token},{$set:{"stripeId":customer.id}},function(err,updated){
				  		if(err) throw err;
				  		if(updated.length==0){
				  			res.json(jsend.failure("User Not Updated"))
							return
				  		}else{
				  			res.json(jsend.success(customer,"User Created Successfully"))
							return
				  		}
				  	})
				  }
				});
			}else{
				stripe.customers.retrieve(
				 userDetail[0].stripeId,
				  function(err, customer) {
				    if(err) throw err;
				    res.json(jsend.success(customer,'User Retreived Successfully'))
					return
				  }
				);
			}
		}
	}, function(err){
		res.json(jsend.failure("Error"))
		return
	})
}

var create_card=function(req,res){
	var cardinfo=[];
	if(req.body.token && req.body.token!=""){
		var token=req.body.token;
	}else{
		res.json(jsend.failure("No Token Found"))
		return
	}
	if(req.body.cardno && req.body.cardno!=""){
		var number=req.body.cardno
	}else{
		res.json(jsend.failure("Card Number Not Found"))
		return
	}
	if(req.body.exp_month && req.body.exp_month!=""){
		var exp_month=req.body.exp_month
	}else{
		res.json(jsend.failure("Expire Month Not Found"))
		return
	}
	if(req.body.exp_year && req.body.exp_year!=""){
		var exp_year=req.body.exp_year
	}else{
		res.json(jsend.failure("Expire Year Not Found"))
		return
	}
	if(req.body.cvc && req.body.cvc!=""){
		var cvc=req.body.cvc
	}else{
		res.json(jsend.failure("CVC Number Not Found"))
		return
	}
	if(req.body.set_default===false){
		var set_def=req.body.set_default
	}else{
		var set_def=true;
	}
	userMdl.find({"token":token},function(err,user){
		if(err){
			res.json(jsend.failure(err))
			return
		};
		if(user.length>0){
			if(user[0].stripeId==""){
				res.json(jsend.failure("User Not Registered On Stripe"))
				return
			}else{

				stripe.tokens.create({
				  card: {
				    "number": number,
				    "exp_month": exp_month,
				    "exp_year": exp_year,
				    "cvc": cvc
				  }
				}, function(err, cardtoken) {
				  	if(err) {
						res.json(jsend.failure(err.message))
						return
					}
					stripe.customers.createSource(
					  	user[0].stripeId,
						{ source: cardtoken.id },
						function(err, card) {
						       if(err) throw err;
							cardinfo.push(card.id);
							stripe.customers.listCards(user[0].stripeId, function(err, cards) {
								if(err){
									res.json(jsend.failure(err.message))
									return
								}else{

									if(cards.data.length==1){
										var cardid=cards.data[0].id;
										userMdl.update({"token":token},{$set:{'default_card':cardid,'default_card_token':cardtoken.id}},{lean:true},function(err,updated){
										   	if(err) {
												res.json(jsend.failure(err))
												return
											}
										})
									}
									if(set_def===true){
										userMdl.update({"token":token},{$set:{'default_card':card.id,'default_card_token':cardtoken.id}},function(err,setdef){
											if(err){
												res.json(jsend.failure(err))
												return
											}
										})
									}
									userMdl.update({"token":token},{$addToSet:{cards: {$each: cardinfo}}},function(err,data){
										if(err) throw err;
										res.json(jsend.success(card,'Card created successfully'))
										return
									})
								}
							})
						  }
					);

				});
			}

		}else{
			res.json(jsend.failure("Invalid Token"))
			return
		}
	})
}

var listcards=function(req,res){
	if(req.body.token && req.body.token!=""){
		var token=req.body.token;
	}else{
		res.json(jsend.failure("No Token Found"))
		return
	}
	userMdl.find({"token":token},function(err,user){
		if(user.length>0){
			if(user[0].stripeId==""){
				res.json(jsend.failure("User Is Not Registered On Stripe"))
				return
			}else{
				stripe.customers.listCards(user[0].stripeId, function(err, cards) {
				  	if(err){
						res.json(jsend.failure(err.message))
						return
				  	}else{
						cards.default_card=user[0].default_card;
						res.json(jsend.success(cards,'Card Retreived Successfully'))
						return
					}
				});
			}

		}else{
			res.json(jsend.failure("Invalid Token"))
			return
		}
	})

}


var deletecard=function(req,res){
	if(req.body.token && req.body.token!=""){
		var token=req.body.token;
	}else{
		res.json(jsend.failure("No Token Found"))
		return
	}
	if(req.body.cardid && req.body.cardid!=""){
		var cardid=req.body.cardid;
	}else{
		res.json(jsend.failure("Card Id Not Found"))
		return
	}
	userMdl.find({"token":token},function(err,user){
		if(user.length>0){
			if(user[0].stripeId==""){
				res.json(jsend.failure("User Is Not Registered On Stripe"))
				return
			}else{
				stripe.customers.deleteCard(
					user[0].stripeId,
					cardid,
					function(err, confirmation) {
					    if(err) {
						res.json(jsend.failure(err.message))
						return
	 			            }else{
						res.json(jsend.success(confirmation,'Deleted Successfully'))
						return
					    }
					}
				);
			}
		}else{
			res.json(jsend.failure("Invalid Token"))
			return
		}

	})

}

var updatecard=function(req,res){
	var info={}
	if(req.body.token && req.body.token!=""){
		var token=req.body.token;
	}else{
		res.json(jsend.failure("No Token Found"))
		return
	}
	if(req.body.cardid && req.body.cardid!=""){
		var cardid=req.body.cardid;
	}else{
		res.json(jsend.failure("Card Id Not Found"))
		return
	}
	if(req.body.city && req.body.city!=""){
		info.address_city=req.body.city;
	}
	if(req.body.country && req.body.country!=""){
		info.address_country=req.body.country;
	}
	if(req.body.state && req.body.state!=""){
		info.address_state=req.body.state;
	}
	if(req.body.zip && req.body.zip!=""){
		info.address_zip=req.body.zip;
	}
	if(req.body.address_line1 && req.body.address_line1!=""){
		info.address_line1=req.body.address_line1;
	}
	if(req.body.address_line2 && req.body.address_line2!=""){
		info.address_line2=req.body.address_line2;
	}
	if(req.body.exp_month && req.body.exp_month!=""){
		info.exp_month=req.body.exp_month;
	}
	if(req.body.exp_year && req.body.exp_year!=""){
		info.exp_year=req.body.exp_year;
	}
	if(req.body.name && req.body.name!=""){
		info.name=req.body.name;
	}
	if(req.body.set_default){
		var set_default=true
	}else{
		var set_default=false;
	}
	userMdl.find({"token":token},function(err,user){
		if(user.length>0){
			if(user[0].stripeId==""){
				res.json(jsend.failure("User Is Not Registered On Stripe"))
				return
			}else{
				stripe.customers.updateCard(
					  user[0].stripeId,
					  cardid,
					  info,
					  function(err, card) {
				              if(err){
						  res.json(jsend.failure(err.message))
						  return
					      }else{
							if(set_default===true){
								userMdl.update({"token":token},{$set:{'default_card':cardid}},function(err,setdef){
									if(err){
										res.json(jsend.failure(err))
										return
									}
								})
							}
						  res.json(jsend.success(card,'Updated Successfully'))
						  return
					      }
					  }
				);
			}
		}else{
			res.json(jsend.failure("Invalid Token"))
			return

		}
	})
}


var pay = {
	'create':createuser,
	'addcard':create_card,
	'listcards':listcards,
	'deletecard':deletecard,
	'updatecard':updatecard
}

module.exports = pay
