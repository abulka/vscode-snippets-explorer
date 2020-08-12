const winston = require('winston');
const fs = require("fs");
var path = require('path');
const process = require('process');
const os = require('os');

const debug = false
const logDir = getAppLogDir() // platform specific
const mainLogName = 'debug.log'
const mainLogFileFullPath = path.join(logDir, mainLogName)

// Create the (entire path to) the output log directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Remove previous log file, if any
fs.unlink(mainLogFileFullPath, function (err) {
    if (err && err.code == 'ENOENT') {
        // file doesn't exist
        if (debug) console.info(`File ${mainLogFileFullPath} doesn't exist, won't remove it.`)
    } else if (err) {
        // other errors, e.g. maybe we don't have permission
        console.error(`Error occurred while trying to remove file  ${mainLogFileFullPath}`)
    } else {
        if (debug) console.info(`Removed previous log file ${mainLogFileFullPath}`);
    }
})

const logConfiguration = {
    level: 'info',
    // format: winston.format.json(),
    format: winston.format.simple(),
    // defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        // new winston.transports.File({ filename: 'snippets-explorer-error.log', level: 'error' }),
        // new winston.transports.File({ filename: '/tmp/snippets-explorer-combined.log' }),

        new winston.transports.File({ filename: mainLogFileFullPath }),

        // new (winston.transports.Console)({
        //     colorize: 'all'
        // }),

        // new (winston.transports.File)({filename: path.join(logDir, '/log.txt')})
    ],
}
const logger = winston.createLogger(logConfiguration);

// If we're not in production then log to the `console`
// But this doesn't work - seeing no message in my vscode debug console during extension development?
if (process.env.NODE_ENV !== 'production') {
    // console.log('adding Console logger')
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}


// Util


/**
 * Calculate the logging output directory for this extension.
 * 
 * Surely there should be a standard logging location on all platforms and Winston 
 * should take care of this? Sadly, it seems not.
 * 
 * After researchign, the official log locations seem to be:
 *
 *   windows: %LOCALAPPDATA% 
 *          or C:\Documents and Settings\All Users\Application Data\MyApp
 *          or C:\Documents and Settings\%Username%\Application Data\MyApp
 *          or %UserProfile%\Application Data\MyApp
 *          or 'AppData/Local/Programs/MyApp'  <- chose this
 *   mac: ~/Library/Logs/MyApp/
 *   linux: ~/.config/MyApp/  (there is probably a better place?)
 *
 * Note: when you don't specify a directory `transport.dirname` is `.` and 
 *       despite `cwd` these seem to be the default dir locations
 *
 *   windows: C:\Users\Andy\AppData\Local\Programs\Microsoft VS Code\
 *   linux:   /home/andy/    (suprisingly bad default location!)
 *   mac:     ?  (couldn't find it - possibly not created at all?)
 *            P.S. I was getting permission denied on Mac when experimented with 
 *                 specifying a relative dir e.g. 'mylogs' which could end up 
 *                 being anywhere - so fair enough
 *
 * Note: on Mac you can view logs using the 'console' app which browses all the common
 *       log locations like ~/Library/Logs, /var/log etc. You can then see the app dirs
 *       and then actual .log files inside each of those app dirs.
 */
function getAppLogDir() {
    const homedir = os.homedir();
    const appLogDirName = 'vscode-snippets-explorer';
    switch (os.type()) {
        case 'Darwin': return path.join(homedir, 'Library/Logs/', appLogDirName);
        case 'Linux': return path.join(homedir, '.config/', appLogDirName);
        case 'Windows_NT': return path.join(homedir, 'AppData/Local/Programs/', appLogDirName);
        default: return path.join(homedir, '.config/', appLogDirName);
    }
}


/**
 * Debug print the current directory and logger config as much as we can - though we can't seem
 * to get the actual absolute path when specifying relative dirs for transports - how to get this info?
 */
function debugTransport() {
    console.log("Current working directory: ", process.cwd());

    // Seems to give the dir name of the directory this extension is in:
    // e.g. /Users/Andy/Devel/vscode-extensions/vscode-snippets-explorer/lib
    console.log(`__dirname is ${__dirname}`)

    logger.transports.forEach(transport => {
        if (transport.filename)
            console.log(`logger file transport dirname/filename ${path.join(transport.dirname, transport.filename)}`)
    });
}
if (debug) debugTransport()

/**
 * Actually log function to call from everywhere
 * 
 * @param {string} msg message to print to log
 */
function appLog(msg) {
    console.log(msg) // shouldn't need this if I add a console logger, but messages don't appear in my debug console using winston, so keep this
    logger.info(msg);
}

module.exports.appLog = appLog
