class Time {
  constructor() {
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
    this.milliseconds = 0;
  }

  static safeParseInt(numberString, defaultNumber = 0) {
    if (typeof numberString !== 'string' || typeof defaultNumber  !== 'number') return defaultNumber;

    const tmp = parseInt(numberString, 10);
    return isNaN(tmp) ? defaultNumber : tmp;
  }

  // 解析 hh:mm:ss.fff 或是 mm:ss.fff
  static tryParse(timeString) {
    if (typeof timeString !== 'string') return null;

    const parts = timeString.split(':');
    if (parts.length !== 3 && parts.length !== 2) return null;

    const mmfff = parts[parts.length - 1].split('.');
    const newTime = new Time();
    const hasHour = (parts.length === 3);
    let tmp;
    if (hasHour) {
      newTime.hours = this.safeParseInt(parts[0]);
      newTime.minutes = this.safeParseInt(parts[1]);
    }
    else {
      newTime.hours = 0;
      newTime.minutes = this.safeParseInt(parts[0]);
    }
    newTime.seconds = this.safeParseInt(mmfff[0]);
    newTime.milliseconds =  (mmfff.length < 2) ? 0 : this.safeParseInt(mmfff[1]);
    return newTime;
  }

  static tryParseFromMilliseconds(milliSec) {
    if (typeof milliSec !== 'number' || milliSec < 0) return null;

    const newTime = new Time();
    newTime.milliseconds = Math.floor(milliSec % 1000);
    newTime.seconds = Math.floor(milliSec / 1000) % 60;
    newTime.minutes = Math.floor(milliSec / 60000) % 60;
    newTime.hours = Math.floor(milliSec / 3600000);
    return newTime;
  }

  getTotalMilliseconds() {
    return (this.hours * 60 * 60 * 1000) + 
            (this.minutes * 60 * 1000) + 
            (this.seconds * 1000) + 
            this.milliseconds;
  }

  add(timeB) {
    if (!(timeB instanceof Time)) return null;

    let milliSec = this.getTotalMilliseconds() + timeB.getTotalMilliseconds();
    const newTime = Time.tryParseFromMilliseconds(milliSec);
    return newTime;
  }

  minus(timeB) {
    if (!(timeB instanceof Time)) return null;

    let milliSec = this.getTotalMilliseconds() - timeB.getTotalMilliseconds();
    if (milliSec < 0) return null;

    const newTime = Time.tryParseFromMilliseconds(milliSec);
    return newTime;
  }

  divide(count) {
    if (typeof count !== 'number' || count === 0) return null;

    const milliSec = this.getTotalMilliseconds() / count;
    const newTime = Time.tryParseFromMilliseconds(milliSec);
    return newTime;
  }

  toString({showHours}) {
    if (typeof showHours !== 'boolean') return null;
    function pad(num, size) {
      let s = "0" + num;
      return s.slice(-size);
    }

    const seconds = pad(this.seconds, 2);
    const minutes = pad(this.minutes, 2);
    const milliseconds = pad(this.milliseconds, 3);
    if (showHours) {
      const hours = pad(this.hours, 2);
      return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    return `${minutes}:${seconds}.${milliseconds}`;
  }
}