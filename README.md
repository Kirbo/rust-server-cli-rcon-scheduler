# rust-server-cli-rcon-scheduler
Rust Server CLI RCON Scheduler

# Installation

#### Installing Node.js
Check the instructions how to install Node.js and NPM on your OS:
https://nodejs.org/en/download/package-manager/

Tested to be working with Node.js version >= `v0.12.18`, but I'm pretty sure this should work with pretty much any
version of Node.js.

#### Installing the rust-server-cli-rcon

    # Clone this repository
    git clone https://github.com/kirbo/rust-server-cli-rcon-scheduler.git
    
    # Change directory
    cd rust-server-cli-rcon-scheduler
 
    # Install dependencies
    npm install
 
    # Edit "rcon.json" file, with your favorite editor, e.g.
    nano rcon.json
 
    # Copy any of the "example-*.schedules.json" file and edit it with your favorite editor, e.g.
    cp example-schedules.json schedules.json
    nano schedules.json
    
    # Make sure you have "+rcon.web true" in your Rust server,
    # otherwice this wont work (at least for now)..

    # Start the scheduler
    npm start

# Usage

You can set commands in the `schedules.json` file via 2 different ways, such as:

    [
        {
            "command": "say This message will be send every minute",
            "interval": 1
        }
    ]
    
Or if you want the command to be executed after specified time:

    [
        {
            "command": "say This message will be sent only once, after the given time below",
            "after": "2017-04-12 17:15:00"
        }
    ]

The message above will be triggered only once (after the `schedules.json` has been loaded).

Commands are structured as following:
    
    {
        "command": "say Don't play on Christmas day...",
        "after": "2017-12-24 00:00:00",
        "interval": 5,
        "until": "2017-12-24 23:59:59"
    }

`command` needs to be set in every command. This is RCON command you want to execute.
With `command` you **need** to set one of the following: `interval` or `after`.
With `after`  you can also set `interval`, if you want your command to be intervalled after specified time.
With `after`  you can also set `interval` and `until`, if you want your command to be intervalled with specified time range.

To be more precise, here are the examples:

#### This is executed only once:
    
    {
        "command": "say Don't play on Christmas day...",
        "after": "2017-12-24 00:00:00"
    }
    
#### This is executed every minute after the specified time:
    
    {
        "command": "say Don't play on Christmas day...",
        "after": "2017-12-24 00:00:00",
        "interval": 1
    }
    
#### This is executed every minute with the range from 00:00 - 23:59 on 24.12.2017:
    
    {
        "command": "say Don't play on Christmas day...",
        "after": "2017-12-24 00:00:00",
        "interval": 1,
        "until": "2017-12-24 23:59:59"
    }

You can modify the `schedules.json` while the script is running. It will check for changes in the file every 10 seconds, 
so you don't need to restart the script if you make changes. Remember to delete the messages which have the `after` 
property set, if you are going to modify the `schedules.json` on the fly, because they will be triggered again if you 
don't delete them from the file :)

#### Exiting the client

Simply press **CTRL + C** and the scheduler will exit.

# Motivation
A man named Simon contacted me via e-mail, because of my other project [rust-server-cli-rcon](https://github.com/kirbo/rust-server-cli-rcon) 
and asked can he execute timed commands with it, so I offered that I can create such tool for him and here it is.

One requirement was that should be possible to set intervals and/or intervals for commands, without the need of installing
any mods for the Rust server, so this works without any mods (i.e.: Oxide) on a Vanilla Rust Server.
Only thing that you need to do is to install this and set the `+rcon.web true` when you start your server and you're 
good to go.


# Screenshot(s)

![screenshot](https://raw.githubusercontent.com/kirbo/rust-server-cli-rcon-scheduler/master/screenshots/screenshot.png)


# Happy scheduling :)