#!/bin/bash

/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/degods.ts >> /home/server/src/snapshot/logs/degods.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/thugbirdz.ts >> /home/server/src/snapshot/logs/thugbirdz.log
