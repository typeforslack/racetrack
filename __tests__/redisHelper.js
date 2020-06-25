const redis = require("../redisHelper");
const { promisify } = require("util");
const redisMock = require("redis-mock");
jest.doMock("redis", () => redisMock);

const r = redisMock.createClient();
const _testSet = promisify(r.set).bind(r);

afterEach(() => {
  r.flushall();
});

describe("Tests Basic Redis Functions", () => {
  it("get -> should get redis value", async () => {
    await _testSet("name", "sanjay");
    await expect(redis.get("name")).resolves.toBe("sanjay");
  });

  it("set -> should set redis value", async () => {
    await redis.set("hello", "world");
    r.get("hello", (err, value) => {
      expect(value).toBe("world");
    });
  });

  it("getRoom -> should get room", async () => {
    await _testSet("room-abcdef", "testtest");
    await expect(redis.getRoom("abcdef")).resolves.toBe("testtest");
  });
});
