/**
 * @class Layer.Utils.Logger
 * @private
 *
 */
/* eslint-disable no-console */
import { LOG } from '../constants';
import Settings from '../settings';

const { logSize } = Settings;
const { TIMING, DEBUG, INFO, WARN, ERROR, NONE } = LOG;

const Timezone = new Date().toLocaleTimeString('en-US', {
  timeZoneName: 'short',
  second: 'numeric',
}).replace(/^[\d\s]*/, '');

const cache = [];

// Pretty arbitrary test that IE/edge fails and others don't.  Yes I could do a more direct
// test for IE/edge but its hoped that MS will fix this around the time they cleanup their internal console object.
// Note that uglifyjs with drop_console=true will throw an error on console.assert.toString().match; so we instead do (console.assert.toString() || "") which drop_console
// on replacing console.assert.toString() with (void 0) will still work
const supportsConsoleFormatting = Boolean(console.assert && (console.assert.toString() || '').match(/assert/));
const LayerCss = 'color: #888; font-weight: bold;';
const Black = 'color: black';
/* istanbulify ignore next */
class Logger {
  log(msg, obj, type, color) {
    /* istanbul ignore else */
    if (typeof msg === 'object') {
      obj = msg;
      msg = '';
    }
    let op;
    switch (type) {
      case DEBUG:
        op = 'debug';
        break;
      case INFO:
        op = 'info';
        break;
      case WARN:
        op = 'warn';
        break;
      case ERROR:
        op = 'error';
        break;
      default:
        op = 'log';
    }

    if (typeof document !== 'undefined') {
      const simplerLogData = {
        level: op,
        timestamp: new Date().toISOString(),
        text: msg,
      };
      window.postMessage(simplerLogData, '*');

      simplerLogData.object = obj && typeof obj !== 'object' ? { value: obj } : obj;

      cache.push(simplerLogData);
      if (cache.length > logSize) cache.shift();
    }
    if (this.level < type) return;

    const timestamp = this.level === TIMING ? Date.now() : new Date().toLocaleTimeString();
    if (obj) {
      if (supportsConsoleFormatting) {
        console[op](`%cLayer%c ${op.toUpperCase()}%c [${timestamp}]: ${msg}`, LayerCss, `color: ${color}`, Black, obj);
      } else {
        console[op](`Layer ${op.toUpperCase()} [${timestamp}]: ${msg}`, obj);
      }
    } else if (supportsConsoleFormatting) {
      console[op](`%cLayer%c ${op.toUpperCase()}%c [${timestamp}]: ${msg}`, LayerCss, `color: ${color}`, Black);
    } else {
      console[op](`Layer ${op.toUpperCase()} [${timestamp}]: ${msg}`);
    }
  }


  debug(msg, obj) {
    this.log(msg, obj, DEBUG, '#888');
  }

  info(msg, obj) {
    this.log(msg, obj, INFO, 'black');
  }

  warn(msg, obj) {
    this.log(msg, obj, WARN, 'orange');
  }

  error(msg, obj) {
    this.log(msg, obj, ERROR, 'red');
  }

  getLogs() {
    const result = cache.map((item) => {
      const splits = item.text.split(/\s*:\s*/);
      if (splits.length === 1) splits.unshift('');
      return {
        level: item.level,
        type: splits[0],
        timestamp: item.timestamp,
        timezone: Timezone,
        shortText: splits[1],
        object: item.object,
        /* eslint-disable max-len */
        text: `${item.timestamp} ${Timezone} ${item.level.toUpperCase()} ${splits[0] ? '(' + splits[0] + ')' : ''} ${splits[1]}`,
      };
    });
    return result;
  }
}

/* istanbul ignore next */
Logger.prototype.level = typeof jasmine === 'undefined' ? ERROR : NONE;

const logger = new Logger();

module.exports = logger;

