module.exports = function({ sequelize, Sequelize }) {
    let Describe = sequelize.define('describe', {
        chatfuel_user_id: {
            type: Sequelize.STRING,
            unique: true
        },
        studentCode: Sequelize.STRING,
        studentName: Sequelize.STRING,
        done: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    });

    Describe.sync({ force: process.env.NODE_ENV == 'build' });
    return Describe;
}
