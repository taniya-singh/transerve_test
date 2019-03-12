var userMdl = require('../../models/users.js')
var creditMdl = require('../../models/credits.js')
var adminMdl = require('../../models/admin.js')
var bandUserMdl = require('../../models/bandUsers.js')
var requestMdl = require('../../models/requests.js')
var playedMdl = require('../../models/played.js')
var jsend = require('../../plugins/Jsend.js')
var emailtransport = require('../../config/email.js')
var stripe = require("stripe")("sk_test_4tF0KWX6yPNO8udfwQag7aEM");

var addAction = function(req, res) {
  if (req.body.token && req.body.token != "") {
    var token = req.body.token
    userMdl.find({
      'token': token
    }).exec(function(err, userdata) {
      if (err) throw err;
      if (userdata.length == 0) {
        res.json(jsend.failure("Invalid Token"))
        return
      } else {
        if (req.body.credit && req.body.credit != "" && req.body.credit != 0) {
          var credit = req.body.credit
        } else {
          res.json(jsend.failure("Please Enter Credits"))
          return
        }
        creditMdl.find({
          'userId': userdata[0]['_id']
        }).exec(function(err, data) {
          if (err) throw err;
          if (data.length == 0) {
            var credits = new creditMdl({
              'userId': userdata[0]['_id'],
              'creditCount': credit
            })
            credits.save()
            proceed_to_pay(res, req.body.credit, credit, req.body.card_token, userdata[0].stripeId, userdata[0]['_id']);
          } else {
            var totalCredit = data[0]['creditCount'] + parseInt(credit)
            proceed_to_pay(res, req.body.credit, totalCredit, req.body.card_token, userdata[0].stripeId, userdata[0]['_id']);
          }
        })
      }
    })
  } else {
    res.json(jsend.failure("No token found"))
  }
}

proceed_to_pay = function(res, credits, totalCredit, cardid, customerid, userId) {
  adminMdl.find({
    "email": "tom@covet.com"
  }).exec(function(err, adminDetail) {
    if (err) throw err;
    if (adminDetail.length == 0) {
      res.json(jsend.failure("Invalid token"))
      return
    } else {
      if (!adminDetail[0].stripe_accountId || adminDetail[0].stripe_accountId == '') {
        stripe.accounts.create({
          type: 'standard',
          country: 'US',
          email: adminDetail[0].email
        }, function(err, account) {
          if (err) throw err;
          if (account.length == 0) {
            res.json(jsend.failure("Account Not Created"))
            return
          } else {
            adminMdl.update({
              "email": "tom@covet.com"
            }, {
              $set: {
                "stripe_accountId": account.id
              }
            }, function(err, updated) {
              if (err) throw err;
              payment(res, credits, totalCredit, account.id, cardid, customerid, userId);
            })
          }
        });
      } else {
        stripe.accounts.retrieve(
          adminDetail[0].stripe_accountId,
          function(err, account) {
            if (err) throw err;
            payment(res, credits, totalCredit, adminDetail[0].stripe_accountId, cardid, customerid, userId);
          }
        );
      }
    }
  })
}

payment = function(res, credits, totalCredit, adminid, cardid, customerid, userId) {
  var payamout = credits * 200
  stripe.charges.create({
    amount: payamout,
    currency: "usd",
    source: cardid,
    customer: customerid,
    destination: {
      account: adminid
    },
    description: "Charge for Source"
  }, function(err, charge) {
    if (err)
      res.status(403).json(jsend.failure("You have entered wrong card token"));
    else {
      creditMdl.update({
        'userId': userId
      }, {
        $set: {
          'creditCount': totalCredit
        }
      }).exec(function(err, updateData) {
        if (err) throw err;
        res.json(jsend.success({
          credits: totalCredit
        }, "Credits Added Successfully"))
      });
    }
  });
}

var getAction = function(req, res) {
  if (req.body.token && req.body.token != "") {
    var token = req.body.token
    var creditsArr = [{
      "credits": "1",
      "amount": "2.99"
    }, {
      "credits": "5",
      "amount": "9.99"
    }, {
      "credits": "10",
      "amount": "17.99"
    }, {
      "credits": "20",
      "amount": "33.99"
    }, {
      "credits": "50",
      "amount": "74.99"
    }, {
      "credits": "100",
      "amount": "139.99"
    }]
    userMdl.find({
      'token': token
    }).exec(function(err, userdata) {
      if (err) throw err;
      if (userdata.length == 0) {
        res.json(jsend.failure("Invalid Token"))
        return
      }
      if (req.body.event_id && req.body.event_id != "") {
        var eventId = req.body.event_id
      } else {
        var eventId = false
      }

      creditMdl.find({
        'userId': userdata[0]['_id']
      }).exec(function(err, creditData) {
        if (creditData.length < 1) {
          userdata[0]['creditCount'] = 0;
        } else {
          userdata[0]['creditCount'] = creditData[0]['creditCount'];
        }
        requestMdl.find({
          'userId': userdata[0]['_id']
        }).exec(function(err, requestData) {
          if (err) throw err;
          if (requestData.length > 0) {
            var pending_credit = 0;
            (function isPlayed(req, res, recNum, requestData) {
              if (recNum == requestData.length) {
                stripe.customers.listCards(userdata[0].stripeId, function(err, cards) {
                  if (err) {
                    res.json(jsend.failure(err.message))
                    return
                  } else {
                    cards.default_card = userdata[0].default_card;

                    res.json(jsend.success({
                      'credits': userdata[0]['creditCount'],
                      'pendingCredit': pending_credit,
                      'cards': cards,
                      'creditArray'  : creditsArr
                    }, 'Card Retreived Successfully'))
                    return
                  }
                });
              } else {
                playedMdl.find({
                  'eventId': requestData[recNum]['eventId'],
                  'songId': requestData[recNum]['songId']
                }).exec(function(err, indata) {
                  if (err) throw err;

                  if (indata.length < 1) {
                    pending_credit = pending_credit + requestData[recNum]['credits']

                  }
                  isPlayed(req, res, ++recNum, requestData)
                })
              }
            })(req, res, 0, requestData)
          } else {
            var pending_credit = 0;
            stripe.customers.listCards(userdata[0].stripeId, function(err, cards) {
              if (err) {
                res.json(jsend.failure(err.message))
                return
              } else {
                return res.json(jsend.success({
                  'credits': userdata[0]['creditCount'],
                  'pendingCredit': 0,
                  'cards': cards,
                  'creditArray'  : creditsArr
                }))
              }
            });
          }
        })
      })
    })
  } else {
    res.json(jsend.failure("No token found"))
    return
  }
}



var addPromoAction = function(req, res) {
  if (req.body.token && req.body.token != "") {
    var token = req.body.token
    userMdl.find({
      'token': token
    }).exec(function(err, userdata) {
      if (err) throw err;
      if (userdata.length == 0) {
        res.json(jsend.failure("Invalid Token"))
        return
      }

      if (req.body.code && req.body.code != "" && req.body.code != 0) {
        var code = req.body.code
      } else {
        res.json(jsend.failure("Please Enter Promo Code"))
        return
      }



      userMdl.find({
        'promoCode': code
      }).exec(function(err, pdata) {
        if (err) throw err;
        if (pdata.length < 1) {
          res.json(jsend.failure("Please Enter Valid Promo Code"))
          return
        }
        if (pdata[0]['addedPromoCode']) {
          res.json(jsend.failure("Promotion Already Used"))
          return
        }

        creditMdl.find({
          'userId': pdata[0]['_id']
        }).exec(function(err, data) {
          if (err) throw err;
          if (data.length == 0) {
            var credits = new creditMdl({
              'userId': pdata[0]['_id'],
              'creditCount': 100
            })
            credits.save()
          } else {
            var totalCredit = data[0]['creditCount'] + 100
            creditMdl.update({
              'userId': userdata[0]['_id']
            }, {
              $set: {
                'creditCount': totalCredit
              }
            }).exec(function(err, updateData) {
              if (err) throw err;
            })
          }
        })

        userMdl.update({
          _id: userdata
        }, {
          $set: {
            'addedPromoCode': true
          }
        })
        return res.json(jsend.success({}, 'Promo Code Added Successfully'))

      })

    })
  } else {
    res.json(jsend.failure("No token found"))
    return
  }
}



var credits = {
  'add': addAction,
  'get': getAction,
  'addPromo': addPromoAction
}

module.exports = credits
