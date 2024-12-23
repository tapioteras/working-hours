import React, { cloneElement, useEffect, useState } from "react";
import {
  Input,
  Heading,
  Button,
  HStack,
  Box,
  ButtonProps,
  Center,
  Flex,
  Separator,
} from "@chakra-ui/react";

import {
  ProgressBar,
  ProgressLabel,
  ProgressRoot,
  ProgressValueText,
} from "./components/ui/progress";
import moment from "moment";
import useInterval from "@use-it/interval/dist/interval.esm.js";
import { Provider } from "./components/ui/provider";

const format = "HH:mm:ss";
const formatInput = "HH:mm";

const colors = {
  primary: "rgb(143, 0, 119)",
  secondary: "rgb(51, 0, 29)",
  third: "#1A1A1A",
  fourth: "#FF00FF",
};

const buttonStyle: ButtonProps = {
  variant: "ghost",
  _hover: { bg: "blackAlpha.300" },
};

const padding = 4;

const WorkingPeriod = ({ id, start, stop, quarter = null }) =>
  quarter ? (
    <HStack>
      <Box borderRadius={4} p={padding}>
        {quarter === "plus" ? "+ 15 min" : "- 15 min"}
      </Box>
    </HStack>
  ) : (
    <HStack>
      <Box borderRadius={4} p={padding}>
        {start?.format(format)}
      </Box>
      <Box>{" - "}</Box>
      <Box borderRadius={4} p={padding}>
        {stop && stop?.format(format)}
      </Box>
      <Box>{" = "}</Box>
      <Box borderRadius={4} p={padding}>
        {stop && moment.duration(stop.diff(start)).humanize()}{" "}
        {stop && `(${moment.utc(stop.diff(start))?.format(format)})`}
      </Box>
    </HStack>
  );

const ManualInput = ({
  start: initialStart,
  stop: initialStop,
  onAdd,
  addText = "Add",
  isDisabled = false,
}) => {
  const [start, setStart] = useState(initialStart || "");
  const [stop, setStop] = useState(initialStop || "");
  return (
    <Box padding={padding} direction="row">
      <Input
        variant="outline"
        margin={2}
        border="white"
        width={40}
        placeholder={`start ${formatInput}`}
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />
      <Input
        margin={2}
        border="white"
        width={40}
        placeholder={`stop ${formatInput}`}
        name="stop"
        onChange={(e) => setStop(e.target.value)}
        value={stop}
      />
      <Button
        margin={2}
        disabled={isDisabled}
        {...buttonStyle}
        onClick={() => {
          onAdd(start, stop);
          setStart("");
          setStop("");
        }}
      >
        {addText}
      </Button>
      <Button
        margin={2}
        disabled={isDisabled}
        {...buttonStyle}
        onClick={() => {
          setStart("");
          setStop("");
        }}
      >
        Remove
      </Button>
    </Box>
  );
};

const WorkingPeriodWithControls = ({
  start,
  stop,
  id,
  quarter,
  onRemove,
  onEdit,
  isDisabled = false,
}) => {
  const [isEdit, setIsEdit] = useState(false);
  return (
    <Flex direction="column">
      <HStack>
        <Box w="70%">
          {isEdit ? (
            <ManualInput
              isDisabled={isDisabled}
              addText="Save"
              start={start?.format?.(formatInput)}
              stop={stop?.format?.(formatInput)}
              onAdd={(newStart, newStop) => {
                const newStartDuration = moment(newStart, formatInput);
                const newStopDuration = moment(newStop, formatInput);
                onEdit(newStartDuration, newStopDuration);
                setIsEdit(false);
              }}
            />
          ) : (
            <WorkingPeriod {...{ start, stop, id, quarter }} />
          )}
        </Box>
        <Flex width="30%" justifyContent="flex-end">
          {!quarter && (
            <Button
              disabled={isDisabled}
              {...buttonStyle}
              onClick={() => {
                if (!isEdit) {
                  setIsEdit(true);
                } else {
                  setIsEdit(false);
                }
              }}
            >
              {isEdit ? "Cancel" : "Edit"}
            </Button>
          )}
          <Button disabled={isDisabled} {...buttonStyle} onClick={onRemove}>
            Remove
          </Button>
        </Flex>
      </HStack>
      <Separator variant="dashed" />
    </Flex>
  );
};

const Summary = ({ periods, currentPeriod }) => {
  const durations = [
    ...periods,
    currentPeriod ? { start: currentPeriod, stop: moment() } : null,
  ]
    .filter((p) => !!p)
    .map(({ start, stop }) => stop.diff(start))
    .reduce((a, b) => a + b, 0);
  const fullWorkingDayMillis = moment.duration(7.5, "hours").asMilliseconds();
  const currentDurationMillis = moment.duration(durations).asMilliseconds();
  const percentage = (currentDurationMillis * 100) / fullWorkingDayMillis;
  const workLeftMillis = fullWorkingDayMillis - currentDurationMillis;
  return (
    <Box p={padding}>
      <Heading paddingBottom={padding} size="4xl">
        {moment.utc(currentDurationMillis).format(format)}
      </Heading>
      <Heading size="md">
        {moment.utc(workLeftMillis > 0 ? workLeftMillis : 0).format(format)}{" "}
        left from full working day (7.5 hours)
      </Heading>
      <Box p={padding}>
        <ProgressRoot striped animated={!!currentPeriod} value={percentage}>
          <HStack gap="2">
            <ProgressBar flex="1" rounded={100} bgColor="blackAlpha.600" />
            <ProgressLabel />
            <ProgressValueText />
          </HStack>
        </ProgressRoot>
      </Box>
    </Box>
  );
};

const removePeriod = (periods, idToRemove) => {
  return periods.filter((p, i) => i !== idToRemove);
};

const editPeriod = (periods, idToEdit, newStart, newStop) => {
  return [...periods].map((p, i) =>
    i === idToEdit ? { start: newStart, stop: newStop } : p
  );
};

const LOCAL_STORAGE_KEYS = {
  workingHours: "workingHours",
  currentStartTime: "currentStartTime",
};

const saveHoursToLocalStorage = (hours) => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.workingHours, JSON.stringify(hours));
};

const saveCurrentStartTimeToLocalStorage = (start) => {
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.currentStartTime,
    start?.format?.(format) || ""
  );
};

const getCurrentStartTimeFromLocalStorage = () => {
  const startTime = moment(
    localStorage.getItem(LOCAL_STORAGE_KEYS.currentStartTime) || "",
    format
  );
  return startTime.isValid() ? startTime : null;
};

const getHoursFromLocalStorage = () =>
  JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.workingHours) || "[]").map(
    ({ start, stop }) => ({ start: moment(start), stop: moment(stop) })
  );

const buttonProps: ButtonProps = {
  variant: "ghost",
  _hover: { bg: "blackAlpha.400" },
};

function App() {
  const theme = {};
  const [workingPeriods, setWorkingPeriods] = useState(
    getHoursFromLocalStorage()
  );
  const [currentPeriod, setCurrentPeriod] = useState(
    getCurrentStartTimeFromLocalStorage()
  );
  const [currentMoment, setCurrentMoment] = useState(moment());
  useEffect(() => {
    saveHoursToLocalStorage(workingPeriods);
  }, [workingPeriods]);
  useEffect(() => {
    saveCurrentStartTimeToLocalStorage(currentPeriod);
  }, [currentPeriod]);

  useInterval(() => {
    setCurrentMoment(moment());
  }, 500);
  return (
    <Provider>
      <Center pt={20} transition="all">
        <Box
          bgGradient="to-b"
          gradientFrom={"purple.800"}
          gradientTo={"pink.400"}
          rounded={20}
        >
          <ManualInput
            isDisabled={!!currentPeriod}
            onAdd={(start, stop) => {
              const startDuartion = moment(start, formatInput);
              const stopDuration = moment(stop, formatInput);
              if (startDuartion.isValid() && stopDuration.isValid()) {
                setWorkingPeriods([
                  ...workingPeriods,
                  { start: startDuartion, stop: stopDuration },
                ]);
              }
            }}
            start={undefined}
            stop={undefined}
          />
          <Box p={padding}>
            {!currentPeriod && (
              <Button
                {...buttonProps}
                onClick={() => setCurrentPeriod(moment())}
              >
                START
              </Button>
            )}
            {currentPeriod && (
              <Button
                {...buttonProps}
                onClick={() => {
                  setWorkingPeriods([
                    ...workingPeriods,
                    { start: currentPeriod, stop: moment() },
                  ]);
                  setCurrentPeriod(null);
                }}
              >
                STOP
              </Button>
            )}
            <Box paddingTop={padding}>
              <Button
                {...buttonProps}
                onClick={() =>
                  setWorkingPeriods([
                    ...workingPeriods,
                    {
                      start: moment(),
                      stop: moment().add(15, "minutes"),
                      quarter: "plus",
                    },
                  ])
                }
                marginRight={padding}
              >
                +15 min
              </Button>
              <Button
                {...buttonProps}
                onClick={() =>
                  setWorkingPeriods([
                    ...workingPeriods,
                    {
                      start: moment(),
                      stop: moment().subtract(15, "minutes"),
                      quarter: "minus",
                    },
                  ])
                }
                marginRight={padding}
              >
                -15 min
              </Button>
            </Box>
            {currentPeriod && (
              <HStack p={padding}>
                current:{" "}
                <WorkingPeriod
                  id={workingPeriods.length}
                  start={currentPeriod || currentMoment}
                  stop={currentPeriod && currentMoment}
                />
              </HStack>
            )}
          </Box>
          <Box p={padding}>
            {workingPeriods
              .filter((p) => !!p?.start && !!p?.stop)
              .map((p, i) => (
                <WorkingPeriodWithControls
                  key={`working-period-row-${i}`}
                  isDisabled={!!currentPeriod}
                  id={i}
                  {...p}
                  onEdit={(start, stop) => {
                    setWorkingPeriods([
                      ...editPeriod(workingPeriods, i, start, stop),
                    ]);
                  }}
                  onRemove={() =>
                    setWorkingPeriods(removePeriod(workingPeriods, i))
                  }
                />
              ))}
          </Box>
          <Box>
            <Summary periods={workingPeriods} {...{ currentPeriod }} />
          </Box>
          <Box p={padding}>
            <Button
              {...buttonProps}
              onClick={() => {
                setCurrentPeriod(null);
                setWorkingPeriods([]);
                saveCurrentStartTimeToLocalStorage("");
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Center>
    </Provider>
  );
}

export default App;
