const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Users');

const saltRounds = 10;

function isUndefined(value) {
    return value === undefined;
}

function isNotValidString(value) {
    return (
        typeof value !== 'string' || value.trim().length === 0 || value === ''
    );
}

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
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確',
            });
            return;
        }

        if (!passwordPattern.test(password)) {
            logger.warn(
                '建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
            );
            res.status(400).json({
                status: 'failed',
                message:
                    '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字',
            });
            return;
        }

        const userRepository = dataSource.getRepository('User');
        const existingUser = await userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            logger.warn('建立使用者錯誤: Email 已被使用');
            res.status(409).json({
                status: 'failed',
                message: 'Email 已被使用',
            });
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

module.exports = router;
