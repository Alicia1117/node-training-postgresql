const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CreditPurchase',
    tableName: 'CREDIT_PURCHASE',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
            nullable: false,
        },
        user_id: {
            type: 'uuid',
            nullable: false,
            foreignKey: {
                name: 'credit_purchase_user_id_fkey',
                columnNames: ['user_id'],
                referencedTableName: 'USER',
                referencedColumnNames: ['id'],
            },
        },
        credit_package_id: {
            type: 'uuid',
            nullable: false,
            foreignKey: {
                name: 'credit_purchase_credit_package_id_fkey',
                columnNames: ['credit_package_id'],
                referencedTableName: 'CREDIT_PACKAGE',
                referencedColumnNames: ['id'],
            },
        },
        purchased_credits: {
            type: 'integer',
            nullable: false,
        },
        price_paid: {
            type: 'numeric',
            precision: 10,
            scale: 2,
            nullable: false,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            name: 'created_at',
            nullable: false,
        },
        purchase_at: {
            type: 'timestamp',
            createDate: true,
            nullable: false,
        },
    },
});
