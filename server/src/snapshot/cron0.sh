#!/bin/bash

/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/boryoku-dragonz.ts >> /home/server/src/snapshot/logs/boryoku-dragonz.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/smb.ts >> /home/server/src/snapshot/logs/smb.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/portals.ts >> /home/server/src/snapshot/logs/portals.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/shadowy-super-coder.ts >> /home/server/src/snapshot/logs/shadowy-super-coder.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/degenerate-ape-academy.ts >> /home/server/src/snapshot/logs/degenerate-ape-academy.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/mindfolk.ts >> /home/server/src/snapshot/logs/mindfolk.log

