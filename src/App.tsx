import React, {useState} from 'react';
import { ChakraProvider, Input, Heading, Flex, Button, HStack, VStack, Box } from '@chakra-ui/react';
import {getNearestQuarterMoment} from "./momentHelper";
import moment from "moment";
import useInterval from "@use-it/interval";

const format = "HH:mm:ss"
const formatInput = "HH:mm"

const WorkingPeriod = ({id, start, stop}) => <Flex>{id}: {
  start?.format(format)} - {
  stop && stop?.format(format)} = {
  stop && moment.duration(stop.diff(start)).humanize()} {stop && `(${moment.utc(stop.diff(start))?.format(format)})`}</Flex>

const ManualInput = ({start: initialStart, stop: initialStop, onAdd, addText = "+"}) => {
  const [start, setStart] = useState(initialStart || "")
  const [stop, setStop] = useState(initialStop || "")
  return (<Flex maxWidth={300}>
    <Input placeholder={`start ${formatInput}`} start="start" value={start} onChange={(e) => setStart(e.target.value)}/>
    <Input placeholder={`stop ${formatInput}`} name="stop" onChange={(e) => setStop(e.target.value)} value={stop} />
    <Button onClick={() => {
      onAdd(start, stop)
      setStart("")
      setStop("")
    }}>{addText}</Button>
  </Flex>)
}

const WorkingPeriodWithControls = ({start, stop, id, onRemove, onEdit}) => {
  const [isEdit, setIsEdit] = useState(false)
  return (
    <Flex>
      {isEdit
        ? <ManualInput
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
      <Button onClick={() => {
        if (!isEdit) {
          setIsEdit(true)
        } else {
          setIsEdit(false)
        }
      }}>{isEdit ? "cancel" : "edit"}</Button>
      <Button onClick={onRemove}>-</Button>
    </Flex>
  )
}

const Summary = ({periods, currentPeriod}) => {
  const durations = [...periods, currentPeriod ? {start: currentPeriod, stop: moment()} : null]
    .filter(p => !!p)
    .map(({start, stop}) => stop.diff(start))
    .reduce((a,b) => a + b, 0)
  return <Box>total: {moment.utc(moment.duration(durations).asMilliseconds()).format(format)}</Box>
}

const removePeriod = (periods, idToRemove) => {
  let newPeriods = periods
  delete newPeriods?.[idToRemove]
  return newPeriods
}

const editPeriod = (periods, idToEdit, newStart, newStop) => {
  return [...periods].map((p, i) => i === idToEdit ? {start: newStart, stop: newStop} : p)
}

function App() {
  const [workingPeriods, setWorkingPeriods] = useState([])
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [currentMoment, setCurrentMoment] = useState(moment())
  useInterval(() => {
    setCurrentMoment(moment())
  }, 500)
  return (
    <ChakraProvider>
      <ManualInput onAdd={(start, stop) => {
        const startDuartion = moment(start, formatInput)
        const stopDuration = moment(stop, formatInput)
        if (startDuartion.isValid() && stopDuration.isValid()) {
          setWorkingPeriods([...workingPeriods, {start: startDuartion, stop: stopDuration}])
        }
      }} />
      {!currentPeriod && <Button onClick={() => setCurrentPeriod(moment())}>start</Button>}
      {currentPeriod && <Button onClick={() => {
        setWorkingPeriods([...workingPeriods, {start: currentPeriod, stop: moment()}])
        setCurrentPeriod(null)
      }}>stop</Button>}
      current: <WorkingPeriod
      id={workingPeriods.length}
      start={currentPeriod || currentMoment}
      stop={currentPeriod && currentMoment} />
      <Box>
        {workingPeriods.filter(({start, stop}) => !!start && !!stop).map((p, i) => <WorkingPeriodWithControls
          id={i}
          {...p}
          onEdit={(start, stop) => {
            setWorkingPeriods([...editPeriod(workingPeriods, i, start, stop)])
          }}
          onRemove={() => setWorkingPeriods(removePeriod(workingPeriods, i))}
        />)}
      </Box>
      <Summary periods={workingPeriods} {...{ currentPeriod }} />
    </ChakraProvider>
  );
}

export default App;
