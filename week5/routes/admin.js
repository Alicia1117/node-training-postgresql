const express = require('express');

const router = express.Router();
const handleErrorAsync = require('../utils/handleErrorAsync');
const isAuth = require('../middlewares/isAuth');
const isCoach = require('../middlewares/isCoach');

const adminController = require('../controllers/admin');

// 新增教練課程資料
router.post(
    '/coaches/courses',
    isAuth,
    isCoach,
    handleErrorAsync(adminController.postCoachCourse)
);
// 編輯教練課程資料
router.put(
    '/coaches/courses/:courseId',
    isAuth,
    isCoach,
    handleErrorAsync(adminController.putCoachCourse)
);
// 將使用者新增為教練
router.post(
    '/coaches/:userId',
    isAuth,
    handleErrorAsync(adminController.addCoachRole)
);

module.exports = router;
