import React, {useEffect, useState} from 'react';
import moment from "moment-timezone";
import { ChakraProvider, Input, Heading, Flex, Button, HStack, Box } from '@chakra-ui/react';
import * as rawMoment from "moment";

interface TimePrintLayout {
  hours: string
  minutes: string
  format: string
  formatWithSeconds: string
}

interface NearestQuarterTime {
  hours: any
  round: number
  reach: number
  minutes: number
  printLayout: string
}

const getTimePrintLayout = (): TimePrintLayout => {
  const hours = "HH";
  const minutes = "mm";
  const seconds = "ss"
  const format = `${hours}:${minutes}`;
  const formatWithSeconds = `${hours}:${minutes}:${seconds}`
  return { hours, minutes, format, formatWithSeconds };
};

interface QuarterWithReach {
  round: number
  reach: number
}

interface QuarterWithPrintLayout {
  quarter: number
  printLayout: string
}

const quarters: QuarterWithPrintLayout[] = [
  {quarter: 0, printLayout: "00"},
  {quarter: 15, printLayout: "15"},
  {quarter: 30, printLayout: "30"},
  {quarter: 45, printLayout: "45"},
  {quarter: 60, printLayout: "00"}
]
const byReach = (minutes: number, round: number): QuarterWithReach => ({round, reach: Math.abs(minutes - round)})
const byNearestReach = (a: QuarterWithReach, b: QuarterWithReach) => (a.reach > b.reach) ? 1 : -1

const getNearestQuarterTimeByMinutes = (
  returnObject = false,
  hours = moment().format(getTimePrintLayout().hours),
  minutes: number = moment().minutes(),
): NearestQuarterTime | string => {
  const quarterTimeObject = quarters
    .map(({quarter, ...rest}) => ({...byReach(minutes, quarter), ...rest, hours, minutes}))
    .sort(byNearestReach)
    [0]
  return returnObject ? quarterTimeObject : `${hours}:${quarterTimeObject.printLayout}`;
}

interface TimeTableCell {
  id: number,
  hour: number
  minute: number
}

interface TimeTableRow {
  id: number
  actualStartTime: rawMoment.Moment,
  startMoment : rawMoment.Moment,
  startTime: TimeTableCell
  endTime?: TimeTableCell
}

function App() {
  const [currentTimeQuarter, setCurrentTimeQuarter] = useState(getNearestQuarterTimeByMinutes())
  const [currentTimeMoment, setCurrentTimeMoment] = useState(moment())
  const [timeTable, setTimeTable] = useState([])
  const [currentTracker, setCurrentTracker] = useState(null)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeQuarter(getNearestQuarterTimeByMinutes())
      setCurrentTimeMoment(moment())
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <ChakraProvider>
      <Heading padding={15} size="4xl">{currentTimeMoment.format(getTimePrintLayout().format)}</Heading>
      <Flex width={200} paddingLeft={15} flexDirection="row">
        <Input disabled value={currentTimeQuarter.toString()} marginRight={15} />
        <Button onClick={() => {
          const quarterTime: NearestQuarterTime = getNearestQuarterTimeByMinutes(true) as NearestQuarterTime
          if (currentTracker) {
            setTimeTable([
              // @ts-ignore
              ...timeTable, {
                ...currentTracker,
                endTime: {
                  id: [...timeTable].length + 1,
                  hours: quarterTime.hours,
                  minutes: quarterTime.minutes
                }
              }
            ])
            setCurrentTracker(null)
          } else {
            // @ts-ignore
            setCurrentTracker({
              actualStartTime: moment().format(getTimePrintLayout().format)
              startTime: currentTimeQuarter,
              startMoment: currentTimeMoment,
            } as TimeTableRow)
          }
        }}>{currentTracker ? "stop" : "start"}</Button>
      </Flex>
      {currentTracker && <Box padding={15}>{currentTracker.startTime}-{`${getNearestQuarterTimeByMinutes()} (${moment.utc(moment().diff(currentTracker.startMoment)).format(getTimePrintLayout().formatWithSeconds)})`}</Box>}
      {timeTable.map(({ startTime, startMoment, endTime }, i) => (
        <HStack key={`timetable-row-${i}`} paddingTop={15} paddingLeft={15} spacing="24px">
          <Box>
            {startTime} - {`${getNearestQuarterTimeByMinutes(false, endTime.hours, endTime.minutes)} (${endTime.hours}:${endTime.minutes})`}
          </Box>
        </HStack>
      ))}
    </ChakraProvider>
  );
}

export default App;
