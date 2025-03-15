const express = require('express');

const router = express.Router();
const handleErrorAsync = require('../utils/handleErrorAsync');
const isAuth = require('../middlewares/isAuth');
const userController = require('../controllers/user');

// 使用者註冊
router.post('/signup', handleErrorAsync(userController.signUp));
// 使用者登入
router.post('/login', handleErrorAsync(userController.logIn));
// 取得個人資料
router.get('/profile', isAuth, handleErrorAsync(userController.getProfile));
// 更新個人資料
router.put('/profile', isAuth, handleErrorAsync(userController.updateProfile));
// 更新密碼
router.put(
    '/password',
    isAuth,
    handleErrorAsync(userController.updatePassword)
);
// 取得使用者已購買的方案列表
router.get('/credit-package', isAuth, userController.getPurchasedPackages);
//取得已預約的課程列表
router.get(
    '/courses',
    isAuth,
    handleErrorAsync(userController.getBookingCourses)
);
module.exports = router;
