const express = require('express');

const router = express.Router();
const handleErrorAsync = require('../utils/handleErrorAsync');
const isAuth = require('../middlewares/isAuth');

const creditPackageController = require('../controllers/creditPackage');

// 取得購買方案列表
router.get('/', handleErrorAsync(creditPackageController.getPackageList));
// 新增購買方案
router.post('/', isAuth, handleErrorAsync(creditPackageController.addPackage));
// 刪除購買方案
router.delete(
    '/:creditPackageId',
    isAuth,
    handleErrorAsync(creditPackageController.deletePackage)
);
// 使用者購買方案
router.post(
    '/:creditPackageId',
    isAuth,
    handleErrorAsync(creditPackageController.buyPackage)
);
module.exports = router;
