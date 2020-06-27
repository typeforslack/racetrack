const redis = require("../redisHelper");
const { promisify } = require("util");
const redisMock = require("redis-mock");

const r = redisMock.createClient();

afterEach(() => {
  r.flushall();
});

describe("Tests Basic Redis Functions", () => {
  it("get -> should get redis value", async () => {
    await redis.set("name", "sanjay");
    await expect(redis.get("name")).resolves.toBe("sanjay");
  });

  it("set -> should set redis value", async () => {
    await redis.set("hello", "world");
    r.get("hello", (err, value) => {
      expect(value).toBe("world");
    });
  });

  it("getRoom -> should get room", async () => {
    await redis.set("room-abcdef", "testtest");
    await expect(redis.getRoom("abcdef")).resolves.toBe("testtest");
  });

  it("getParasTyped -> gets the paraId typed by the user", async () => {
    await redis.set("userOne-paras", "[1,2,3]");
    await expect(redis.getParasTyped("userOne")).resolves.toBe("[1,2,3]");
  });

  it("getParasTypedByTheseUsers -> gets the userkey", async () => {
    await redis.set("userOne-paras", "[1,2,3,5]");
    await redis.set("userTwo-paras", "[4,5]");
    await expect(
      redis.getParasTypedByTheseUsers(["userOne", "userTwo"])
    ).resolves.toEqual([1, 2, 3, 5, 4]);
  });

  it("setParaTypedByTheseUsers -> update the users value by adding the recently typed para_id", async () => {
    await redis.set("userOne-paras", "[1,2,3,5]");
    await redis.set("userTwo-paras", "[4,5]");
    await redis.setParaTypedByTheseUsers(["userOne", "userTwo"], 6);
    await expect(redis.getParasTyped("userOne")).resolves.toBe("[1,2,3,5,6]");
    await expect(redis.getParasTyped("userTwo")).resolves.toBe("[4,5,6]");
  });
});
