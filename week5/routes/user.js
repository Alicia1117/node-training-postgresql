const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Users');
const appError = require('../utils/appError');
const { generateJWT } = require('../utils/jwtUtils');
const isAuth = require('../middlewares/isAuth');
const { isUndefined, isNotValidString } = require('../utils/validation');

const saltRounds = 10;

router.post('/signup', async (req, res, next) => {
    try {
        const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
        const { name, email, password } = req.body;
        if (
            isUndefined(name) ||
            isNotValidString(name) ||
            isUndefined(email) ||
            isNotValidString(email) ||
            isUndefined(password) ||
            isNotValidString(password)
        ) {
            logger.warn('欄位未填寫正確');
            next(appError(400, '欄位未填寫正確'));
            return;
        }

        if (!passwordPattern.test(password)) {
            logger.warn(
                '建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
            );
            next(
                appError(
                    400,
                    '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
                )
            );
            return;
        }

        const userRepository = dataSource.getRepository('User');
        const existingUser = await userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            logger.warn('建立使用者錯誤: Email 已被使用');
            next(appError(409, 'Email 已被使用'));
            return;
        }

        const hashPassword = await bcrypt.hash(password, saltRounds);
        const newUser = userRepository.create({
            name,
            email,
            role: 'USER',
            password: hashPassword,
        });
        const savedUser = await userRepository.save(newUser);
        logger.info('新建立的使用者ID:', savedUser.id);

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: savedUser.id,
                    name: savedUser.name,
                },
            },
        });
    } catch (error) {
        logger.error('建立使用者錯誤:', error);
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
        const { email, password } = req.body;
        if (isNotValidString(email) || isNotValidString(password)) {
            next(appError(400, '欄位未填寫正確'));
            return;
        }
        if (!passwordPattern.test(password)) {
            next(
                appError(
                    400,
                    '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
                )
            );
            return;
        }

        const userRepo = dataSource.getRepository('User');
        const findUser = await userRepo.findOne({
            select: ['id', 'name', 'password'],
            where: { email },
        });
        if (!findUser) {
            next(appError(400, '使用者不存在或密碼輸入錯誤'));
            return;
        }

        const matchedPassword = await bcrypt.compare(
            password,
            findUser.password
        );
        if (!matchedPassword) {
            next(appError(400, '使用者不存在或密碼輸入錯誤'));
            return;
        }

        // 產生JWT token

        const token = generateJWT({
            id: findUser.id,
            role: findUser.role,
        });

        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: {
                    name: findUser.name,
                },
            },
        });
    } catch (error) {
        logger.error('登入錯誤:', error);
        next(error);
    }
});

router.get('/profile', isAuth, async (req, res, next) => {
    try {
        const { id } = req.user;
        if (isNotValidString(id)) {
            next(appError(400, '欄位未填寫正確'));
            return;
        }
        const findUser = await dataSource.getRepository('User').findOne({
            where: { id },
        });

        res.status(200).json({
            status: 'success',
            data: {
                email: findUser.email,
                name: findUser.name,
            },
        });
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error);
        next(error);
    }
});

router.put('/profile', isAuth, async (req, res, next) => {
    try {
        const { id } = req.user;
        const { name } = req.body;
        if (isNotValidString(name)) {
            next(appError('400', '欄位未填寫正確'));
            return;
        }

        const namePattern = /^[A-Za-z0-9\u4e00-\u9fa5]{2,10}$/;
        if (!namePattern.test(name)) {
            next(
                appError(
                    400,
                    '必填，最少2個字，最多10個字，不可包含任何特殊符號與空白'
                )
            );
            return;
        }

        const userRepository = dataSource.getRepository('User');

        const findUser = await userRepository.findOne({
            where: { id },
        });
        if (findUser.name === name) {
            next(appError(400, '使用者名稱未變更'));
            return;
        }

        const updateUser = await userRepository.update({ id }, { name });
        if (updateUser.affected === 0) {
            next(appError(400, '更新使用者失敗'));
            return;
        }

        res.status(200).json({
            status: 'success',
        });
    } catch (error) {
        logger.error('取得使用者資料錯誤:', error);
        next(error);
    }
});

module.exports = router;
