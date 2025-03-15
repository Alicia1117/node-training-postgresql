const express = require('express');

const router = express.Router();
const handleErrorAsync = require('../utils/handleErrorAsync');
const isAuth = require('../middlewares/isAuth');

const coachController = require('../controllers/coach');

// 取得教練列表
router.get('/', handleErrorAsync(coachController.getCoachList));
// 取得教練詳細資訊
router.get('/:coachId', handleErrorAsync(coachController.getCoachDetail));

module.exports = router;
