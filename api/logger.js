/**
 *@author:istiklal
 */

 const env = require("../configuration");
 const fs = require("fs");

 // log format :
 // '[priorityLevel - loggerName - logTime - functionName - line {lineNo} - process {processId} - thread {threadId}] : message'
 // logTime must be in form of 2021-10-15 12:37:45,154

module.exports = class Logger {
    /**
     * @param file: log file name with full path
     * @param level: min priority level for logging [0: not set, 10: debug, 20: info, 30: warning, 40: error, 50: critical]
     */

    file = env.LOG_FILE;
    streamLevel = env.STREAM_LOGGING_LEVEL;
    fileLevel = env.FILE_LOGGING_LEVEL;

    constructor(loggerName){
        this.name = loggerName;
    }

    dateFormatter = date => `${date.getFullYear()}-${("0"+date.getMonth()).slice(-2)}-${("0"+date.getDate()).slice(-2)} ${("0"+date.getHours()).slice(-2)}:${("0"+date.getMinutes()).slice(-2)}:${("0"+date.getSeconds()).slice(-2)},${("00"+date.getMilliseconds()).slice(-3)}`

    bas(message){
        console.log("hi from me : "+this.name+" ["+message+"] logs are avaliable on file : "+this.file);
    }
    
    debug(message, functionName="N/A", lineNo="00"){
        const funcLevel = 10;
        const date = new Date();
        const sentence = `[DEBUG - ${this.name} - ${this.dateFormatter(date)} - ${functionName} - line ${lineNo} - process N/A - thread N/A] : ${message}`
        if(funcLevel >= this.streamLevel) console.log(`\x1b[36m${sentence}\x1b[0m`);
        if(funcLevel >= this.fileLevel) {
            fs.appendFile(this.file, `\n${sentence}`, (err) => {if(err) console.log(`ERROR : ${err}`)});
        }
    }

    info(message, functionName="N/A", lineNo="00"){
        const funcLevel = 20;
        const date = new Date();
        const sentence = `[INFO - ${this.name} - ${this.dateFormatter(date)} - ${functionName} - line ${lineNo} - process N/A - thread N/A] : ${message}`
        if(funcLevel >= this.streamLevel) console.log(sentence);
        if(funcLevel >= this.fileLevel) {
            fs.appendFile(this.file, `\n${sentence}`, (err) => {if(err) console.log(`ERROR : ${err}`)});
        }
    }

    warning(message, functionName="N/A", lineNo="00"){
        const funcLevel = 30;
        const date = new Date();
        const sentence = `[WARNING - ${this.name} - ${this.dateFormatter(date)} - ${functionName} - line ${lineNo} - process N/A - thread N/A] : ${message}`
        if(funcLevel >= this.streamLevel) console.log(`\x1b[33m${sentence}\x1b[0m`);
        if(funcLevel >= this.fileLevel) {
            fs.appendFile(this.file, `\n${sentence}`, (err) => {if(err) console.log(`ERROR : ${err}`)});
        }
    }

    error(message, functionName="N/A", lineNo="00"){
        const funcLevel = 40;
        const date = new Date();
        const sentence = `[ERROR - ${this.name} - ${this.dateFormatter(date)} - ${functionName} - line ${lineNo} - process N/A - thread N/A] : ${message}`
        if(funcLevel >= this.streamLevel) console.log(`\x1b[31m${sentence}\x1b[0m`);
        if(funcLevel >= this.fileLevel) {
            fs.appendFile(this.file, `\n${sentence}`, (err) => {if(err) console.log(`ERROR : ${err}`)});
        }
    }

    critical(message, functionName="N/A", lineNo="00"){
        const funcLevel = 50;
        const date = new Date();
        const sentence = `[CRITICAL - ${this.name} - ${this.dateFormatter(date)} - ${functionName} - line ${lineNo} - process N/A - thread N/A] : ${message}`
        if(funcLevel >= this.streamLevel) console.log(`\x1b[31m${sentence}\x1b[0m`);
        if(funcLevel >= this.fileLevel) {
            fs.appendFile(this.file, `\n${sentence}`, (err) => {if(err) console.log(`ERROR : ${err}`)});
        }
    }



}
