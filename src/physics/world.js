// Drop Dead Keep — Matter.js World Setup

const { Engine, World, Bodies, Events, Composite } = Matter;

export class PhysicsWorld {
  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: 1.5 },
    });
    this.world = this.engine.world;
    this.bodiesToRemove = [];
    this.collisionCallbacks = [];

    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        for (const cb of this.collisionCallbacks) {
          cb(pair.bodyA, pair.bodyB);
        }
      }
    });
  }

  addBody(body) {
    Composite.add(this.world, body);
  }

  removeBody(body) {
    Composite.remove(this.world, body);
  }

  addConstraint(constraint) {
    Composite.add(this.world, constraint);
  }

  removeConstraint(constraint) {
    Composite.remove(this.world, constraint);
  }

  onCollision(callback) {
    this.collisionCallbacks.push(callback);
  }

  update(dt) {
    Engine.update(this.engine, dt * 1000);
  }

  clear() {
    World.clear(this.world);
    Engine.clear(this.engine);
    this.collisionCallbacks = [];
  }

  reset() {
    this.engine = Engine.create({ gravity: { x: 0, y: 1.5 } });
    this.world = this.engine.world;
    this.collisionCallbacks = [];

    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        for (const cb of this.collisionCallbacks) {
          cb(pair.bodyA, pair.bodyB);
        }
      }
    });
  }
}
