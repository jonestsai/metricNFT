#!/bin/bash

/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/smb.ts >> /home/server/src/snapshot/logs/smb.log
/home/server/node_modules/.bin/ts-node /home/server/src/snapshot/portals.ts >> /home/server/src/snapshot/logs/portals.log
