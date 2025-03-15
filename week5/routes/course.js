const express = require('express');

const router = express.Router();
const handleErrorAsync = require('../utils/handleErrorAsync');
const isAuth = require('../middlewares/isAuth');
const courseController = require('../controllers/course');

// 取得課程列表
router.get('/', handleErrorAsync(courseController.getCourseList));

// 報名課程
router.post(
    '/:courseId',
    isAuth,
    handleErrorAsync(courseController.registerCourse)
);

// 取消報名課程
router.delete(
    '/:courseId',
    isAuth,
    handleErrorAsync(courseController.cancelCourse)
);

module.exports = router;
