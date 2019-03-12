var bandMdl = require('../../models/bands.js')
var bandUserMdl = require('../../models/bandUsers.js')
var playlistMdl = require('../../models/playlists.js')
var playedMdl = require('../../models/played.js')
var creditMdl = require('../../models/credits.js')
var requestMdl = require('../../models/requests.js')
var eventMdl = require('../../models/events.js')
var songlistMdl = require('../../models/songlist.js')
var songsMdl = require('../../models/songs.js')
var jsend = require('../../plugins/Jsend.js')
var mongoose = require('mongoose')
var async = require('async')
var _ = require('underscore')
var moment = require('moment-timezone')
var dateFormat = require('dateformat')

var getAllAction = function(req, res) {
    if (req.body.token && req.body.token != "") {
        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                res.json(jsend.failure("Invalid Token"))
                return
            }

            if (req.body.page && req.body.page != "") {
                var page = req.body.page
            } else {
                var page = 1
            }

            if (req.body.type && req.body.type != "") {
                var type = req.body.type
            } else {
                var type = 'all'
            }

            if (req.body.search && req.body.search != "") {
                var search = req.body.search
            } else {
                var search = ""
            }

            if (req.body.latitude && req.body.latitude != "") {
                var latitude = req.body.latitude
            } else {
                var latitude = ""
            }

            if (req.body.longitude && req.body.longitude != "") {
                var longitude = req.body.longitude
            } else {
                var longitude = ""
            }

            if (req.body.timezone && req.body.timezone != "") {
                var timezone = req.body.timezone
            } else {
                var timezone = "America/New_York"
            }


            if (search == '') {
                queryObj = {
                    bandId: banduser[0].bandId
                }
            } else {
                queryObj = {
                    $and: [{
                        bandId: banduser[0].bandId,
                        is_deleted: 0
                    }, {
                        $or: [{
                            'venue.name': new RegExp(search)
                        }, {
                            'venue.address': new RegExp(search)
                        }]
                    }]
                }
            }
            process.env.TZ = 'UTC'
            eventMdl.find(queryObj).lean().exec(function(err, eventdata) {
                if (err) throw err;
                allevents = []
                async.eachSeries(eventdata, function(event, cb) {
                    event['credits'] = 0
                    requestMdl.aggregate([{
                        $match: {
                            'eventId': event['_id']
                        }
                    }, {
                        $lookup: {
                            from: "playeds",
                            localField: "eventId",
                            foreignField: "eventId",
                            as: "playeds"
                        }
                    }]).exec(function(err, requests) {
                        if (err) throw err;

                        if (requests.length == 0) {
                            event['credits'] = 0
                        } else {
                            for (i = 0; i < requests.length; i++) {
                                for (j = 0; j < requests[i]['playeds'].length; j++) {
                                    if (requests[i]['songId'].toString() == requests[i]['playeds'][j]['songId'].toString()) {
                                        event['credits'] += requests[i]['credits']
                                    }
                                }
                            }
                        }

                        event['credits'] = Math.round(event['credits'] * 70) / 100
                        allevents.push(event)
                        cb()
                    })
                }, function(err) {
                    if (err) throw err;
                    eventdata = allevents;
                    (function addPlaylistName(req, res, recNum, eventdata) {
                        if (eventdata.length == recNum) {
                            var dates = [];
                            for (var i = 0; i < eventdata.length; i++) {
                              if(new Date(eventdata[i]['eventDate']).getUTCDate() < 10)
                              {
                                if(new Date(eventdata[i]['eventDate']).getUTCMonth() < 9)
                                {
                                  var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-0' +  new Date(eventdata[i]['eventDate']).getUTCDate()
                                }
                                else
                                {
                                  var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-0' +  new Date(eventdata[i]['eventDate']).getUTCDate()
                                }
                              }

                              else
                              {
                                if(new Date(eventdata[i]['eventDate']).getUTCMonth() < 9)
                                {
                                  var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[i]['eventDate']).getUTCDate()
                                }
                                else
                                {
                                  var eveDate = new Date(eventdata[i]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[i]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[i]['eventDate']).getUTCDate()
                                }
                              }
                                dates.push(eveDate)
                            }
                            var uniqueDates = dates.filter(function(elem, index, self) {
                                return index == self.indexOf(elem);
                            })
                            var finalEvents = [];
                            for (var i = 0; i < uniqueDates.length; i++) {
                                var finalEventsIn = [];
                                var uniquefinalEventsIn = []

                                for (var j = 0; j < eventdata.length; j++) {
                                  if (new Date(eventdata[j]['eventDate']).getUTCDate() < 10) {
                  									if (new Date(eventdata[j]['eventDate']).getUTCMonth() < 9) {
                  										var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[j]['eventDate']).getUTCDate()
                  									} else {
                  										var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-0' + new Date(eventdata[j]['eventDate']).getUTCDate()
                  									}
                  								} else {
                  									if (new Date(eventdata[j]['eventDate']).getUTCMonth() < 9) {
                  										var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-0' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[j]['eventDate']).getUTCDate()
                  									} else {
                  										var eveDateIn = new Date(eventdata[j]['eventDate']).getUTCFullYear() + '-' + (new Date(eventdata[j]['eventDate']).getUTCMonth() + 1) + '-' + new Date(eventdata[j]['eventDate']).getUTCDate()
                  									}
                  								}
	                                  process.env.TZ = timezone
                                    var eventDateIn = new Date(moment(eventdata[j]['startTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
                                    var eventDateOut = new Date(moment(eventdata[j]['endTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
                                    var now = new Date(moment(new Date()).tz(timezone).format('YYYY-MM-DD HH:mm'))

                                    if (type == 'upcoming' && now.getTime() <= eventDateIn.getTime() && eventdata[j]['ended'] != true) {
                                        if (eveDateIn == uniqueDates[i]) {
                                            finalEventsIn.push(eventdata[j])
                                            uniquefinalEventsIn = removeDuplicates(finalEventsIn, "_id");
                                        }
                                    }

                                    if (type == 'past' && (now.getTime() > eventDateOut.getTime() || eventdata[j]['ended'] == true)) {
                                        if (eveDateIn == uniqueDates[i]) {
                                            finalEventsIn.push(eventdata[j])
                                            uniquefinalEventsIn = removeDuplicates(finalEventsIn, "_id");
                                        }
                                    }

                                    var eventDateIn = new Date(moment(eventdata[j]['startTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
                                    var now = moment(new Date()).tz(timezone).format('YYYY-MM-DD hh:mm a')
                                    var localdayStartTimeStamp = new Date(now).setHours(0, 0, 0, 0)
                                    var localdayEndTimeStamp = new Date(now).setHours(23, 59, 59, 999)
                                    var localStartTimeStamp = new Date(eventDateIn).getTime()
                                    if (type == 'today' && (localdayStartTimeStamp <= localStartTimeStamp && localdayEndTimeStamp >= localStartTimeStamp)) {
                                        if (eveDateIn == uniqueDates[i]) {
                                            uniquefinalEventsIn.push(eventdata[j])
                                        }
                                    }
                                }
                                if (uniquefinalEventsIn.length >= 1) {
                                    finalEvents.push({
                                        'eventDate': uniqueDates[i],
                                        'events': uniquefinalEventsIn
                                    })
                                }
                            }

                            finalEvents.forEach(function(obj) {
                            	obj.eventDate = cleanDate(obj.eventDate)
                                if (type == 'upcoming' || type == 'today') {
                                    obj.events.sort(function(a, b) {
                                        var dateA = new Date(a.startTime).getTime(),
                                            dateB = new Date(b.startTime).getTime()
                                        return dateA - dateB //sort by date ascending
                                    })
                                }
                                if (type == 'past') {
                                    obj.events.sort(function(a, b) {
                                        var dateA = new Date(a.endTime).getTime(),
                                            dateB = new Date(b.endTime).getTime()
                                        return dateB - dateA //sort by date decending
                                    })
                                }
                                if(type == 'today')
                                {
                                  obj.events.sort(dynamicSort("ended"));
                                }
                            })
                            res.json(jsend.success({
                              'msg' : "hello success",
                                'events': finalEvents
                            }))
                            return
                        } else {
                            process.env.TZ = 'UTC'
                            var now = new Date(moment(new Date()).tz(timezone).format('YYYY-MM-DD HH:mm'))
                            var eventEndIn = new Date(moment(eventdata[recNum]['endTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
                            var eventStartIn = new Date(moment(eventdata[recNum]['startTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
	                        if (eventStartIn.getTime() < now.getTime() && eventEndIn.getTime() > now.getTime()) {
                                if (eventdata[recNum]['ended'] == true) {
                                    eventdata[recNum]['live'] = false;
                                    eventdata[recNum]['started'] = true;
                                    eventdata[recNum]['ended'] = true;
                            	} else {
                                    eventdata[recNum]['live'] = false;
                                    eventdata[recNum]['started'] = true;
                                    eventdata[recNum]['ended'] = false;
                            	}
                            }
                            else if(eventdata[recNum]['started'] == true)
                            {
                            	if (eventdata[recNum]['ended'] == true) {
                                    eventdata[recNum]['live'] = false;
                                    eventdata[recNum]['started'] = true;
                                    eventdata[recNum]['ended'] = true;
                            	} else {
                                    if (eventEndIn.getTime() < now.getTime()) {
                                        eventdata[recNum]['live'] = false;
                                        eventdata[recNum]['started'] = true;
                                        eventdata[recNum]['ended'] = true;
                                	} else {
                                        eventdata[recNum]['live'] = true;
                                        eventdata[recNum]['started'] = true;
                                        eventdata[recNum]['ended'] = false;
                                	}
                                }
                            }
                            else {
                              if (eventdata[recNum]['ended'] == true) {
                                eventdata[recNum]['live'] = false;
                                eventdata[recNum]['started'] = false;
                                eventdata[recNum]['ended'] = true;
                              }

                                if (eventStartIn.getTime() > now.getTime() && eventdata[recNum]['ended'] != true) {
                                    eventdata[recNum]['live'] = false;
                                    eventdata[recNum]['started'] = false;
                                    eventdata[recNum]['ended'] = false;
                                }

                                if (eventEndIn.getTime() < now.getTime()) {
                                    eventdata[recNum]['live'] = false;
                                    eventdata[recNum]['started'] = true;
                                    eventdata[recNum]['ended'] = true;
                                }
                            }

                            bandMdl.find({
                                '_id': eventdata[recNum]['bandId']
                            }).find().exec(function(err, banddata) {
                                if (err) throw err;
                                eventdata[recNum]['bandImg'] = banddata[0].bandImg
                                eventdata[recNum]['bandName'] = banduser[0].bandName
                                playlistMdl.find({
                                    '_id': eventdata[recNum]['playlistId']
                                }).exec(function(err, playlistdata) {
                                    if (err) throw err;
                                    if (playlistdata.length) {
                                        eventdata[recNum]['playlistName'] = playlistdata[0]['playlistName']
                                    } else {
                                        delete eventdata[recNum]['playlistId']
                                    }
                                    addPlaylistName(req, res, ++recNum, eventdata)
                                })
                            })
                        }
                    })(req, res, 0, eventdata)

                })

            })

        })

    } else {
        res.json(jsend.failure("No token found"))
        return
    }
}

var getDetailsAction = function(req, res) {
    if (req.body.token && req.body.token != "") {
        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                res.json(jsend.failure("Invalid Token"))
                return
            }

            if (req.body.id && req.body.id != "") {
                var eventId = req.body.id
            } else {
                res.json(jsend.failure("Event Id is required"))
                return
            }
            eventMdl.find({
                '_id': eventId
            }).lean().exec(function(err, eventdata) {
                if (err) throw err;
                if (eventdata.length < 1) {
                    res.json(jsend.failure("No event details found"))
                    return
                }

                bandMdl.find({
                    'bandId': eventdata[0].bandId
                }).exec(function(err, banddata) {
                    if (err) throw err;
                    res.json(jsend.success({
                        'events': eventdata[0]
                    }))
                    return
                })
            })
        })
    } else {
        res.json(jsend.failure("No token found"))
        return
    }
}


var addAction = function(req, res) {
    if (req.body.token && req.body.token != "") {
        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                res.json(jsend.failure("Invalid Token"))
                return
            }
            if (req.body.start_time && req.body.start_time != "") {
                var startTime = req.body.start_time
            } else {
                res.json(jsend.failure('Start Time is required'))
                return
            }

            if (req.body.event_date && req.body.event_date != "")

            {
                var eventDate = req.body.event_date
            } else {
                res.json(jsend.failure('Event Date is required'))
                return
            }

            if (req.body.hourspan && req.body.hourspan != "") {
                var hourspan = req.body.hourspan
                var startTimestamp = new Date(startTime).getTime()
                var hourStamp = hourspan * 3600000;
                var endStamp = startTimestamp + hourStamp;
                var endTime = new Date(endStamp).toISOString();
            } else {
                res.json(jsend.failure('Total Hours of the event is required'))
                return
            }
            if (req.body.venue_name && req.body.venue_name != "") {
                var venue_name = req.body.venue_name.toString().trim()
            } else {
                res.json(jsend.failure('Vanue Name is required'))
                return
            }
            if (req.body.venue_address && req.body.venue_address != "") {
                var venue_address = req.body.venue_address.toString().trim()
            } else {
                res.json(jsend.failure('Vanue Address is required'))
                return
            }
            if (req.body.latitude && req.body.latitude != "") {
                var latitude = req.body.latitude.toString().trim()
            } else {
                var latitude = "0.0"
            }

            if (req.body.longitude && req.body.longitude != "") {
                var longitude = req.body.longitude.toString().trim()
            } else {
                var longitude = "0.0"
            }

            if (req.body.playlist_id && req.body.playlist_id != "") {
                var playlistId = req.body.playlist_id.toString()
            } else {
                var playlistId = ''
            }
            var eventObj = {
                'bandId': banduser[0].bandId,
                'eventDate': eventDate,
                'startTime': startTime,
                'endTime': endTime,
                'hourspan': hourspan,
                'venue': {
                    'name': venue_name,
                    'address': venue_address
                },
                'location': {
                    'latitude': latitude,
                    'longitude': longitude
                },
            }
            if (playlistId) {
                eventObj['playlistId'] = playlistId
            }

            var newevent = new eventMdl(eventObj)
            newevent.save()
            res.json(jsend.success([], "Event Added Successfully"))
            return
        })
    } else {
        res.json(jsend.failure("no token found"))
        return
    }
}

var updateAction = function(req, res) {

    if (req.body.token && req.body.token != "") {

        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                return res.json(jsend.failure("Invalid Token"))
            }

            if (req.body.event_id && req.body.event_id != "") {
                var eventId = req.body.event_id
            } else {
                return res.json(jsend.failure('Event ID is required'))
            }

            if (req.body.event_date && req.body.event_date != "")

            {
                var eventDate = req.body.event_date.toString().trim()
            } else {
                return res.json(jsend.failure('Event Date is required'))
            }

            if (req.body.start_time && req.body.start_time != "") {
                var startTime = req.body.start_time
            } else {
                return res.json(jsend.failure('Start Time is required'))

            }

            if (req.body.hourspan && req.body.hourspan != "") {
                var hourspan = req.body.hourspan
                var startTimestamp = new Date(startTime).getTime()
                var hourStamp = hourspan * 3600000;
                var endStamp = startTimestamp + hourStamp;
                var endTime = new Date(endStamp).toISOString();
            } else {
                res.json(jsend.failure('Total Hours of the event is required'))
                return
            }

            if (req.body.venue_name && req.body.venue_name != "") {
                var venue_name = req.body.venue_name.toString().trim()
            } else {
                res.json(jsend.failure('Venue Name is required'))
                return
            }

            if (req.body.venue_address && req.body.venue_address != "") {
                var venue_address = req.body.venue_address.toString().trim()
            } else {
                res.json(jsend.failure('Venue Address is required'))
                return
            }

            if (req.body.latitude && req.body.latitude != "") {
                var latitude = req.body.latitude.toString().trim()
            } else {
                var latitude = "0.0"
            }

            if (req.body.longitude && req.body.longitude != "") {
                var longitude = req.body.longitude.toString().trim()
            } else {
                var longitude = "0.0"
            }

            if (req.body.playlist_id && req.body.playlist_id != "") {
                var playlistId = req.body.playlist_id.toString().trim()
            } else {
                var playlistId = ""
            }

            var eventObj = {
                'eventDate': eventDate,
                'startTime': startTime,
                'endTime': endTime,
                'hourspan': hourspan,
                'venue.name': venue_name,
                'venue.address': venue_address,
                'location.latitude': latitude,
                'location.longitude': longitude
            }

            if (playlistId != '') {
                eventObj['playlistId'] = playlistId
            }

            eventMdl.update({
                '_id': eventId
            }, {
                $set: eventObj
            }).exec(function(err, data) {
                if (err) throw err;
                res.json(jsend.success([], "Event Updated Successfully"))
                return
            })
        })
    } else {
        res.json(jsend.failure("No token found"))
        return
    }
}


var deleteAction = function(req, res) {
    if (req.body.token && req.body.token != "") {
        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                res.json(jsend.failure("Invalid Token"))
                return
            }

            if (req.body.event_id && req.body.event_id != "") {
                var eventId = req.body.event_id.toString()
            } else {
                res.json(jsend.failure('Event ID is required'))
                return
            }
            eventMdl.remove({
                '_id': eventId
            }).exec(function(err, data) {
                if (err) throw err;
                res.json(jsend.success([], "Event Deleted Successfully"))
                return
            })
        })
    } else {
        res.json(jsend.failure("No token found"))
        return
    }
}


var startAction = function(req, res) {
    if (req.body.token && req.body.token != "") {
        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                res.json(jsend.failure("Invalid Token"))
                return
            }

            if (req.body.event_id && req.body.event_id != "") {
                var eventId = req.body.event_id.toString()
            } else {
                res.json(jsend.failure('Event ID is required'))
                return
            }

            eventMdl.update({
                '_id': eventId
            }, {
                $set: {
                    'started': true
                }
            }).exec(function(err, data) {
                if (err) throw err;
                res.json(jsend.success([], "Event Started Successfully"))
                return
            })
        })
    } else {
        res.json(jsend.failure("No token found"))
        return
    }
}

var endAction = function(req, res) {
    if (req.body.token && req.body.token != "") {
        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                res.json(jsend.failure("Invalid Token"))
                return
            }

            if (req.body.event_id && req.body.event_id != "") {
                var eventId = req.body.event_id.toString()
            } else {
                res.json(jsend.failure('Event ID is required'))
                return
            }
            var enddate = new Date(new Date().toUTCString()).toISOString();
            eventMdl.update({
                '_id': eventId
            }, {
                $set: {
                    'ended': true,
                    'endTime': enddate
                }
            }).exec(function(err, data) {
                if (err) throw err;
                res.json(jsend.success([], "Event Ended Successfully"))
                return
            })
        })
    } else {
        res.json(jsend.failure("No token found"))
        return
    }
}


var liveAction = function(req, res) {
    if (req.body.token && req.body.token != "") {
        var token = req.body.token
        bandUserMdl.find({
            'token': token
        }).exec(function(err, banduser) {
            if (err) throw err;
            if (banduser.length == 0) {
                return res.json(jsend.failure("Invalid Token"))
            }
            if (req.body.timezone && req.body.timezone != "") {
                var timezone = req.body.timezone
            } else {
                var timezone = "America/New_York"
            }

            if (req.body.event_id && req.body.event_id != "") {
                var eventId = req.body.event_id
            } else {
                res.json(jsend.failure("Event Id is Required"))
                return
            }

            eventMdl.find({
                '_id': eventId
            }).sort({
                'startTime': -1
            }).lean().exec(function(err, eventdata) {
                if (err) throw err;

                if (eventdata.length < 1) {
                    res.json(jsend.failure("Event Not Found"))
                    return
                }
                process.env.TZ = timezone
                var now = new Date()
                var now = new Date(moment(now).tz(timezone).format('YYYY-MM-DD HH:mm'))
                var eventEndIn = new Date(moment(eventdata[0]['endTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
                var eventStartIn = new Date(moment(eventdata[0]['startTime']).tz(timezone).format('YYYY-MM-DD HH:mm'))
                process.env.TZ = 'UTC'

                if (eventStartIn.getTime() < now.getTime() && eventEndIn.getTime() > now.getTime()) {
                    if (eventdata[0]['ended'] == true) {
                         if (eventdata[recNum]['ended'] == true) {
                                eventdata[recNum]['live'] = false;
                                eventdata[recNum]['started'] = true;
                                eventdata[recNum]['ended'] = true;
                        	} else {
                                eventdata[recNum]['live'] = false;
                                eventdata[recNum]['started'] = true;
                                eventdata[recNum]['ended'] = false;
                        	}
                    } else {
                        if (eventEndIn.getTime() < now.getTime()) {
                            eventdata[0]['live'] = false;
                            eventdata[0]['started'] = true;
                            eventdata[0]['ended'] = true;
                        } else {
                            eventdata[0]['live'] = true;
                            eventdata[0]['started'] = true;
                            eventdata[0]['ended'] = false;
                        }
                    }
                }
                else if(eventdata[0]['started'] == true)
                {
                	if (eventdata[0]['ended'] == true) {
                        eventdata[0]['live'] = false;
                        eventdata[0]['started'] = true;
                        eventdata[0]['ended'] = true;
                	} else {
                        if (eventEndIn.getTime() < now.getTime()) {
                            eventdata[0]['live'] = false;
                            eventdata[0]['started'] = true;
                            eventdata[0]['ended'] = true;
                    	} else {
                            eventdata[0]['live'] = true;
                            eventdata[0]['started'] = true;
                            eventdata[0]['ended'] = false;
                    	}
                    }

                }
                 else {
                    if (eventStartIn.getTime() > now.getTime()) {
                        eventdata[0]['live'] = false;
                        eventdata[0]['started'] = false;
                        eventdata[0]['ended'] = false;
                    }

                    if (eventEndIn.getTime() < now.getTime()) {
                        eventdata[0]['live'] = false;
                        eventdata[0]['started'] = true;
                        eventdata[0]['ended'] = true;
                    }
                    eventdata[0]['live'] = false;

                }
                if (eventdata[0]['live'] == false) {
                    return res.json(jsend.failure('Event is not live, start the event'))
                } else {
                    songlistMdl.find({
                        'bandId': banduser[0]['bandId']
                    }).lean().exec(function(err, songs) {
                        (function getSongData(req, res, recNum, songs) {
                            if (recNum == songs.length) {
                                var maxCredit = 0;
                                for (var k = 0; k < songs.length; k++) {
                                    if (songs[k]['credits'] > maxCredit) {
                                        maxCredit = songs[k]['credits']
                                    }
                                }


                                for (var k = 0; k < songs.length; k++) {
                                    songs[k]['remaining'] = maxCredit - songs[k]['credits']
                                }

                                songs.sort(function(a, b) {
                                    return parseFloat(a.remaining) - parseFloat(b.remaining);
                                });


                                (function isPlayed(req, res, inRecNum, songs) {
                                    if (inRecNum == songs.length) {

                                        if (eventdata[0]['playlistId'] && eventdata[0]['playlistId'] != '') {
                                            playlistMdl.find({
                                                '_id': eventdata[0]['playlistId']
                                            }).exec(function(err, data) {
                                                if (err) throw err;
                                                songlistMdl.find({
                                                    '_id': {
                                                        $in: data[0]['songs']
                                                    }
                                                }).lean().exec(function(err, playdata) {
                                                    if (err) throw err;
                                                    (function isSetlistPlayed(req, res, slRecNum, playdata) {

                                                        if (slRecNum == playdata.length) {
                                                            playdata.sort(dynamicSort("played"));
                                                            songs.sort(dynamicSort("played"));

                                                            res.json(jsend.success({
                                                                'setlist': playdata,
                                                                'requested': songs
                                                            }))
                                                            return
                                                        } else {
                                                            playedMdl.find({
                                                                'eventId': eventId,
                                                                'songId': playdata[slRecNum]['_id']
                                                            }).exec(function(err, smdata) {
                                                                if (err) throw err;
                                                                if (smdata.length > 0) {
                                                                    playdata[slRecNum]['played'] = true
                                                                } else {
                                                                    playdata[slRecNum]['played'] = false
                                                                }
                                                                isSetlistPlayed(req, res, ++slRecNum, playdata)
                                                            })
                                                        }

                                                    })(req, res, 0, playdata)


                                                })
                                            })
                                        } else {
                                            songs.sort(dynamicSort("played"));
                                            res.json(jsend.success({
                                                'setlist': [],
                                                'requested': songs
                                            }))
                                            return
                                        }
                                    } else {
                                        playedMdl.find({
                                            'eventId': eventId,
                                            'songId': songs[inRecNum]['_id']
                                        }).exec(function(err, indata) {
                                            if (err) throw err;
                                            if (indata.length > 0) {
                                                songs[inRecNum]['played'] = true
                                            } else {
                                                songs[inRecNum]['played'] = false
                                            }
                                            isPlayed(req, res, ++inRecNum, songs)
                                        })
                                    }
                                })(req, res, 0, songs)

                            } else {
                                requestMdl.find({
                                    'songId': songs[recNum]['_id'],
                                    'eventId': eventId
                                }).exec(function(err, data) {
                                    songs[recNum]['credits'] = 0
                                    songs[recNum]['remaining'] = 0
                                    if (data.length < 1) {
                                        songs[recNum]['votes'] = 0
                                        getSongData(req, res, ++recNum, songs)
                                    } else {
                                        songs[recNum]['requested'] = true
                                        songs[recNum]['votes'] = data.length
                                        for (var k = 0; k < data.length; k++) {
                                            songs[recNum]['credits'] += parseInt(data[k]['credits'])
                                        }
                                        songs[recNum]['credits'] = songs[recNum]['credits'] * 0.7
                                        songs[recNum]['remaining'] = 0
                                        getSongData(req, res, ++recNum, songs)
                                    }

                                })
                            }
                        })(req, res, 0, songs)
                    })
                }


            })
        })
    } else {
        res.json(jsend.failure("No token found"))
        return
    }

}

function removeDuplicates(originalArray, prop) {
    var newArray = [];
    var lookupObject = {};

    for (var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for (i in lookupObject) {
        newArray.push(lookupObject[i]);
    }
    return newArray;
}

function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function(a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function cleanDate(date){

	if(new Date(date).getDate() < 10)
	{
		if(new Date(date).getMonth() > 9){
	 		var date = new Date(date).getFullYear() + '-' + (new Date(date).getMonth() + 1) + '-0' +  new Date(date).getDate()
		}
		else
		{
			var date = new Date(date).getFullYear() + '-0' + (new Date(date).getMonth() + 1) + '-0' +  new Date(date).getDate()
		}
	}

	if(new Date(date).getDate() >= 10)
	{
		if(new Date(date).getMonth() > 9){
	 		var date = new Date(date).getFullYear() + '-' + (new Date(date).getMonth() + 1) + '-' +  new Date(date).getDate()
		}
		else
		{
			var date = new Date(date).getFullYear() + '-0' + (new Date(date).getMonth() + 1) + '-' +  new Date(date).getDate()
		}
	}

	return date ;
}



var event = {
    'getAll': getAllAction,
    'getDetails': getDetailsAction,
    'add': addAction,
    'update': updateAction,
    'delete': deleteAction,
    'start': startAction,
    'end': endAction,
    'live': liveAction
}

module.exports = event
