import test from "ava";
import Chance from "chance";
import {MongoClient} from "mongodb";
import MongodbMemoryServer from "mongodb-memory-server";

import {fetch, store} from "../src/impressions";
import impressions from "./fixtures/impressions";

const chance = new Chance();

// eslint-disable-next-line no-param-reassign, no-return-assign
test.before((t) => (t.context.mongod = new MongodbMemoryServer()));

test.after.always((t) => t.context.mongod.stop());

test.beforeEach(async (t) => {
  const mongoUri = await t.context.mongod.getConnectionString();
  const mongo = await MongoClient.connect(mongoUri);
  return mongo
    .db()
    .collection("impressions")
    .insert(impressions.map((o) => Object.assign({}, o)));
});

test.afterEach.always(async (t) => {
  const mongoUri = await t.context.mongod.getConnectionString();
  const mongo = await MongoClient.connect(mongoUri);
  return mongo.db().dropCollection("impressions");
});

test.serial("impressions fetch retrieves a single impression", async (t) => {
  const mongoUri = await t.context.mongod.getConnectionString();
  const mongo = await MongoClient.connect(mongoUri);
  const expected = impressions[0];
  const {_id, ...result} = await fetch(mongo, expected.id);
  t.deepEqual(result, expected);
});

test.serial(
  "impressions fetch retrieving a non existing impression returns null",
  async (t) => {
    const mongoUri = await t.context.mongod.getConnectionString();
    const mongo = await MongoClient.connect(mongoUri);
    const impression = await fetch(mongo, "non-existing");
    t.true(impression == null);
  },
);

test.serial("impressions store creates a new impression", async (t) => {
  const impression = {id: chance.guid(), timelineId: chance.guid()};
  const mongoUri = await t.context.mongod.getConnectionString();
  const mongo = await MongoClient.connect(mongoUri);

  await store(mongo, impression);

  const {_id, ...expected} = await mongo
    .db()
    .collection("impressions")
    .findOne({id: impression.id});

  t.deepEqual(expected, impression);
});

test.serial("impressions store updates an existing impression", async (t) => {
  const impression = {id: chance.guid(), timelineId: chance.guid()};
  const mongoUri = await t.context.mongod.getConnectionString();
  const mongo = await MongoClient.connect(mongoUri);
  await mongo
    .db()
    .collection("impressions")
    .insertOne(impression);
  impression.timelineId = chance.guid();

  await store(mongo, impression);

  const {_id, ...expected} = impression;
  const {_id: _id2, ...result} = await mongo
    .db()
    .collection("impressions")
    .findOne({id: impression.id});

  t.deepEqual(result, expected);
});