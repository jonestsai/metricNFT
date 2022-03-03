#!/bin/bash

/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/stoned-ape-crew.ts >> /home/server/src/snapshot/logs/stoned-ape-crew.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/taiyo-robotics.ts >> /home/server/src/snapshot/logs/taiyo-robotics.log
