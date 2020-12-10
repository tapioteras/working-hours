import React, {useEffect, useState} from 'react';
import { ChakraProvider, Input, Heading, Flex, Button, HStack, VStack, Box } from '@chakra-ui/react';
import {getNearestQuarterMoment} from "./momentHelper";
import moment from "moment";
import useInterval from "@use-it/interval";

interface Measurement {
  start: moment.Moment
  stop: moment.Moment
}

function App() {
  const [startMoment, setStartMoment] = useState()
  const [currentMoment, setCurrentMoment] = useState(moment())
  const [measurements, setMeasurements] = useState([])
  useInterval(() => {
      setCurrentMoment(moment())
  }, 100);
  const diff = (start: moment.Moment, stop: moment.Moment) => moment.utc(stop.diff(start))
  const toMeasurementRow = (start: moment.Moment, stop: moment.Moment) => <>
    {start.format("HH:mm")} - {stop.format("HH:mm")} = {
    diff(start, stop).format("HH:mm")}
    ({getNearestQuarterMoment(start).format("HH:mm")} - {getNearestQuarterMoment(stop).format("HH:mm")} = {getNearestQuarterMoment(diff(start, stop)).format("HH:mm")})
  </>
  const measurementsAsMilliseconds = () => [...measurements]
    .map(({start, stop}) => diff(start, stop))
    .map(duration => duration.milliseconds())
  const onStart = () => {
    setStartMoment(moment())
  }
  const onStop = () => {
    setMeasurements([...measurements, { start: startMoment, stop: moment() } as Measurement])
    setStartMoment(undefined)
  }
  const totalTime = moment.utc(measurementsAsMilliseconds().reduce((a,b) => a + b, 0)).format("HH:mm")
  return (
    <ChakraProvider>
      <Heading size="1xl">{currentMoment.format("HH:mm")}</Heading>
      <Button disabled={!!startMoment} onClick={onStart}>start</Button>
      {startMoment && <>
          <Button onClick={onStop}>stop</Button>
          <VStack>
        {startMoment && <Box backgroundColor="green" spacing={10}>{toMeasurementRow(startMoment, moment())}</Box>}
      </VStack>
      </>}
      <VStack>{measurements.reverse().map(({start, stop}, i) =>
        <Box spacing={5} key={`measurement-row-${i}`}>
          {toMeasurementRow(start, stop)}
        </Box>)}</VStack>
      <Box>total: {totalTime}</Box>
    </ChakraProvider>
  );
}

export default App;
