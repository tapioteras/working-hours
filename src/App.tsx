import React, {useEffect, useState} from 'react';
import moment from "moment-timezone";
import { ChakraProvider, Input, Heading, Flex, Button, HStack, Box } from '@chakra-ui/react';
import {Moment} from "moment";

interface QuarterWithReach {
  round: number
  reach: number
}

const quarters: number[] = [0, 15, 30, 45]
const byReach = (minutes: number, round: number): QuarterWithReach => ({round, reach: Math.abs(minutes - round)})
const byNearestReach = (a: QuarterWithReach, b: QuarterWithReach) => (a.reach > b.reach) ? 1 : -1

const getNearestQuarterTimeByMinutes = (
  hours = moment().hours(),
  minutes: number = moment().minutes()
): String =>
  `${hours}:${quarters
    .map(round => byReach(minutes, round))
    .sort(byNearestReach)
    [0].round}`;

interface TimeTableCell {
  id: number,
  hour: number
  minute: number
}

interface TimeTableRow {
  id: number
  startMoment : Moment,
  startTime: TimeTableCell
  endTime?: TimeTableCell
}

function App() {
  const [currentTimeQuarter, setCurrentTimeQuarter] = useState(getNearestQuarterTimeByMinutes())
  const [currentTimeMoment, setCurrentTimeMoment] = useState(moment())
  const [timeTable, setTimeTable] = useState([])
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeQuarter(getNearestQuarterTimeByMinutes())
      setCurrentTimeMoment(moment())
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <ChakraProvider>
      <Heading padding={15} size="4xl">{currentTimeMoment.format("HH:mm")}</Heading>
      <Flex width={200} paddingLeft={15} flexDirection="row">
        <Input disabled value={currentTimeQuarter} marginRight={15} />
        <Button onClick={() => setTimeTable([
          ...timeTable, {
            startTime: currentTimeQuarter
            startMoment: currentTimeMoment,
          } as TimeTableRow
        ])}>+</Button>
      </Flex>
      {timeTable.map(({ startTime, startMoment, endTime }) => (
        <HStack paddingTop={15} paddingLeft={15} spacing="24px">
          <Box>
        {startTime}
          </Box>
          <Box>
            -
          </Box>
          <Box>
        {endTime || `${getNearestQuarterTimeByMinutes()} (${moment.utc(moment().diff(startMoment)).format("HH:mm:ss")})`}
          </Box>
        </HStack>
      ))}
    </ChakraProvider>
  );
}

export default App;