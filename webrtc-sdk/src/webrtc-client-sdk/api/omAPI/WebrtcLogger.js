/* ES6 LOGGER */
/*
import Logger from 'node-logger-es6'

var es6Logger = Logger.configure(
    {
        level: 'debug',
        rotation: 'd',
        size: 5,
        json: true,
        timestamp: true
    }
); 
*/

/* CUSTOM-LOGGER */
/* Note currently customLogger uses console only
   we can replace it with any other logger for 
   instances: es6Logger or ameyoLogger or winstonLogger.
   essentially the idea is not to duplicate the logic of 
   handling levels and output stream.
 */
export var customLogger =  {

  log : (arg1, ...args) => {
    console.log(arg1, args)
  },

  info : (arg1, ...args) => {
    console.log(arg1, args)
  },  

  warn : (arg1, ...args) => {
    console.log(arg1, args)
  },

  error : (arg1, ...args) => {
    console.log(arg1, args)
  }  

}; 

/* CONSOLE LOGGER */
var consoleLogger = console;

/* FINAL LOGGER TO USE */
export function webrtcLogger() {
    if (customLogger) {
      return customLogger;
    } else {
      return consoleLogger;
    }
} 


