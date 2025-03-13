const { dataSource } = require('../db/data-source');
const appError = require('../utils/appError');
const { verifyJWT } = require('../utils/jwtUtils');
const logger = require('../utils/logger')('isAuth');

const isAuth = async (req, res, next) => {
    try {
        // 確認 token 是否存在並取出 token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            next(appError(401, '你尚未登入!'));
            return;
        }

        const token = authHeader.split(' ')[1];

        // 驗證 token
        const decoded = await verifyJWT(token);
        const existingUser = await dataSource.getRepository('User').findOne({
            where: {
                id: decoded.id,
            },
        });
        if (!existingUser) {
            next(appError(401, '無效的token無效的token'));
            return;
        }

        // 在 req 物件加入 user 欄位

        req.user = existingUser;

        next();
    } catch (error) {
        logger.error(error.message);
        next(error);
    }
};

module.exports = isAuth;
