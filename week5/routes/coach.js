const express = require('express');

const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Coach');

function isUndefined(value) {
    return value === undefined;
}

function isNotValidString(value) {
    return (
        typeof value !== 'string' || value.trim().length === 0 || value === ''
    );
}

router.get('/', async (req, res, next) => {
    try {
        let per = parseInt(req.query.per) || 5;
        let page = parseInt(req.query.page) || 1;

        const coachRepository = dataSource.getRepository('User');
        const [coaches, total] = await coachRepository.findAndCount({
            select: ['id', 'name'],
            where: { role: 'COACH' },
            skip: (page - 1) * per,
            take: per,
        });
        res.status(200).json({
            status: 'success',
            data: coaches,
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

router.get('/:coachId', async (req, res, next) => {
    try {
        const { coachId } = req.params;

        if (isUndefined(coachId) || isNotValidString(coachId)) {
            logger.warn('欄位未填寫正確');
            res.status(400).json({
                status: 'failed',
                message: '欄位未填寫正確',
            });
            return;
        }
        const coachInfoRepository = dataSource.getRepository('Coach');
        const coachInfo = await coachInfoRepository.findOne({
            where: { user_id: coachId },
            relations: ['User'],
        });
        if (!coachInfo) {
            logger.warn('找不到該教練');
            res.status(400).json({
                status: 'failed',
                message: '找不到該教練',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    name: coachInfo.User.name,
                    role: coachInfo.User.role,
                },
                coach: {
                    id: coachInfo.id,
                    user_id: coachInfo.user_id,
                    experience_years: coachInfo.experience_years,
                    description: coachInfo.description,
                    profile_image_url: coachInfo.profile_image_url,
                    created_at: coachInfo.created_at,
                    updated_at: coachInfo.updated_at,
                },
            },
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

module.exports = router;
