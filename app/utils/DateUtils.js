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
