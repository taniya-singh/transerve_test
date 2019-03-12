var express = require('express')
var multer = require('multer')
var router = express.Router()
var adminCtrl = require('../controllers/admin/adminCtrl')
var userCtrl = require('../controllers/admin/userCtrl')
var bandCtrl = require('../controllers/admin/bandCtrl')
var eventCtrl = require('../controllers/admin/eventCtrl')
var commonCtrl = require ('../controllers/admin/commonCtrl')
var playlistCtrl = require ('../controllers/admin/playlistCtrl')
var songsCtrl = require ('../controllers/admin/songCtrl')



router.post('/login',adminCtrl.login),
router.post('/logout',adminCtrl.logout),
router.post('/info',adminCtrl.info),
router.post('/auth',adminCtrl.auth),
router.get('/user-count/:token',userCtrl.userCount),
router.get('/event-count/:token',eventCtrl.eventCount),
router.get('/total-users/:page/:token',userCtrl.totalUsers),
router.post('/change-password',adminCtrl.changePassword),
router.get('/get-all-bands/:page/:token',bandCtrl.getAllBands),
router.post('/update-info',userCtrl.updateInfo),
router.post('/fetch-band',bandCtrl.fetchBand)
router.post('/update-band-info',bandCtrl.updateBandInfo),
router.post('/change-status',bandCtrl.changeStatus),
router.post('/delete-band',bandCtrl.deleteBand),
router.post('/fetch-user',userCtrl.fetchUser),
router.post('/update-user',userCtrl.updateUser),
router.post('/state-change',userCtrl.stateChange),
router.post('/delete-user',userCtrl.deleteUser),
router.get('/band-count/:token',bandCtrl.bandCount),
router.get('/total-events/:page/:eventType/:token',eventCtrl.fetchEvent),
router.get('/event-detail/:id/:token',eventCtrl.eventDetail),
router.post('/event-update',eventCtrl.eventUpdate),
router.post('/event-delete',eventCtrl.eventDelete),
router.post('/add-radius',commonCtrl.addRadius),
router.get('/get-radius/:token',commonCtrl.getRadius),
router.post('/get-banduser',bandCtrl.getBandUser),
//============= PlaylistCtrl========================
router.get('/get-all-playlists/:page/:token',playlistCtrl.getAllPlaylists),
router.post('/delete-playlist',playlistCtrl.deletePlaylist),
router.get('/playlist-detail/:id/:token',playlistCtrl.fetchPlaylist),
router.post('/playlist-update',playlistCtrl.updatePlaylist),
router.get('/band-playlist/:id/:token/:page',playlistCtrl.getBandPlaylist),
router.get('/playlist-count/:token',playlistCtrl.playlistCount),
router.get('/default-playlist/:id/:token/:page',playlistCtrl.defaultPlaylist),
router.post('/delete-song',playlistCtrl.deleteSong)
//================ SongCtrl ================
router.post('/remove-song',songsCtrl.deleteSong)
router.get('/get-playlist-songs/:id/:page/:token',songsCtrl.getPlaylistSongs),

module.exports = router
