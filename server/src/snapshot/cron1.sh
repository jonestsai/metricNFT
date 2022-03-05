#!/bin/bash

/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/nyan-heroes.ts >> /home/server/src/snapshot/logs/nyan-heroes.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/thugbirdz.ts >> /home/server/src/snapshot/logs/thugbirdz.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/aurory.ts >> /home/server/src/snapshot/logs/aurory.log
