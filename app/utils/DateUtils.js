let moment = require('moment');

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
    var preDate = this.formatDateString(preDateStr, '%Y-%m-%d %H:%M');
    var nextDate = this.formatDateString(nextDateStr, '%Y-%m-%d %H:%M');

    var isBefore = moment(preDate).isBefore(nextDate);
    return isBefore;
}