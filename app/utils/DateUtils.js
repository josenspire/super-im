let d3 = require('d3');
let moment = require('moment');

exports.formatCommonUTCDate = date => {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

exports.formatStrToUTCDate = (str, format) => {
    let date = moment(str, format, 'en').format('YYYYMMDDHHmmss.SSS');
    date = date + 'Z';
    date = moment(date, 'YYYYMMDDHHmmss.SSSZ').toDate();
    return date;
}

exports.formatUTCDateToStr = (date, format) => {
    return moment(date).format(format);
}

exports.getIntervalHours = (date1, date2) => {
    var hours = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60));
    return hours;
}

exports.isBeforeDateByDayLevel = (date1, offset) => {
    date1 = moment(date1).add(offset, 'h').utc().startOf('day').toDate();
    let currentDate = moment(new Date()).utc().startOf('day').toDate();
    if (date1.getTime() >= currentDate.getTime()) {
        return false;
    }
    return true;
}

exports.compareDate = (preDateStr, nextDateStr) => {
    return moment(preDateStr).isBefore(nextDateStr);
}

exports.compareISODate = (preDateStr, nextDateStr) => {
    var preDate = formatDateString(preDateStr, '%Y-%m-%d %H:%M');
    var nextDate = formatDateString(nextDateStr, '%Y-%m-%d %H:%M');

    var isBefore = moment(nextDate).isBefore(preDate);
    return isBefore;
}

var formatDateString = (dateStr, toFormat, fromFormat) => {
    if (!dateStr) return;

    let fromFormatStr = fromFormat || 'YYYYMMDDHHmmss.SSS';
    let toFormatStr = toFormat || '%d %b (%a) %H:%M'

    let date = dateStr;
    date = moment(date, fromFormatStr).toDate();
    let formater = d3.timeFormat(toFormatStr);
    return formater(date);
}