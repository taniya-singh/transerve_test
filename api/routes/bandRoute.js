var express = require('express')
var multer = require('multer')
var router = express.Router()
var bandCtrl = require('../controllers/bands/bandCtrl')
var eventCtrl = require('../controllers/bands/eventCtrl')
var songCtrl = require('../controllers/bands/songsCtrl')
var playlistCtrl = require('../controllers/bands/playlistCtrl')
var songlistCtrl = require('../controllers/bands/songlistCtrl')
var statsCtrl = require('../controllers/bands/statsCtrl')
var teamCtrl = require('../controllers/bands/teamCtrl')
var paymentCtrl= require('../controllers/bands/paymentCtrl')

//====from bandCtrl================
router.post('/login',bandCtrl.login)
router.post('/logout',bandCtrl.logout)
router.post('/register',bandCtrl.register)
router.post('/info',bandCtrl.info)
router.post('/social',bandCtrl.social)
router.post('/confirm',bandCtrl.confirm)
router.post('/change-password',bandCtrl.changePassword)
router.post('/forget-password',bandCtrl.forgetPassword)
router.post('/change-recover-password',bandCtrl.changeRecoverPassword)
router.post('/update-profile',multer({'dest':'./uploads/'}).any(),bandCtrl.updateProfile)
router.post('/update-image',multer({'dest':'./uploads/'}).any(),bandCtrl.updateImage)
router.post('/genre',bandCtrl.genre)
//====from eventCtrl================
router.post('/event',eventCtrl.getDetails)
router.post('/events',eventCtrl.getAll)
router.post('/event/add',eventCtrl.add)
router.post('/event/update',eventCtrl.update)
router.post('/event/delete',eventCtrl.delete)
router.post('/event/start',eventCtrl.start)
router.post('/event/end',eventCtrl.end)
router.post('/event/live',eventCtrl.live)
//====from playlistCtrl================
router.post('/playlists',playlistCtrl.getAll)
router.post('/playlist/add',playlistCtrl.add)
router.post('/playlist/update',playlistCtrl.update)
router.post('/playlist/delete',playlistCtrl.delete)
//====from songCtrl================
router.post('/songs',songCtrl.getAll)
router.post('/song/add',songCtrl.add)
router.post('/song/delete',songCtrl.delete)
router.post('/songs/search',songCtrl.search)
//====from songlistCtrl================
router.post('/song/play',songlistCtrl.play)
router.post('/songlist',songlistCtrl.getAll)
router.post('/songlist/search',songlistCtrl.search)
router.post('/songlist/add',songlistCtrl.add)
router.post('/songlist/manual/add',multer({'dest':__dirname+'/../uploads/songs-image/'}).single('songImg'),songlistCtrl.manual)
router.post('/songlist/delete',songlistCtrl.delete)
//====from teamCtrl================
router.post('/team/add', teamCtrl.add)
router.post('/team/delete',teamCtrl.delete)
router.post('/team/update',teamCtrl.update)
router.post('/team', teamCtrl.list)
//====from statsCtrl================
router.post('/stats', statsCtrl.stats)
router.post('/stats/venue', statsCtrl.venue)
router.post('/stats/week', statsCtrl.week)
router.post('/stats/year', statsCtrl.year)
//====from paymentCtrl================
router.post('/create-stripe', paymentCtrl.create)


module.exports = router
