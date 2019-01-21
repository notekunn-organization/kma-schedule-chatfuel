const moment = require("moment-timezone");
const cron = require("node-schedule");
const broadcast = require('broadcast-chatfuel')({ botID: process.env.CHATFUEL_BOT_ID, token: process.env.CHATFUEL_BOT_TOKEN })
const hourCron = [5, 21];
module.exports = function({ model, Op }) {
    const Describe = model.use('describe');
    let cronTab = cron.scheduleJob('0 * * * *', function() {
        let hourNow = moment.tz('Asia/Ho_Chi_Minh').hours();
        if (hourCron.indexOf(hourNow) == -1) return;
        Describe.findAll({})
            .then(describes => broadcast(describes.map(function(describe) {
                let { chatfuel_user_id } = describe.get({ plain: true });
                return {
                    userID: chatfuel_user_id,
                    blockName: 'thong_bao_thoi_khoa_bieu',
                    attributes: {
                        mess: 'Hello it\'s test message number 0'
                    }
                }
            })))
            .then(() => {
                console.log(`Thông báo thời khóa biểu: ${moment.tz('Asia/Ho_Chi_Minh').format(`HH:mm:ss DD/MM/YYYY`)}`)
            })
    })
}
