// const router = require("express").Router()
// module.exports = function({model, Op}){

// }

const router = require("express").Router();
const Chatfuel = require("chatfuel-helper");
const loginKMA = require("tin-chi-kma")({});
const parseSchedule = require("parse-schedule-kma");
module.exports = function({ model, Op }) {
    const User = model.use('user');
    const Describe = model.use('describe');
    const Schedule = model.use('schedule');
    router.post('/update', function(req, res, next) {
        let { 'chatfuel user id': chatfuel_user_id, tai_khoan_sinh_vien: user, mat_khau_sinh_vien: pass } = req.body;
        loginKMA({ user, pass }, async function(error, api) {
            if (error) return res.send((new Chatfuel).sendText('Tài khoản hoặc mật khẩu không đúng').sendText('Vui lòng thử lại').render())
            else {
                // let result = {new Chatfuel();
                await Describe.upsert({
                    chatfuel_user_id
                }, { fields: ['chatfuel_user_id'] })
                res.json({
                    redirect_to_blocks: ['thoi_khoa_bieu'],
                    messages: [{
                        text: "Đang tiến hành tải thời khóa biểu về\nBạn có thể tra cứu sau vài giây!"
                    }]
                })
                api.studentTimeTable.downloadTimeTable({ semester: 'f85b945085ee4b8898a30165ca1833ff' }, function(buffer) {

                    let { studentCode, studentName, scheduleData } = parseSchedule(buffer);
                    if (!studentCode) return Describe.destroy({
                        where: {
                            chatfuel_user_id
                        }
                    })
                    Promise.all(scheduleData.map(schedule => Schedule.upsert({
                        studentCode,
                        ...schedule
                    }))).then(Describe.update({
                        studentCode,
                        studentName,
                        done: true
                    }, { where: { chatfuel_user_id } }))
                })
            }
        })
    });

    router.get('/', function(req, res) {

    })

    return router;
}
