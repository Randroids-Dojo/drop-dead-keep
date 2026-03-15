// Drop Dead Keep — Level Definitions (World 1: The Foothills)

import { BridgeType } from '../physics/bridge.js';
import { ZombieType } from '../entities/zombie.js';

export const LEVELS = {
  '1-1': {
    name: 'First Stand',
    world: 1,
    gateHp: 150, // Generous for tutorial
    treeCount: 6,
    spawnPoint: { x: 400, y: 50 },
    gatePoint: { x: 400, y: 680 },
    bridges: [
      { x: 400, y: 300, width: 100, type: BridgeType.ROPE },
    ],
    waypoints: [
      { x: 400, y: 120 },
      { x: 400, y: 280, bridgeIndex: 0 },
      { x: 400, y: 320 },
      { x: 400, y: 500 },
    ],
    ammo: { boulder: 15, fireball: 0, ice_bomb: 0, mega_bomb: 0 },
    waves: [
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 3, startDelay: 1, stagger: 1.5 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 3, stagger: 1 },
        ],
        spawnInterval: 1.5,
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 3, startDelay: 0, stagger: 1.2 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 2, stagger: 1 },
        ],
        spawnInterval: 1.2,
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 5, startDelay: 0, stagger: 1.0 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 3, stagger: 1 },
        ],
        spawnInterval: 1.0,
      },
    ],
    tutorial: {
      steps: [
        { trigger: 'start', message: 'Tap on a boulder to pick it up!', highlight: 'ammo' },
        { trigger: 'ammo_selected', message: 'Drag back from the catapult to aim!', highlight: 'catapult' },
        { trigger: 'first_fire', message: 'Nicely done! The bridge is destroyed!', duration: 2 },
        { trigger: 'first_fire_2', message: 'Tap on a boulder to fire again!', highlight: 'ammo' },
        { trigger: 'wave_2', message: "Don't let the zombies reach your gate!" },
      ],
    },
  },

  '1-2': {
    name: 'Crossroads',
    world: 1,
    gateHp: 120,
    treeCount: 8,
    spawnPoint: { x: 400, y: 50 },
    gatePoint: { x: 400, y: 680 },
    bridges: [
      { x: 350, y: 220, width: 90, type: BridgeType.ROPE },
      { x: 450, y: 440, width: 100, type: BridgeType.ROPE },
    ],
    waypoints: [
      { x: 400, y: 120 },
      { x: 350, y: 200, bridgeIndex: 0 },
      { x: 350, y: 240 },
      { x: 400, y: 340 },
      { x: 450, y: 420, bridgeIndex: 1 },
      { x: 450, y: 460 },
      { x: 400, y: 560 },
    ],
    ammo: { boulder: 15, fireball: 0, ice_bomb: 0, mega_bomb: 0 },
    waves: [
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 4, startDelay: 0, stagger: 1.2 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 3, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 6, startDelay: 0, stagger: 1.0 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 4, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 8, startDelay: 0, stagger: 0.8 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 4, stagger: 1 },
        ],
      },
    ],
    tutorial: {
      steps: [
        { trigger: 'start', message: 'You now have two bridges to defend!', duration: 3 },
        { trigger: 'start_delayed', message: 'Try to destroy the farther bridge first!', duration: 3 },
      ],
    },
  },

  '1-3': {
    name: 'Quick Dead',
    world: 1,
    gateHp: 100,
    treeCount: 10,
    spawnPoint: { x: 400, y: 50 },
    gatePoint: { x: 400, y: 680 },
    bridges: [
      { x: 350, y: 200, width: 70, type: BridgeType.ROPE }, // small gap, sprinters can jump
      { x: 450, y: 400, width: 110, type: BridgeType.WOODEN },
    ],
    waypoints: [
      { x: 400, y: 110 },
      { x: 350, y: 180, bridgeIndex: 0 },
      { x: 350, y: 220 },
      { x: 400, y: 310 },
      { x: 450, y: 380, bridgeIndex: 1 },
      { x: 450, y: 420 },
      { x: 400, y: 550 },
    ],
    ammo: { boulder: 15, fireball: 0, ice_bomb: 0, mega_bomb: 0 },
    waves: [
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 4, startDelay: 0, stagger: 1.5 },
          { type: ZombieType.SPRINTER, count: 1, startDelay: 4, stagger: 2 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 3, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 4, startDelay: 0, stagger: 1.0 },
          { type: ZombieType.SPRINTER, count: 2, startDelay: 3, stagger: 1.5 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 5, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 5, startDelay: 0, stagger: 0.8 },
          { type: ZombieType.SPRINTER, count: 3, startDelay: 2, stagger: 1.0 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 4, stagger: 1 },
        ],
      },
    ],
  },

  '1-4': {
    name: 'The Rebuilders',
    world: 1,
    gateHp: 100,
    treeCount: 10,
    spawnPoint: { x: 400, y: 50 },
    gatePoint: { x: 400, y: 680 },
    bridges: [
      { x: 350, y: 200, width: 90, type: BridgeType.ROPE },
      { x: 450, y: 420, width: 110, type: BridgeType.WOODEN },
    ],
    waypoints: [
      { x: 400, y: 110 },
      { x: 350, y: 180, bridgeIndex: 0 },
      { x: 350, y: 220 },
      { x: 400, y: 310 },
      { x: 450, y: 400, bridgeIndex: 1 },
      { x: 450, y: 440 },
      { x: 400, y: 550 },
    ],
    ammo: { boulder: 18, fireball: 0, ice_bomb: 0, mega_bomb: 0 },
    waves: [
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 4, startDelay: 0, stagger: 1.2 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 3, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 4, startDelay: 0, stagger: 1.0 },
          { type: ZombieType.ENGINEER, count: 1, startDelay: 3, stagger: 2 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 4, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 6, startDelay: 0, stagger: 0.8 },
          { type: ZombieType.ENGINEER, count: 2, startDelay: 2, stagger: 3 },
          { type: ZombieType.SPRINTER, count: 2, startDelay: 5, stagger: 1.5 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 6, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 8, startDelay: 0, stagger: 0.7 },
          { type: ZombieType.ENGINEER, count: 2, startDelay: 3, stagger: 2 },
          { type: ZombieType.SPRINTER, count: 3, startDelay: 4, stagger: 1.0 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 6, stagger: 1 },
        ],
      },
    ],
  },

  '1-5': {
    name: 'Foothills Finale',
    world: 1,
    gateHp: 100,
    treeCount: 12,
    spawnPoint: { x: 400, y: 50 },
    gatePoint: { x: 400, y: 680 },
    bridges: [
      { x: 320, y: 180, width: 80, type: BridgeType.ROPE },
      { x: 480, y: 320, width: 100, type: BridgeType.WOODEN },
      { x: 380, y: 480, width: 110, type: BridgeType.WOODEN },
    ],
    waypoints: [
      { x: 380, y: 100 },
      { x: 320, y: 160, bridgeIndex: 0 },
      { x: 320, y: 200 },
      { x: 400, y: 260 },
      { x: 480, y: 300, bridgeIndex: 1 },
      { x: 480, y: 340 },
      { x: 420, y: 420 },
      { x: 380, y: 460, bridgeIndex: 2 },
      { x: 380, y: 500 },
      { x: 400, y: 580 },
    ],
    ammo: { boulder: 20, fireball: 0, ice_bomb: 0, mega_bomb: 0 },
    waves: [
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 5, startDelay: 0, stagger: 1.0 },
          { type: ZombieType.SPRINTER, count: 2, startDelay: 3, stagger: 1.5 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 4, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 6, startDelay: 0, stagger: 0.8 },
          { type: ZombieType.ENGINEER, count: 2, startDelay: 2, stagger: 3 },
          { type: ZombieType.SPRINTER, count: 2, startDelay: 5, stagger: 1 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 6, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 6, startDelay: 0, stagger: 0.8 },
          { type: ZombieType.PLANK_CARRIER, count: 2, startDelay: 2, stagger: 3 },
          { type: ZombieType.ENGINEER, count: 2, startDelay: 4, stagger: 2 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 5, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 8, startDelay: 0, stagger: 0.7 },
          { type: ZombieType.SPRINTER, count: 3, startDelay: 2, stagger: 1.0 },
          { type: ZombieType.ENGINEER, count: 2, startDelay: 4, stagger: 2 },
          { type: ZombieType.PLANK_CARRIER, count: 2, startDelay: 6, stagger: 2 },
          { type: ZombieType.BRUTE, count: 1, startDelay: 7, stagger: 1 },
        ],
      },
      {
        groups: [
          { type: ZombieType.SHAMBLER, count: 10, startDelay: 0, stagger: 0.6 },
          { type: ZombieType.SPRINTER, count: 4, startDelay: 1, stagger: 0.8 },
          { type: ZombieType.ENGINEER, count: 3, startDelay: 3, stagger: 2 },
          { type: ZombieType.PLANK_CARRIER, count: 2, startDelay: 5, stagger: 2 },
          { type: ZombieType.BRUTE, count: 2, startDelay: 8, stagger: 2 },
        ],
      },
    ],
  },
};
