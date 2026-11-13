// scripts/patch_c_fixes.cjs
const fs = require('fs');
const path = require('path');

// 1. Patch AntColony.ts
const antColonyPath = path.resolve(__dirname, '../src/simulation/AntColony.ts');
let antColonyContent = fs.readFileSync(antColonyPath, 'utf8');

// Normalize line endings to \n for replacement, then write back
antColonyContent = antColonyContent.replace(/\r\n/g, '\n');

const targetInAntColony = `        // Arrived at stockpile with excavated mud -> Deposit
        this.stockpile.deposit(1);
        ant.carriedResource = null;
        ant.mudPayload = 0;
        ant.state = 'IDLE';
      }
    } else {
      ant.state = 'IDLE';
    }`;

const replacementInAntColony = `        // Arrived at stockpile with excavated mud -> Deposit
        this.stockpile.deposit(1);
        ant.carriedResource = null;
        ant.mudPayload = 0;
        ant.state = 'IDLE';
      }
    } else if (ant.state === 'SEEKING_FOOD') {
      // Arrived at honeydew cache -> Start eating
      ant.state = 'EATING';
      ant.jobTimer = 0;
    } else {
      ant.state = 'IDLE';
    }`;

if (antColonyContent.includes(targetInAntColony)) {
  antColonyContent = antColonyContent.replace(targetInAntColony, replacementInAntColony);
  fs.writeFileSync(antColonyPath, antColonyContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log('[PATCH] AntColony.ts successfully patched with SEEKING_FOOD destination reached handling.');
} else {
  console.warn('[PATCH] Target not found in AntColony.ts');
}

// 2. Patch GameStateManager.ts
const gsmPath = path.resolve(__dirname, '../src/simulation/GameStateManager.ts');
let gsmContent = fs.readFileSync(gsmPath, 'utf8').replace(/\r\n/g, '\n');

const targetInGSM = `      // 4. Restore ants safely
      colony.ants = [];
      for (const a of parsed.colony.ants) {
        colony.ants.push({
          id: a.id,
          type: a.type,
          position: { x: a.x, y: a.y },
          targetPos: null,
          angle: a.angle,
          speed: colony.speciesStats.moveSpeedPx,
          state: a.state as any,
          path: [],
          pathIndex: 0,
          energy: a.energy,
          carriedResource: a.carriedResource as any,
          walkCycle: 0,
          currentJobId: a.currentJobId,
          jobTimer: a.jobTimer,
          jobDuration: a.jobDuration,
          targetJobCell: a.targetJobCell,
          mudPayload: a.mudPayload,
        });
      }`;

const replacementInGSM = `      // 4. Restore ants safely
      colony.ants = [];
      for (const a of parsed.colony.ants) {
        const restoredAnt: any = {
          id: a.id,
          type: a.type,
          position: { x: a.x, y: a.y },
          targetPos: null,
          angle: a.angle,
          speed: colony.speciesStats.moveSpeedPx,
          state: a.state as any,
          path: [],
          pathIndex: 0,
          energy: a.energy,
          carriedResource: a.carriedResource as any,
          walkCycle: 0,
          currentJobId: a.currentJobId,
          jobTimer: a.jobTimer,
          jobDuration: a.jobDuration,
          targetJobCell: a.targetJobCell,
          mudPayload: a.mudPayload,
        };

        // Resume in-flight navigation if path was interrupted
        const antCell = colony.worldToCell(restoredAnt.position);
        if (restoredAnt.state === 'HAULING_MUD') {
          if (restoredAnt.targetJobCell && restoredAnt.currentJobId) {
            // Hauling mud to backfill site
            const adj = colony.pathfinder.findWalkableAdjacent(restoredAnt.targetJobCell, antCell);
            if (adj) {
              const path = colony.pathfinder.findPath(antCell, adj);
              if (path) {
                restoredAnt.path = path;
                restoredAnt.pathIndex = 0;
              }
            }
          } else {
            // Hauling excavated mud back to stockpile
            const returnPath = colony.pathfinder.findPath(antCell, stockpile.pickupWaypoint);
            if (returnPath) {
              restoredAnt.path = returnPath;
              restoredAnt.pathIndex = 0;
            }
          }
        } else if (restoredAnt.state === 'MOVING_TO_JOB' && restoredAnt.targetJobCell) {
          const adj = colony.pathfinder.findWalkableAdjacent(restoredAnt.targetJobCell, antCell);
          if (adj) {
            const path = colony.pathfinder.findPath(antCell, adj);
            if (path) {
              restoredAnt.path = path;
              restoredAnt.pathIndex = 0;
            }
          }
        } else if (restoredAnt.state === 'MOVING_TO_STOCKPILE') {
          const path = colony.pathfinder.findPath(antCell, stockpile.pickupWaypoint);
          if (path) {
            restoredAnt.path = path;
            restoredAnt.pathIndex = 0;
          }
        } else if (restoredAnt.state === 'SEEKING_FOOD') {
          const path = colony.pathfinder.findPath(antCell, honeydewSource.cell);
          if (path) {
            restoredAnt.path = path;
            restoredAnt.pathIndex = 0;
          }
        }

        colony.ants.push(restoredAnt);
      }`;

if (gsmContent.includes(targetInGSM)) {
  gsmContent = gsmContent.replace(targetInGSM, replacementInGSM);
  fs.writeFileSync(gsmPath, gsmContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log('[PATCH] GameStateManager.ts successfully patched with path reconstruction upon load.');
} else {
  console.warn('[PATCH] Target not found in GameStateManager.ts');
}
