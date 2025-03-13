const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CourseBooking',
    tableName: 'COURSE_BOOKING',
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
                name: 'course_booking_user_id_fkey',
                columnNames: ['user_id'],
                referencedTableName: 'USER',
                referencedColumnNames: ['id'],
            },
        },
        course_id: {
            type: 'uuid',
            nullable: false,
            foreignKey: {
                name: 'course_booking_course_id_fkey',
                columnNames: ['course_id'],
                referencedTableName: 'COURSE',
                referencedColumnNames: ['id'],
            },
        },
        booking_at: {
            type: 'timestamp',
            nullable: false,
        },
        status: {
            type: 'varchar',
            length: 20,
            nullable: false,
        },
        join_at: {
            type: 'timestamp',
            nullable: true,
        },
        leave_at: {
            type: 'timestamp',
            nullable: true,
        },
        cancelled_at: {
            type: 'timestamp',
            nullable: true,
        },
        cancellation_reason: {
            type: 'varchar',
            length: 255,
            nullable: true,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            name: 'created_at',
            nullable: false,
        },
    },
});
