var W3CWebSocket = require('websocket').w3cwebsocket;
var Promise = require('promise');
var fs = require('fs');

var rconConfig = require('./rcon.json');

// Should the commands be executed on startup and instantly after the new schedules have been loaded? `true` / `false`
var executeOnStartAndAfterLoad = false;

// Value in seconds: interval for checking changes in `schedules.json` and executing the commands with `after` property.
var checkNewSchedules = 10;


/* Don't touch anything below unless you know what you're doing */
var rcon;
var schedules = [];
var timers = [];
var toBeExecuted = new Set();
var first = true;
var second = 1000;
var minute = 60 * second;
var offset = 5;

function text(text, border) {
    console.log('[' + new Date + '] ' + text);
    if (border) {
        console.log('****************' + "\n");
    }
}

function rconConnect() {
    return new Promise(function (resolve, reject) {
        var count = 1;
        text('RCON: Connecting...');
        rcon = new W3CWebSocket('ws://' + rconConfig.host + ':' + rconConfig.port + '/' + rconConfig.pass);
        rcon.onopen = function () {
            text('RCON: Connected');
            resolve(rcon);
        };
        rcon.onerror = function (error) {
            if (count > 10) {
                text('RCON: Connection failed!');
                reject(rcon);
            }
            text('RCON: Retrying connection in 5 seconds');
            setTimeout(function () {
                return rconConnect()
                    .then(
                        function () {
                            resolve();
                        },
                        function (error) {
                            reject(error);
                        }
                    );
            }, 5 * 1000);
            count++;
        };
    });
}

function rconCmd(command) {
    text('RCON: Sending command: ' + command);
    return new Promise(function (resolve, reject) {
        rcon.send(JSON.stringify({
            Identifier: -1,
            Message: command,
            Name: "WebRcon"
        }));
        resolve(rcon);
    });
}

function readSchedules(file) {
    return JSON.parse(fs.readFileSync(file));
}

function loadSchedules() {
    var newSchedules = readSchedules('./schedules.json');
    if (JSON.stringify(schedules) !== JSON.stringify(newSchedules)) {
        if (!first) {
            text('New schedules loaded!');
            clearTimers();
            text('Old timers cleared');
        }
        schedules = newSchedules;
        createTimers();
        text('New schedules initialised, waiting for '+offset+' seconds before setting timers.');
        first = false;
    }
}

function createTimer(schedule) {
    setTimeout(function() {
        if (executeOnStartAndAfterLoad) {
            executeCommand(schedule);
        }
        var timer = setInterval(function() {
            executeCommand(schedule);
        }, schedule.interval * minute);
        timers.push(timer);
    }, offset * 1000);
}

function executeCommand(schedule) {
    return new Promise(function (resolve, reject) {
        rconCmd(schedule.command).then(function () {
            resolve(true);
        });
    });
}

function checkAfter() {
    toBeExecuted.forEach(function(schedule) {
        if (schedule.after && new Date(schedule.after) < new Date()) {
            executeCommand(schedule);
            toBeExecuted.delete(schedule);
        }
    });
}

function createTimers() {
    schedules.map(function(schedule) {
        if (schedule.interval) {
            createTimer(schedule);
        }
        else if (schedule.after) {
            toBeExecuted.add(schedule);
        }
    });
}

function clearTimers() {
    toBeExecuted = new Set();
    timers.map(function(timer) {
        clearInterval(timer);
    });
}

function startMainInterval() {
    loadSchedules();
    setInterval(function() {
        loadSchedules();
        checkAfter();
    }, checkNewSchedules * second);
}

rconConnect()
    .then(function () {
        startMainInterval();
    })
    .catch(function (error) {
        console.error('Error:', error);
    })
;
