import React, {useEffect, useState} from 'react';
import { ChakraProvider, Input, Heading, Flex, Button, HStack, Box, Progress } from '@chakra-ui/react';
import {getNearestQuarterMoment} from "./momentHelper";
import moment from "moment";
import useInterval from "@use-it/interval";

const format = "HH:mm:ss"
const formatInput = "HH:mm"

const colors = {
  primary: "#c8ffbd",
  secondary: "#518746",
  third: "white",
  fourth: "white"
}

const buttonStyle = {
  bg: colors.secondary, color: "white"
}

const padding = 4

const WorkingPeriod = ({id, start, stop}) => <HStack>
  <Box borderRadius={4} bg={colors.fourth} p={padding}>{start?.format(format)}</Box>
  <Box>{" - "}</Box>
  <Box borderRadius={4} bg={colors.fourth} p={padding}>{stop && stop?.format(format)}</Box>
  <Box>{" = "}</Box>
  <Box borderRadius={4} bg={colors.fourth} p={padding}>{stop && moment.duration(stop.diff(start)).humanize()} {stop && `(${moment.utc(stop.diff(start))?.format(format)})`}</Box></HStack>

const ManualInput = ({start: initialStart, stop: initialStop, onAdd, addText = "+", isDisabled = false}) => {
  const [start, setStart] = useState(initialStart || "")
  const [stop, setStop] = useState(initialStop || "")
  return (<HStack bg={colors.primary} padding={padding} spacing={padding} direction="row">
    <Heading size={"m"}>manual input</Heading>
    <Input margin={2} border="white" bg={"white"} width={40} placeholder={`start ${formatInput}`} start="start" value={start} onChange={(e) => setStart(e.target.value)}/>
    <Input margin={2} border="white" bg={"white"} width={40} placeholder={`stop ${formatInput}`} name="stop" onChange={(e) => setStop(e.target.value)} value={stop} />
    <Button margin={2} disabled={isDisabled} {...buttonStyle} onClick={() => {
      onAdd(start, stop)
      setStart("")
      setStop("")
    }}>{addText}</Button>
    <Button margin={2} disabled={isDisabled} {...buttonStyle} onClick={() => {
      setStart("")
      setStop("")
    }}>x</Button>
  </HStack>)
}

const WorkingPeriodWithControls = ({start, stop, id, onRemove, onEdit, isDisabled = false}) => {
  const [isEdit, setIsEdit] = useState(false)
  return (
    <HStack bg={colors.primary} p={padding}>
      {isEdit
        ? <ManualInput
          isDisabled={isDisabled}
          addText="save"
          start={start?.format(formatInput)}
          stop={stop?.format(formatInput)}
          onAdd={(newStart, newStop) => {
            const newStartDuration = moment(newStart, formatInput)
            const newStopDuration = moment(newStop, formatInput)
            onEdit(newStartDuration, newStopDuration)
            setIsEdit(false)
          }}
        />
        : <WorkingPeriod {...{start, stop, id}} />}
      <Button disabled={isDisabled} {...buttonStyle} onClick={() => {
        if (!isEdit) {
          setIsEdit(true)
        } else {
          setIsEdit(false)
        }
      }}>{isEdit ? "cancel" : "edit"}</Button>
      <Button disabled={isDisabled} {...buttonStyle} onClick={onRemove}>-</Button>
    </HStack>
  )
}

const Summary = ({periods, currentPeriod}) => {
  const durations = [...periods, currentPeriod ? {start: currentPeriod, stop: moment()} : null]
    .filter(p => !!p)
    .map(({start, stop}) => stop.diff(start))
    .reduce((a,b) => a + b, 0)
  const fullWorkingDayMillis = moment.duration(7.5, "hours").asMilliseconds()
  const currentDurationMillis = moment.duration(durations).asMilliseconds()
  const percentage = (currentDurationMillis * 100) / fullWorkingDayMillis
    const workLeftMillis = fullWorkingDayMillis - currentDurationMillis
  return (
    <Box p={padding}>
      <Heading paddingBottom={padding}>total: {moment.utc(currentDurationMillis).format(format)}</Heading>
      <Heading size="medium">{moment.utc(workLeftMillis > 0 ? workLeftMillis : 0).format(format)} left from full working day (7.5 hours)</Heading>
      <Box><Progress colorScheme="green" size="lg" value={percentage} /></Box>
    </Box>)
}

const removePeriod = (periods, idToRemove) => {
  return periods.filter((p, i) => i !== idToRemove)
}

const editPeriod = (periods, idToEdit, newStart, newStop) => {
  return [...periods].map((p, i) => i === idToEdit ? {start: newStart, stop: newStop} : p)
}

const LOCAL_STORAGE_KEYS = {
  workingHours: "workingHours",
  currentStartTime: "currentStartTime"
}

const saveHoursToLocalStorage = (hours) => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.workingHours, JSON.stringify(hours))
}

const saveCurrentStartTimeToLocalStorage = (start) => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.currentStartTime, start?.format(format) || "")
}

const getCurrentStartTimeFromLocalStorage = () => {
  const startTime = moment(localStorage.getItem(LOCAL_STORAGE_KEYS.currentStartTime) || "", format)
  return startTime.isValid() ? startTime : null
}

const getHoursFromLocalStorage = () => JSON
  .parse(localStorage.getItem(LOCAL_STORAGE_KEYS.workingHours) || "[]")
  .map(({start, stop}) => ({ start: moment(start), stop: moment(stop)}))

function App() {
  const [workingPeriods, setWorkingPeriods] = useState(getHoursFromLocalStorage())
  const [currentPeriod, setCurrentPeriod] = useState(getCurrentStartTimeFromLocalStorage())
  const [currentMoment, setCurrentMoment] = useState(moment())
  useEffect(() => {
    saveHoursToLocalStorage(workingPeriods)
  }, [workingPeriods])
  useEffect(() => {
      saveCurrentStartTimeToLocalStorage(currentPeriod)
  }, [currentPeriod])

  useInterval(() => {
    setCurrentMoment(moment())
  }, 500)
  return (
    <ChakraProvider>
      <ManualInput isDisabled={!!currentPeriod} onAdd={(start, stop) => {
        const startDuartion = moment(start, formatInput)
        const stopDuration = moment(stop, formatInput)
        if (startDuartion.isValid() && stopDuration.isValid()) {
          setWorkingPeriods([...workingPeriods, {start: startDuartion, stop: stopDuration}])
        }
      }} />
      <Box p={padding}>
      {!currentPeriod && <Button {...buttonStyle} onClick={() => setCurrentPeriod(moment())}>start</Button>}
      {currentPeriod && <Button {...buttonStyle} onClick={() => {
        setWorkingPeriods([...workingPeriods, {start: currentPeriod, stop: moment()}])
        setCurrentPeriod(null)
      }}>stop</Button>}
        {currentPeriod && <HStack p={padding}>current: <WorkingPeriod
          id={workingPeriods.length}
          start={currentPeriod || currentMoment}
          stop={currentPeriod && currentMoment}/>
        </HStack>}
      </Box>
      <Box p={padding}>
        {workingPeriods
          .filter((p) => !!p?.start && !!p?.stop)
          .map((p, i) => <WorkingPeriodWithControls
            isDisabled={!!currentPeriod}
          id={i}
          {...p}
          onEdit={(start, stop) => {
            setWorkingPeriods([...editPeriod(workingPeriods, i, start, stop)])
          }}
          onRemove={() => setWorkingPeriods(removePeriod(workingPeriods, i))}
        />)}
      </Box>
      <Box bg={colors.third}>{<Summary periods={workingPeriods} {...{currentPeriod}} />}</Box>
      <Box p={padding}><Button onClick={() => {
        setCurrentPeriod(null)
        setWorkingPeriods([])
        saveCurrentStartTimeToLocalStorage("")
      }}>Reset</Button></Box>
    </ChakraProvider>
  );
}

export default App;
