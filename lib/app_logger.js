const winston = require('winston');
// const fs = require("fs");

// output goes to C:\Users\Andy\AppData\Local\Programs\Microsoft VS Code\

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: 'snippets-explorer-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'snippets-explorer-combined.log' }),
    ],
});

// // create directory for logs first
// if (!fs.existsSync("logs")) {
//     fs.mkdirSync("logs");
// }

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

function appLog(msg) {
	console.log(msg)
	logger.info(msg);
}

module.exports.logger = logger
module.exports.appLog = appLog
