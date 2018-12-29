// const router = require("express").Router()
// module.exports = function({model, Op}){

// }

const router = require("express").Router();
const Chatfuel = require("chatfuel-helper");
const loginKMA = require("tin-chi-kma")({});
// const moment = require("moment");
const moment = require("moment-timezone");
const parseSchedule = require("parse-schedule-kma");
module.exports = function({ model, Op }) {
    const User = model.use('user');
    const Describe = model.use('describe');
    const Schedule = model.use('schedule');

    function getDate(date) {
        // let now = new Date(moment.date || new Date());
        let now;
        if (date) now = moment.tz(date, "DD/MM/YYYY", "Asia/Ho_Chi_Minh")
        else now = moment().tz("Asia/Ho_Chi_Minh")
        let month = now.getMonth() + 1 + '';
        let day = now.getDate() + '';
        let year = now.getFullYear();

        day = day.length < 2 ? '0' + day : day;
        month = month.length < 2 ? '0' + month : month;
        return `${day}/${month}/${year}`
    }

    function getDaysOfWeek(date = new Date()) {
        let now = moment.tz(moment.tz(new Date(date), "Asia/Ho_Chi_Minh").format("DD/MM/YYYY"), "DD/MM/YYYY", "Asia/Ho_Chi_Minh");
        let result = new Array();
        for (let i = 0; i <= 6; i++) {
            result.push(now.day(i).format("DD/MM/YYYY"));
        }
        return result;
    }

    function diffDay(a, b) {
        return moment.tz(a.day, "DD/MM/YYYY", "Asia/Ho_Chi_Minh").unix() - moment.tz(b.day, "DD/MM/YYYY", "Asia/Ho_Chi_Minh").unix();
    }
    //Xử lý trung gian kiểm tra xem đã đăng ký hay chưa
    router.post('/', async function(req, res, next) {
        let { 'chatfuel user id': chatfuel_user_id } = req.body;
        let studentDescribed = await Describe.findOne({
            where: { chatfuel_user_id },
            attributes: ['studentCode', 'studentName', 'done']
        });
        if (!studentDescribed) return res.send((new Chatfuel()).redirectToBlock(['nhap_info_sinhvien']));
        else if (studentDescribed.get({ plain: true }).done == false) return res.send((new Chatfuel()).sendText("Đang trong quá trình cập nhật").sendText("Thử lại sau vài giây").render());
        else return res.send((new Chatfuel()).redirectToBlock(['tra_cuu_thoi_khoa_bieu']));
    })
    //Xử lý cập  nhật thời khóa biểu
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
                    redirect_to_blocks: ['tra_cuu_thoi_khoa_bieu'],
                    messages: [{
                        text: "Đang tiến hành tải thời khóa biểu về\nBạn có thể tra cứu sau vài giây!"
                    }]
                })
                api.studentTimeTable.downloadTimeTable({}, function(buffer) {

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
                        defaults: {}
                    }))).then(Describe.update({
                        studentCode,
                        studentName,
                        done: true
                    }, { where: { chatfuel_user_id } }))
                })
            }
        })
    });
    //Xử lý tra cứu
    router.post('/search', async function(req, res) {
        let { 'chatfuel user id': chatfuel_user_id } = req.body;
        let { dateFind, asweek, today, dayofweek } = req.query;
        try {
            let studentDescribed = await Describe.findOne({
                where: { chatfuel_user_id, done: true },
                attributes: ['studentCode', 'studentName']
            })
            if (!studentDescribed) return res.send((new Chatfuel()).sendText("Vui lòng đăng nhập trước khi tra cứu").render());
            let chatfuel = new Chatfuel();
            let { studentName, studentCode } = studentDescribed.get({ plain: true })
            // chatfuel.sendText(`Tài khoản sinh viên của bạn:\n${studentName}(${studentCode})`);

            let scheduleNow = (await Schedule.findAll({
                    where: {
                        studentCode,
                        day: asweek ? {
                            [Op.in]: getDaysOfWeek(dayofweek || undefined)
                        } : (dateFind || getDate())
                    }
                }))
                .map(e => e.get({ plain: true }))
                .sort(function(a, b) {
                    return diffDay(a, b) > 0 || (diffDay(a, b) == 0 && parseInt(a.lesson) - parseInt(b.lesson) > 0)
                });

            if (scheduleNow.length == 0) return res.send(chatfuel.sendText("Không có thời khóa biểu!").render());
            if (!asweek) {
                scheduleNow.forEach(({ day, subjectCode, subjectName, className, teacher, lesson, room }, index) => {
                    if (index == 0) chatfuel.sendText(`Thời khóa biểu ngày ${day}`);
                    chatfuel.sendText(`\`\`\`\nTiết ${lesson}:\n${subjectName}\nĐịa điểm: ${room} ${ teacher ? '\nGiáo viên: '+ teacher : '.'}\n\`\`\``)
                })
            }
            else {
                let weekSchedule = new Object();
                scheduleNow.forEach(({ day, subjectName, teacher, lesson, room, /*subjectCode,className*/ }) => {
                    if (!weekSchedule[day]) weekSchedule[day] = new Object({
                        day,
                        schedules: new Array()
                    })
                    weekSchedule[day].schedules.push({
                        subjectName,
                        teacher,
                        lesson,
                        room,
                        // subjectCode,
                        // className
                    })
                })
                Object.values(weekSchedule).forEach(({ day, schedules }) => {
                    let str = `Ngày ${day}\n\`\`\`\n`;
                    str += schedules.map(({ subjectName, teacher, lesson, room }) => {
                        return `Tiết ${lesson}:\n${subjectName}\nĐịa điểm: ${room}${ teacher ? '\nGiáo viên: '+ teacher : ''}.`;
                    }).join('\n' + '-'.repeat(15) + '\n').trim(/\-+||\n+/);
                    str += `\n\`\`\``;
                    chatfuel.sendText(str);
                })
            }
            res.send(chatfuel.render());
        }
        catch (e) {
            res.send((new Chatfuel()).sendText("Bị lỗi khi tra cứu:\n" + e).render());
        }
    })

    return router;
}
