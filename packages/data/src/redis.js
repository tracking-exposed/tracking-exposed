// @flow
import Redis from "ioredis";

export type RedisClient = Redis;

export type StreamEvent = {
  stream: string,
  id: string,
  impressionId: string,
  [string]: string,
};

export const fromEvent = (event: string[]): {[string]: string} =>
  event
    .reduce((acc, arg, i) => {
      const chunk = Math.floor(i / 2);
      const tuple = acc[chunk] || [];
      // eslint-disable-next-line no-param-reassign
      acc[chunk] = tuple.concat(arg);
      return acc;
    }, [])
    .reduce((acc, [key, value]) => Object.assign(acc, {[key]: value}), {});

export const toEvent = (obj: {[string]: mixed}): Array<mixed> =>
  Object.keys(obj).reduce((memo, key) => memo.concat([key, obj[key]]), []);

export const client = (host: string, port: number): RedisClient => {
  // $FlowFixMe
  const {string: xadd} = Redis.prototype.createBuiltinCommand("xadd");
  // $FlowFixMe
  const {string: xread} = Redis.prototype.createBuiltinCommand("xread");
  // $FlowFixMe
  Redis.prototype.xadd = xadd;
  // $FlowFixMe
  Redis.prototype.xread = xread;
  return new Redis({host, port, lazyConnect: true});
};

export const publishToStream = (
  redisClient: RedisClient,
  stream: string,
  data: {},
) => {
  const args = toEvent(data);
  // $FlowFixMe
  return redisClient.xadd(stream, "*", ...args);
};

export const pollFromStream = async (
  redisClient: RedisClient,
  stream: string,
  lastId: string,
): Promise<StreamEvent[]> => {
  // $FlowFixMe
  const data = await redisClient.xread("BLOCK", "0", "STREAMS", stream, lastId);

  return data.reduce(
    (memo, [, events]) =>
      memo.concat(
        events.map(([id, eventData]) => {
          const eventObj = fromEvent(eventData);
          return {stream, id, ...eventObj};
        }),
      ),
    [],
  );
};

export default {
  client,
  publishToStream,
  pollFromStream,
};