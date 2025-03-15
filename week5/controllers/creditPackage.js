const { dataSource } = require('../db/data-source');
const appError = require('../utils/appError');
const {
    isUndefined,
    isNotValidString,
    isNotValidInteger,
} = require('../utils/validation');

const creditPackageController = {
    async getPackageList(req, res, next) {
        const creditPackage = await dataSource
            .getRepository('CreditPackage')
            .find({ select: ['id', 'name', 'credit_amount', 'price'] });
        res.status(200).json({
            status: 'success',
            data: creditPackage,
        });
    },
    async addPackage(req, res, next) {
        const { name, credit_amount: creditAmount, price } = req.body;
        if (
            isUndefined(name) ||
            isNotValidString(name) ||
            isUndefined(creditAmount) ||
            isNotValidInteger(creditAmount) ||
            isUndefined(price) ||
            isNotValidInteger(price)
        ) {
            next(appError(400, '欄位未填寫正確'));
            return;
        }
        const creditPurchaseRepo = await dataSource.getRepository(
            'CreditPackage'
        );
        const existCreditPurchase = await creditPurchaseRepo.find({
            where: {
                name,
            },
        });
        if (existCreditPurchase.length > 0) {
            next(appError(409, '資料重複'));
            return;
        }
        const newCreditPurchase = await creditPurchaseRepo.create({
            name,
            credit_amount: creditAmount,
            price,
        });
        const result = await creditPurchaseRepo.save(newCreditPurchase);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    },
    async deletePackage(req, res, next) {
        const { creditPackageId } = req.params;
        if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
            next(appError(400, 'ID錯誤'));
            return;
        }
        const result = await dataSource
            .getRepository('CreditPackage')
            .delete(creditPackageId);
        if (result.affected === 0) {
            next(appError(400, 'ID錯誤'));
            return;
        }
        res.status(200).json({
            status: 'success',
            data: result,
        });
    },
    async buyPackage(req, res, next) {
        const { creditPackageId } = req.params;
        const userId = req.user.id;
        const { purchased_credits: purchasedCredits, price_paid: pricePaid } =
            req.body;

        if (
            isUndefined(creditPackageId) ||
            isNotValidString(creditPackageId) ||
            isUndefined(userId) ||
            isNotValidString(userId)
        ) {
            next(appError(400, '欄位資料錯誤'));
            return;
        }

        const creditPackageRepo = dataSource.getRepository('CreditPackage');
        const purchasedCreditsRepo = dataSource.getRepository('CreditPurchase');

        const creditPackage = await creditPackageRepo.findOne({
            where: { id: creditPackageId },
        });

        if (!creditPackage) {
            next(appError(400, '購買方案不存在'));
            return;
        }

        const newPurchase = await purchasedCreditsRepo.create({
            user_id: userId,
            credit_package_id: creditPackageId,
            purchased_credits: purchasedCredits || creditPackage.credit_amount,
            price_paid: pricePaid || creditPackage.price,
            purchase_at: new Date(),
        });

        await purchasedCreditsRepo.save(newPurchase);

        res.status(201).json({
            status: 'success',
            data: null,
        });
    },
};

module.exports = creditPackageController;
