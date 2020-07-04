const { getTypingPara } = require("../helper");
const axios = require("axios");
const constants = require("../constants");

jest.mock("axios");

describe("Test getTypingPara", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("calls axios with the right params", async () => {
    axios.get.mockResolvedValue({
      status: 200,
      body: "[]",
    });

    await getTypingPara([1, 2, 3]);
    expect(axios.get.mock.calls.length).toBe(1);
    expect(axios.get.mock.calls[0][0]).toBe(constants.TFSBackendURL);
    expect(axios.get.mock.calls[0][1]).toStrictEqual({
      params: {
        data: "[1,2,3]",
      },
    });
  });

  it("returns a promise which resolves to value", async () => {
    const body = {
      name: "hello",
    };

    const resp = {
      jsonBody: body,
      usernames: ["userOne", "userTwo"],
    };

    axios.get.mockResolvedValue({
      status: 200,
      data: body,
    });

    await expect(
      getTypingPara([1, 2, 3], ["userOne", "userTwo"])
    ).resolves.toStrictEqual(resp);
  });

  it("returns rejection to when err happens", async () => {
    axios.get.mockRejectedValue(new Error("Dummy Error"));

    await expect(getTypingPara([1, 2, 3])).rejects.toThrow("Dummy Error");
  });
});
