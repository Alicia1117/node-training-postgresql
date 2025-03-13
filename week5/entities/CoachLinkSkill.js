const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CoachLinkSkill',
    tableName: 'COACH_LINK_SKILL',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
            nullable: false,
        },
        coach_id: {
            type: 'uuid',
            nullable: false,
            foreignKey: {
                name: 'coach_link_skill_coach_id_fkey',
                columnNames: ['coach_id'],
                referencedTableName: 'COACH',
                referencedColumnNames: ['id'],
            },
        },
        skill_id: {
            type: 'uuid',
            nullable: false,
            foreignKey: {
                name: 'coach_link_skill_skill_id_fkey',
                columnNames: ['skill_id'],
                referencedTableName: 'SKILL',
                referencedColumnNames: ['id'],
            },
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            name: 'created_at',
            nullable: false,
        },
    },
});
