const { generateNewHash } = require("../helper");

describe("Test generateNewHash", () => {
  it("returns a string", () => {
    expect(generateNewHash()).toBeTruthy();
  });
});
