var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'doppelJockey - DJ' });
});

router.get('/vr', function(req, res, next) {
  res.render('remote', { title: 'doppelJockey - VR' });
});

module.exports = router;
