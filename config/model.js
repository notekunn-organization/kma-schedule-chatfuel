module.exports = function({ Sequelize, sequelize }) {
    return {
        model: {
            user: require("./models/user")({ sequelize, Sequelize }),
            schedule: require("./models/schedule")({ sequelize, Sequelize }),
            describe: require("./models/describe")({ sequelize, Sequelize })
        },
        use: function(modelName) {
            return this.model[`${modelName}`];
        }
    }

}
