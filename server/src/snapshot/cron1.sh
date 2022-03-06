#!/bin/bash

/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/aurory.ts >> /home/server/src/snapshot/logs/aurory.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/stoned-ape-crew.ts >> /home/server/src/snapshot/logs/stoned-ape-crew.log
