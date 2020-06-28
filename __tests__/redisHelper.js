const redis = require("../redisHelper");
const redisMock = require("redis-mock");
const axios = require("axios");

jest.mock("axios");

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

  it("sendPara -> returns a axios response with paragraph details", async () => {
    const body = { paraid: "[1]", paragraph: "Awesome !", taken_from: "Green" };
    await redis.set(
      "room-one",
      JSON.stringify({
        timestamp: 1314314,
        users: [{ name: "userUno", socketId: "alskfhskladj" }],
      })
    );
    await redis.set("userUno-paras", "[1]");
    axios.get.mockResolvedValue({
      status: 200,
      body: JSON.stringify(body),
    });
    await expect(redis.sendPara("room-one")).resolves.toStrictEqual(body);
    await expect(axios.get.mock.calls[0][1]).toStrictEqual({
      params: {
        data: "[1]",
      },
    });
  });
});
