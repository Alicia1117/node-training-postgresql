const express = require('express');

const router = express.Router();
const { dataSource } = require('../db/data-source');
const appError = require('../utils/appError');
const isAuth = require('../middlewares/isAuth');
const logger = require('../utils/logger')('Course');
const { isUndefined, isNotValidString } = require('../utils/validation');

// 取得課程列表
router.get('/', async (req, res, next) => {
    try {
        const courses = await dataSource.getRepository('Course').find();
        res.status(200).json({
            status: 'success',
            data: courses,
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

// 報名課程
router.post('/:courseId', isAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        if (isUndefined(courseId) || isNotValidString(courseId)) {
            return next(appError(400, 'ID錯誤'));
        }

        const courseRepo = await dataSource.getRepository('Course');
        const creditPurchaseRepo = await dataSource.getRepository(
            'CreditPurchase'
        );
        const courseBookingRepo = await dataSource.getRepository(
            'CourseBooking'
        );

        const course = await courseRepo.findOne({ where: { id: courseId } });
        if (!course) {
            return next(appError(400, 'ID錯誤'));
        }

        const existingBooking = await courseBookingRepo.findOne({
            where: { user_id: userId, course_id: courseId },
        });
        if (existingBooking) {
            return next(appError(400, '已經報名過此課程'));
        }

        const bookingCount = await courseBookingRepo.count({
            where: { course_id: courseId },
        });
        if (bookingCount >= course.max_participants) {
            return next(appError(400, '已達最大參加人數，無法參加'));
        }

        const creditPurchases = await creditPurchaseRepo.find({
            where: { user_id: userId },
            order: { created_at: 'ASC' },
        });

        let totalCredits = 0;
        let creditToDeductFrom = null;

        for (let purchase of creditPurchases) {
            totalCredits += purchase.purchased_credits;
            if (purchase.purchased_credits > 0 && !creditToDeductFrom) {
                creditToDeductFrom = purchase;
            }
        }

        if (totalCredits <= 0) {
            return next(appError(400, '已無可使用堂數'));
        }

        if (creditToDeductFrom) {
            creditToDeductFrom.purchased_credits -= 1;
            await creditPurchaseRepo.save(creditToDeductFrom);
        }

        const newBooking = courseBookingRepo.create({
            user_id: userId,
            course_id: courseId,
            booking_at: new Date(),
            status: 'booked',
        });

        await courseBookingRepo.save(newBooking);

        course.max_participants -= 1;
        await courseRepo.save(course);

        return res.status(201).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

// 取消報名課程
router.delete('/:courseId', isAuth, async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        if (isUndefined(courseId) || isNotValidString(courseId)) {
            return next(appError(400, '欄位未填寫正確'));
        }

        const courseRepo = await dataSource.getRepository('Course');
        const creditPurchaseRepo = await dataSource.getRepository(
            'CreditPurchase'
        );
        const courseBookingRepo = await dataSource.getRepository(
            'CourseBooking'
        );

        const course = await courseRepo.findOne({ where: { id: courseId } });
        if (!course) {
            return next(appError(400, '課程不存在'));
        }

        const booking = await courseBookingRepo.findOne({
            where: { user_id: userId, course_id: courseId },
        });

        if (!booking) {
            return next(appError(400, '未報名此課程'));
        }

        const creditPurchase = await creditPurchaseRepo.findOne({
            where: { user_id: userId },
            order: { created_at: 'ASC' },
        });

        if (creditPurchase) {
            creditPurchase.purchased_credits += 1;
            await creditPurchaseRepo.save(creditPurchase);
        }

        course.max_participants += 1;
        await courseRepo.save(course);

        await courseBookingRepo.remove(booking);

        res.status(200).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

module.exports = router;
