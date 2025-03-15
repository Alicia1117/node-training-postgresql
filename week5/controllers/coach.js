const { dataSource } = require('../db/data-source');
const appError = require('../utils/appError');
const logger = require('../utils/logger')('Coach');
const {
    isUndefined,
    isNotValidString,
    isValidateUUID,
} = require('../utils/validation');

const coachController = {
    async getCoachList(req, res, next) {
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
    },
    async getCoachDetail(req, res, next) {
        const { coachId } = req.params;

        if (isUndefined(coachId) || isNotValidString(coachId)) {
            logger.warn('欄位未填寫正確');
            next(appError(400, '欄位未填寫正確'));
            return;
        }
        const coachInfoRepository = dataSource.getRepository('Coach');
        const coachInfo = await coachInfoRepository.findOne({
            where: { user_id: coachId },
            relations: ['User'],
        });
        if (!coachInfo) {
            logger.warn('找不到該教練');
            next(appError(400, '找不到該教練'));
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
    },
};

module.exports = coachController;
