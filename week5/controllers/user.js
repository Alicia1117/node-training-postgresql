const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Users');
const appError = require('../utils/appError');
const { generateJWT } = require('../utils/jwtUtils');
const {
    isUndefined,
    isNotValidString,
    isValidateUUID,
} = require('../utils/validation');
const bcrypt = require('bcrypt');

const saltRounds = 10;
//  id 查找資料庫的部分，可另外加上 uuid 的格式驗證，避免直接跳 500 伺服器錯誤
const userController = {
    async signUp(req, res, next) {
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
    },
    async logIn(req, res, next) {
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
    },
    async getProfile(req, res, next) {
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
    },
    async updateProfile(req, res, next) {
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
    },
    async updatePassword(req, res, next) {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/;

        const userId = req.user.id;
        const {
            password,
            new_password: newPassword,
            confirm_new_password: confirmNewPassword,
        } = req.body;

        if (
            isUndefined(password) ||
            isNotValidString(password) ||
            isUndefined(newPassword) ||
            isNotValidString(newPassword) ||
            isUndefined(confirmNewPassword) ||
            isNotValidString(confirmNewPassword)
        ) {
            return next(appError(400, '欄位未填寫正確'));
        }

        if (!passwordRegex.test(newPassword)) {
            return next(
                appError(
                    400,
                    '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
                )
            );
        }

        const userRepo = dataSource.getRepository('User');

        const user = await userRepo.findOne({
            select: ['password'],
            where: { id: userId },
        });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return next(appError(400, '密碼輸入錯誤'));
        }

        if (password === newPassword) {
            return next(appError(400, '新密碼不能與舊密碼相同'));
        }

        if (newPassword !== confirmNewPassword) {
            return next(appError(400, '新密碼與驗證新密碼不一致'));
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        await userRepo.save(req.user);

        res.status(200).json({
            status: 'success',
            data: null,
        });
    },
    async getPurchasedPackages(req, res, next) {
        const userId = req.user.id;

        const creditPurchaseRepo = dataSource.getRepository('CreditPurchase');

        const purchasedPackages = await creditPurchaseRepo.find({
            where: { user_id: userId },
            relations: ['CreditPackage'],
            order: { purchase_at: 'DESC' },
        });

        const resData = purchasedPackages.map(purchase => ({
            purchased_credits: purchase.purchased_credits,
            price_paid: purchase.price_paid,
            name: purchase.CreditPackage.name,
            purchase_at: purchase.purchase_at,
        }));

        res.status(200).json({
            status: 'success',
            data: resData,
        });
    },
    async getBookingCourses(req, res, next) {
        const userId = req.user.id;

        const courseBookingRepo = dataSource.getRepository('CourseBooking');
        const bookings = await courseBookingRepo.find({
            where: { user_id: userId },
            relations: ['Course', 'Course.User'],
        });

        const creditPurchaseRepo = dataSource.getRepository('CreditPurchase');
        const creditPurchases = await creditPurchaseRepo.find({
            where: { user_id: userId },
        });

        const totalPurchasedCredits = creditPurchases.reduce(
            (acc, purchase) => {
                return acc + purchase.purchased_credits;
            },
            0
        );

        const creditUsage = bookings.length;
        const creditRemain = totalPurchasedCredits - creditUsage;

        const courseBookings = bookings.map(booking => {
            const course = booking.Course;
            return {
                name: course.name,
                course_id: course.id,
                coach_name:
                    course.User && course.User.name ? course.User.name : 'N/A',
                status: booking.status,
                start_at: course.start_at,
                end_at: course.end_at,
                meeting_url: course.meeting_url,
            };
        });

        res.status(200).json({
            status: 'success',
            data: {
                credit_remain: creditRemain,
                credit_usage: creditUsage,
                course_booking: courseBookings,
            },
        });
    },
};

module.exports = userController;
