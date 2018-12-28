module.exports = function({ sequelize, Sequelize }) {
    let Schedule = sequelize.define('schedule', {
        
        studentCode: Sequelize.STRING,
        day: Sequelize.STRING,
        subjectCode: Sequelize.STRING,
        subjectName: Sequelize.STRING,
        className: Sequelize.STRING,
        teacher: Sequelize.STRING,
        lesson: Sequelize.STRING,
        room: Sequelize.STRING
        
    });
    Schedule.sync({ force: process.env.NODE_ENV == 'build' });
    return Schedule;
}
