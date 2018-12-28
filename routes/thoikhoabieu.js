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

    function getDate(date) {
        let now = new Date(date || new Date());
        let month = now.getMonth() + 1 + '';
        let day = now.getDate() + '';
        let year = now.getFullYear();

        day = day.length < 2 ? '0' + day : day;
        month = month.length < 2 ? '0' + month : month;
        return `${day}/${month}/${year}`
    }
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
                    Promise.all(scheduleData.map(schedule => Schedule.findOrCreate({
                        where: {
                            studentCode,
                            ...schedule
                        },
                        defaults:{}
                    }))).then(Describe.update({
                        studentCode,
                        studentName,
                        done: true
                    }, { where: { chatfuel_user_id } }))
                })
            }
        })
    });

    router.post('/', async function(req, res) {
        let { 'chatfuel user id': chatfuel_user_id } = req.body;
        let { dateFind, thisweek } = req.query;
        try {
            let studentDescribed = await Describe.findOne({
                where: { chatfuel_user_id, done: true },
                attributes: ['studentCode', 'studentName']
            })
            if (!studentDescribed) return res.send((new Chatfuel()).sendText("Vui lòng đăng nhập trước khi tra cứu").render());
            let chatfuel = new Chatfuel();
            let { studentName, studentCode } = studentDescribed.get({ plain: true })
            chatfuel.sendText(`Tài khoản sinh viên của bạn:\n${studentName}(${studentCode})`);
            
            let scheduleNow = await Schedule.findAll({
                where: {
                    [Op.and]: {
                        studentCode,
                        day: dateFind || getDate()
                    }
                }
            });
            // console.log(scheduleNow)
            if (scheduleNow.length==0) return res.send(chatfuel.sendText("Không có thời khóa biểu hôm nay!").render());
            scheduleNow.forEach(raw => {
                let { day, subjectCode, subjectName, className, teacher, lesson, room } = raw.get({ plain: true });
                chatfuel.sendText(`Ngày ${day}, Tiết ${lesson}:\n${subjectName}\nĐịa điểm: ${room} ${ teacher ? '\nGiáo viên: '+ teacher : '.'}`);
            })
            res.send(chatfuel.render());
        }
        catch (e) {
            res.send((new Chatfuel()).sendText("Bị lỗi khi tra cứu:\n" + e).render());
        }
    })

    return router;
}
