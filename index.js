var W3CWebSocket = require('websocket').w3cwebsocket;
var Promise = require('promise');
var fs = require('fs');

var rconConfig = require('./rcon.json');


// Should the commands be executed instantly on startup? `true` / `false`
var executeOnStart = false;

// Should the commands be executed instantly after the new schedules have been loaded? `true` / `false`
var executeAfterLoad = false;

// Should the timed commands be executed instantly? `true` / `false`
var executeTimerInstantly = true;

// Value in seconds: interval for checking changes in `schedules.json` and executing the commands with `after` property.
var checkNewSchedules = 10;


/* Don't touch anything below unless you know what you're doing */
var rcon;
var schedules = [];
var timers = new Map();
var toBeExecuted = new Set();
var toBeCleared = new Set();
var first = true;
var second = 1000;
var minute = 60 * second;
var offset = 5;
var lastIndex = 1000;
var callbacks = new Map();
var currentTime;
var currentDate;
var dayChanged = false;

function text(text) {
    console.log('[' + new Date + '] ' + text);
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
        rcon.onmessage = function (e) {
            var data = JSON.parse(e.data);

            if (data.Message && data.Identifier > 1000) {
                text('Response for command: '+callbacks.get(data.Identifier));
                console.log(data.Message);
            }
            callbacks.delete(data.Identifier);
        };
    });
}

function rconCmd(command) {
    text('RCON: Sending command: ' + command);
    return new Promise(function (resolve, reject) {
        lastIndex++;
        callbacks.set(lastIndex, command);
        rcon.send(JSON.stringify({
            Identifier: lastIndex,
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
    dayChanged = (new Date(currentDate) < new Date());
    if (
        (JSON.stringify(schedules) !== JSON.stringify(newSchedules))
        || dayChanged
    ) {
        if (dayChanged) {
            text('Day changed, reloading schedules.');
            setCurrentDate();
        }
        if (!first) {
            text('New schedules loaded!');
            clearTimers();
        }
        schedules = newSchedules;
        createTimers();
        text('New schedules initialised, waiting for '+offset+' seconds before setting schedules.');
        first = false;
    }
}

function createTimer(schedule, executeInstantly) {
    setTimeout(function() {
        if (
            (first && executeOnStart)
            || (!first && executeAfterLoad)
            || executeInstantly
        ) {
            executeCommand(schedule);
        }
        var timer = setInterval(function() {
            executeCommand(schedule);
        }, schedule.interval * minute);
        timers.set(schedule, timer);
    }, offset * 1000);
}

function executeCommand(schedule) {
    return new Promise(function (resolve, reject) {
        rconCmd(schedule.command).then(function (response) {
            resolve(true);
        });
    });
}

function checkIfAsterisk(text, value) {
    if (value === '*') {
        if (text === 'year') {
            return new Date().getFullYear();
        }
        else if (text === 'month') {
            return prefixWithZero(new Date().getMonth() + 1);
        }
        else if (text === 'day') {
            return prefixWithZero(new Date().getDate());
        }
    }
    else {
        return value;
    }
}

function prefixWithZero(value) {
    return ("0" + value).slice(-2);
}

function hasAsterisk(value) {
    var regex = /\*/;

    return !!regex.exec(value);
}

function parseTime(time) {
    var returnTime = time;

    var regex = /(\d+|\*)-(\d+|\*)-(\d+|\*) (\d+):(\d+)(:(\d+))?/;
    var matches = regex.exec(time);
    if (matches) {
        var year = checkIfAsterisk('year', matches[1]);
        var month = checkIfAsterisk('month', matches[2]);
        var day = checkIfAsterisk('day', matches[3]);
        var hour = prefixWithZero(matches[4]);
        var minute = prefixWithZero(matches[5]);
        var second = prefixWithZero(matches[7] || 0);

        returnTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }

    return new Date(returnTime);
}

function checkTimed() {
    toBeExecuted.forEach(function(schedule) {
        if (
            (schedule.after && parseTime(schedule.after) <= new Date() && !schedule.until)
            || (schedule.after && parseTime(schedule.after) <= new Date() && parseTime(schedule.until) > new Date())
        ) {
            if (schedule.interval) {
                if (
                    !schedule.until
                    || (schedule.until && parseTime(schedule.until) > new Date())
                ) {
                    createTimer(schedule, executeTimerInstantly);
                    if (schedule.until) {
                        toBeCleared.add(schedule);
                    }
                }
            }
            else {
                executeCommand(schedule);
            }
            toBeExecuted.delete(schedule);
        }
    });

    toBeCleared.forEach(function(schedule){
        if (schedule.until && parseTime(schedule.until) < new Date()) {
            clearInterval(timers.get(schedule));
            toBeCleared.delete(schedule);
        }
    })
}

function createTimers() {
    schedules.map(function(schedule) {
        if (schedule.interval && !schedule.after) {
            createTimer(schedule);
        }
        else if (schedule.after) {
            toBeExecuted.add(schedule);
        }
    });
}

function clearTimers() {
    toBeExecuted = new Set();
    toBeCleared = new Set();
    timers.forEach(function(timer) {
        clearInterval(timer);
    });
    text('Old schedules cleared');
}

function startMainInterval() {
    loadSchedules();
    setInterval(function() {
        loadSchedules();
        checkTimed();
    }, checkNewSchedules * second);
}

function setCurrentDate() {
    currentTime = new Date();
    currentDate = currentTime.getFullYear() +'-'+prefixWithZero(new Date().getMonth() + 1) +'-'+prefixWithZero(new Date().getDate()) +' 23:59:59';
}

setCurrentDate();

rconConnect()
    .then(function () {
        startMainInterval();
    })
    .catch(function (error) {
        console.error('Error:', error);
    })
;
