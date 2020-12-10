import moment from "moment"

export const getNearestQuarterMoment = (currentMoment = moment()): moment.Moment => {
  if([0,15,30,45].includes(currentMoment.minutes())) {
    return currentMoment
  }
  const reaches = [[0, 15], [15, 30], [30, 45], [45, 60]]
    .map(([a, b]) => ({ a, b, reachA: Math.abs(currentMoment.minutes() - a), reachB: Math.abs(currentMoment.minutes() - b) }))
    .sort((a, b) => a.reachA > b.reachA || b.reachB > b.reachB ? 1 : -1)
  const { reachA, reachB, a , b } = reaches[0]
  if (reachA < reachB) {
    if (currentMoment.minutes() < a) {
      return currentMoment.add(reachA, "minutes")
    } else {
      return currentMoment.subtract(reachA, "minutes")
    }
  } else {
    return currentMoment.add(reachB, "minutes")
  }
}