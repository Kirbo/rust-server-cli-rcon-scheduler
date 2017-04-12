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
 
    # Edit both "rcon.json" and "schedules.json" files, with your favorite editor, e.g.
    nano rcon.json schedules.json
    
    # Make sure you have "+rcon.web true" in your Rust server,
    # otherwice this wont work (at least for now)..

    # Start the scheduler
    node index.js
    
    # If you have installed `npm`, can be started with this command also:
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

Messages need to have `command` and either of these: `interval` or `after`.

You can modify the `schedules.json` while the script is running. It will check for changes in the file every 10 seconds, 
so you don't need to restart the script if you make changes. Remember to delete the messages which have the `after` 
property set, if you are going to modify the `schedules.json` on the fly, because they will be triggered again if you 
don't delete them from the file :)

#### Exiting the client

Simply press **CTRL + C** and the scheduler will exit.

# Motivation
A man named Simon contacted me via e-mail, because of my other project [rust-server-cli-rcon](https://github.com/kirbo/rust-server-cli-rcon) 
and asked can he execute timed commands with it, so I offered that I can create such tool for him and here it is.


# Screenshot(s)

![screenshot](https://raw.githubusercontent.com/kirbo/rust-server-cli-rcon-scheduler/master/screenshots/screenshot.png)
