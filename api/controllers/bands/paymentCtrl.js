var stripe = require("stripe")("sk_test_4tF0KWX6yPNO8udfwQag7aEM");
var bandUserMdl = require('../../models/bandUsers.js')
var jsend = require('../../plugins/Jsend.js')

var createaccount = function(req, res) {
	if (req.body.token && req.body.token != "") {
		var token = req.body.token;
	} else {
		res.json(jsend.failure("Token Not Found"))
		return
	}
	bandUserMdl.find({
		"token": token
	}).exec(function(err, banduserDetail) {
		if (err) throw err;
		if (banduserDetail.length == 0) {
			res.json(jsend.failure("Invalid Token"))
			return
		} else {
			if (banduserDetail[0].stripe_accountId == '' || !banduserDetail[0].stripe_accountId) {
				stripe.accounts.create({
					type: 'standard',
					country: 'US',
					email: banduserDetail[0].email
				}, function(err, account) {
						if (req.body.account_holder_name && req.body.account_number && req.body.routing_number) {
							bandUserMdl.update({
								"token": token
							}, {
								$set: {
									"stripe_accountId": account.id,
									"bank_details": {
										"account_holder_name": req.body.account_holder_name,
										"account_number": req.body.account_number,
										"routing_number": req.body.routing_number,
									}
								}
							}, function(err, updated) {
								if (err) throw err;
								if (updated.length == 0) {
									res.json(jsend.failure("Account Not Updated"))
									return
								} else {
									createBankAccount(req, res, token, banduserDetail);
								}
							});
						} else {
							if(banduserDetail[0].bank_details)
							{
								createBankAccount(req, res, token, banduserDetail);
							}
							else {
								res.json(jsend.failure("Please Give Bank Details"))
							}
						}
				});
			} else {
					if (req.body.account_holder_name && req.body.account_number && req.body.routing_number) {
						bandUserMdl.update({
							"token": token
						}, {
							$set: {
								"bank_details": {
									"account_holder_name": req.body.account_holder_name,
									"account_number": req.body.account_number,
									"routing_number": req.body.routing_number,
								}
							}
						}, function(err, updated) {
							if (err) throw err;
							if (updated.length == 0) {
								res.json(jsend.failure("Account Not Updated"))
								return
							} else {
								createBankAccount(req, res, token, banduserDetail);
							}
						})
					} else {
						if(banduserDetail[0].bank_details)
						{
							createBankAccount(req, res, token, banduserDetail);
						}
						else {
							res.json(jsend.failure("Please give Bank Details"))
						}
					}

			}
		}
	}, function(err) {
		res.json(jsend.failure("Error"))
		return
	});
}

createBankAccount = function(req, res, token, banduserDetail) {
	console.log("token",token)
	console.log("banduserDetail",banduserDetail)
	if (banduserDetail[0].bank_account_token == '') {
		if (req.body.account_holder_name && req.body.account_number && req.body.routing_number) {
			stripe.tokens.create({
				bank_account: {
					country: 'US',
					currency: 'usd',
					account_holder_name: req.body.account_holder_name,
					account_holder_type: 'individual',
					routing_number: req.body.routing_number,
					account_number: req.body.account_number
				}
			}, function(err, banktoken) {
				if (!banktoken || banktoken == null) {
					res.json(jsend.failure("Invalid Account Number"))
					return
				} else {
					bandUserMdl.update({
						"token": token
					}, {
						$set: {
							"bank_account_token": banktoken.id
						}
					}, function(err, updated) {
						if (err) throw err;
						if (updated.length == 0) {
							res.json(jsend.failure("Account not updated"))
							return
						} else {
							bandUserMdl.find({
								"token": token
							}).exec(function(err, bandusers) {
								stripe.tokens.retrieve(
									bandusers[0].bank_account_token,
									function(err, bankaccount) {
										if (!bankaccount || bankaccount == '') {
											stripe.accounts.createExternalAccount(
												bandusers[0].stripe_accountId, {
													external_account: bandusers[0].bank_account_token
												},
												function(err, bank_ext_account) {
													stripe.tokens.retrieve(
														banduserDetail[0].bank_account_token,
														function(err, bank_account) {

															bank_account.bank_account.account_holder_name = bandusers[0].bank_details.account_holder_name;
															bank_account.bank_account.name = bandusers[0].bank_details.account_holder_name;
															bank_account.bank_account.routing_number = bandusers[0].bank_details.routing_number;
															bank_account.bank_account.account_number = bandusers[0].bank_details.account_number;
															res.json(jsend.success(bank_account, 'Bank account created successfully'))
														});
												}
											);
										} else {

											bankaccount.bank_account.account_holder_name = bandusers[0].bank_details.account_holder_name;
											bankaccount.bank_account.name = bandusers[0].bank_details.account_holder_name;
											bankaccount.bank_account.routing_number = bandusers[0].bank_details.routing_number;
											bankaccount.bank_account.account_number = bandusers[0].bank_details.account_number;
											res.json(jsend.success(bankaccount, 'Bank account created successfully'))
										}
									}
								);
							});
						}
					})
				}
			});
		} else {
			res.json(jsend.failure("Please send bank details"))
		}

	} else {
		bandUserMdl.find({
			"token": token
		}).exec(function(err, bandusers) {
			stripe.tokens.retrieve(
				banduserDetail[0].bank_account_token,
				function(err, bankaccount) {
					if (!bankaccount || bankaccount == '') {
						stripe.accounts.createExternalAccount(
							banduserDetail[0].stripe_accountId, {
								external_account: banduserDetail[0].bank_account_token
							},
							function(err, bank_account) {
								stripe.tokens.retrieve(
									banduserDetail[0].bank_account_token,
									function(err, bank_account) {
										bank_account.bank_account.account_holder_name = bandusers[0].bank_details.account_holder_name;
										bank_account.bank_account.name = bandusers[0].bank_details.account_holder_name;
										bank_account.bank_account.routing_number = bandusers[0].bank_details.routing_number;
										bank_account.bank_account.account_number = bandusers[0].bank_details.account_number;
										res.json(jsend.success(bank_account, 'Bank account created successfully'))
									});
							}
						);
					} else {
						bankaccount.bank_account.account_holder_name = bandusers[0].bank_details.account_holder_name;
						bankaccount.bank_account.name = bandusers[0].bank_details.account_holder_name;
						bankaccount.bank_account.routing_number = bandusers[0].bank_details.routing_number;
						bankaccount.bank_account.account_number = bandusers[0].bank_details.account_number;
						res.json(jsend.success(bankaccount, 'Bank account created successfully'))
					}
				}
			);
		});
	}
}



var pay = {
	'create': createaccount
}

module.exports = pay
