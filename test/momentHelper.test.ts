import { getNearestQuarterMoment } from "../src/momentHelper"
import moment  from "moment"

describe("moment helpers", () => {
  describe("nearest quarter", () => {
    it("should automatically pick the nearest quarter hour", () => {
      expectQuarter(10, 0, "10:00")
      expectQuarter(1, 0, "01:00")
      expectQuarter(23, 59, "00:00")
      expectQuarter(10, 20, "10:15")
      expectQuarter(10, 5, "10:00")
      expectQuarter(12, 1, "12:00")
      expectQuarter(12, 36, "12:30")
      expectQuarter(12, 40, "12:45")
      expectQuarter(12, 55, "13:00")
    })
  })
});

const expectQuarter = (hours: number, minutes: number, expectedResult: string) => expect(
  getNearestQuarterMoment(moment(`${hours}:${minutes}`, "HH:mm"))
  .format("HH:mm"))
  .toEqual(expectedResult);