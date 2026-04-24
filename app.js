const systems = {
  surface: {
    label: "SM Surface",
    capacityMl: 500,
    rateMlPerHour: 3,
    tolerance: 0.15,
    mode: "standard",
  },
  surface20: {
    label: "SM Surface 2.0",
    capacityMl: 700,
    rateMlPerHour: 3,
    tolerance: 0.15,
    mode: "standard",
  },
  cloud20: {
    label: "SM Cloud 2.0",
    capacityMl: 450,
    rateMlPerHour: 2.6,
    tolerance: 0.15,
    mode: "standard",
  },
  cloudMini: {
    label: "SM Cloud Mini",
    capacityMl: 100,
    rateMlPerMinute: 0.2,
    tolerance: 0.05,
    mode: "cycle",
  },
  sky20: {
    label: "SM Sky 2.0",
    capacityMl: 1000,
    rateMlPerHourPerHead: 4,
    tolerance: 0.15,
    mode: "fixedHeads",
    fixedHeads: 2,
  },
};

const systemSelect = document.getElementById("system");
const refillDateInput = document.getElementById("refillDate");
const refillLevelInput = document.getElementById("refillLevel");
const intensityInput = document.getElementById("intensity");
const runTimePerDayInput = document.getElementById("runTimePerDay");
const cycleStartTimeInput = document.getElementById("cycleStartTime");
const cycleStopTimeInput = document.getElementById("cycleStopTime");
const refillLevelValue = document.getElementById("refillLevelValue");
const intensityValue = document.getElementById("intensityValue");
const dueDateEl = document.getElementById("dueDate");
const runTimeEl = document.getElementById("runTime");
const dailyRuntimeEl = document.getElementById("dailyRuntime");
const remainingMlEl = document.getElementById("remainingMl");
const cloudMiniWrap = document.getElementById("cloudMiniWrap");
const intensityWrap = document.getElementById("intensityWrap");
const form = document.getElementById("calculator-form");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
});

function isoDateFromLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateFromIso(iso) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDays(days) {
  if (!Number.isFinite(days)) return "--";
  if (days < 1) {
    return "Less than 1 day";
  }
  const rounded = Math.round(days * 10) / 10;
  return `${rounded.toLocaleString()} days`;
}

function formatMl(value) {
  return `${Math.round(value).toLocaleString()} ml`;
}

function formatHours(hours) {
  if (!Number.isFinite(hours)) return "--";
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toLocaleString()}h/day`;
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return "--";
  const [hours, minutes] = timeValue.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function getSelectedSystem() {
  return systems[systemSelect.value];
}

function getCloudMiniOffSeconds() {
  const selected = document.querySelector('input[name="cloudMiniOff"]:checked');
  return Number(selected?.value ?? 60);
}

function getIntensityFactor(system) {
  if (system.mode === "cycle") {
    const offSeconds = getCloudMiniOffSeconds();
    const onSeconds = 6;
    return onSeconds / (onSeconds + offSeconds);
  }

  return Number(intensityInput.value) / 100;
}

function getRunTimePerDay(system) {
  if (system.mode === "cycle") {
    const offSeconds = getCloudMiniOffSeconds();
    const onSeconds = 6;
    return (24 * onSeconds) / (onSeconds + offSeconds);
  }

  if (cycleStartTimeInput.value && cycleStopTimeInput.value) {
    const [startHour, startMinute] = cycleStartTimeInput.value.split(":").map(Number);
    const [stopHour, stopMinute] = cycleStopTimeInput.value.split(":").map(Number);
    let startTotalMinutes = startHour * 60 + startMinute;
    let stopTotalMinutes = stopHour * 60 + stopMinute;

    if (stopTotalMinutes <= startTotalMinutes) {
      stopTotalMinutes += 24 * 60;
    }

    return (stopTotalMinutes - startTotalMinutes) / 60;
  }

  const runTimePerDay = Number(runTimePerDayInput.value);
  if (Number.isFinite(runTimePerDay) && runTimePerDay > 0) {
    return Math.min(runTimePerDay, 24);
  }

  return 24;
}

function getConsumptionPerHour(system) {
  if (system.mode === "standard") {
    return system.rateMlPerHour;
  }

  if (system.mode === "cycle") {
    return system.rateMlPerMinute * 60;
  }

  return system.rateMlPerHourPerHead * system.fixedHeads;
}

function calculateDueDate() {
  const system = getSelectedSystem();
  const refillDate = localDateFromIso(refillDateInput.value) ?? startOfLocalDay(new Date());
  const refillLevel = Number(refillLevelInput.value) / 100;
  const intensityFactor = getIntensityFactor(system);
  const baseConsumptionPerHour = getConsumptionPerHour(system);
  const runTimePerDay = getRunTimePerDay(system);
  const dailyConsumption = baseConsumptionPerHour * intensityFactor * runTimePerDay;
  const remainingLiquidMl = system.capacityMl * refillLevel;

  if (dailyConsumption <= 0 || remainingLiquidMl <= 0) {
    return {
      dueDate: refillDate,
      runDays: 0,
      remainingLiquidMl,
    };
  }

  const runDays = remainingLiquidMl / dailyConsumption;
  const dueDate = addDays(refillDate, Math.max(1, Math.ceil(runDays)));

  return {
    dueDate,
    runDays,
    remainingLiquidMl,
    runTimePerDay,
  };
}

function updateView() {
  const system = getSelectedSystem();
  const isCloudMini = system.mode === "cycle";

  refillLevelValue.textContent = `${refillLevelInput.value}%`;
  intensityValue.textContent = isCloudMini
    ? `${getCloudMiniOffSeconds()}s off`
    : `${intensityInput.value}%`;

  cloudMiniWrap.classList.toggle("hidden", !isCloudMini);
  intensityWrap.classList.toggle("hidden", isCloudMini);

  const { dueDate, runDays, remainingLiquidMl, runTimePerDay } = calculateDueDate();
  dueDateEl.textContent = dateFormatter.format(dueDate);
  runTimeEl.textContent = formatDays(runDays);
  dailyRuntimeEl.textContent = formatHours(runTimePerDay);
  remainingMlEl.textContent = formatMl(remainingLiquidMl);
}

function populateSystems() {
  for (const [value, system] of Object.entries(systems)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = system.label;
    systemSelect.appendChild(option);
  }

  systemSelect.value = "surface";
}

function setDefaultDate() {
  refillDateInput.value = isoDateFromLocalDate(new Date());
}

populateSystems();
setDefaultDate();
updateView();

form.addEventListener("input", updateView);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateView();
});
