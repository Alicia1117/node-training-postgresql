const express = require('express');

const router = express.Router();
const handleErrorAsync = require('../utils/handleErrorAsync');
const isAuth = require('../middlewares/isAuth');

const skillController = require('../controllers/skill');

// 取得教練專長列表
router.get('/', isAuth, handleErrorAsync(skillController.getSkills));
// 新增教練專長
router.post('/', isAuth, handleErrorAsync(skillController.postSkill));
// 刪除教練專長
router.delete(
    '/:skillId',
    isAuth,
    handleErrorAsync(skillController.deleteSkill)
);

module.exports = router;
