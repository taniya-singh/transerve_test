var express = require('express')
var router = express.Router()
var userRoute = require("./routes/userRoute")
var bandRoute = require("./routes/bandRoute")
var adminRoute = require("./routes/adminRoute")
var confirmBand = require('./controllers/confirm/confirmBandCtrl');
var confirmUser = require('./controllers/confirm/confirmUserCtrl');



router.use('/user',userRoute)
router.use('/band',bandRoute)
router.use('/admin',adminRoute)
//====from confirmUser================
router.get('/band/confirm-account/:code',confirmBand.confirm)
//====from confirmUser================
router.get('/user/confirm-account/:code',confirmUser.confirm)


module.exports = router
