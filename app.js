const systems = {
  "Cloud": { consumption: 1, container: 180 },
  "Cloud 2.0": { consumption: 2, container: 450 },
  "Surface": { consumption: 3.5, container: 500 },
   "Surface 2.0": { consumption: 3.5, container: 700 },
  "Sky": { consumption: 6, container: 2000 },
  "Sky 2.0": { consumption: 8, container: 2000 },
  "SDD-Direct": { consumption: 1.28, container: 800 },
  "SXD-Steam": { consumption: 2.2, container: 2000 }, 
  "SM Dome": { consumption: 1.5, container: 300 },
  "A80": { consumption: 10, container: 100 },
  "Tower": { consumption: 7, container: 1000 },
  "Old Tower": { consumption: 7, container: 1000 },
  "Cloud Mini": { consumption: 1.5, container: 100 }
};

// Elements
const systemEl = document.getElementById("system");
const hoursEl = document.getElementById("hours");
const intensityEl = document.getElementById("intensity");
const daysEl = document.getElementById("days");
const oilEl = document.getElementById("oilPercent");
const lastDateEl = document.getElementById("lastDate");

// Outputs
const monthlyEl = document.getElementById("monthly");
const usableOilEl = document.getElementById("usableOil");
const daysElOut = document.getElementById("daysRemaining");
const nextDateEl = document.getElementById("nextDate");

// Labels
const hoursVal = document.getElementById("hoursVal");
const intensityVal = document.getElementById("intensityVal");
const oilVal = document.getElementById("oilVal");
const dutyCycle = document.getElementById("dutyCycle");
const containerInfo = document.getElementById("containerInfo");
const remainingOil = document.getElementById("remainingOil");


// ------------------
// INIT SYSTEM DROPDOWN
// ------------------
function populateSystems() {
  Object.keys(systems).forEach((key, index) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    systemEl.appendChild(option);

    if (index === 0) systemEl.value = key;
  });
}


// ------------------
// LABEL UPDATE
// ------------------
function updateLabels() {
  const hours = hoursEl.value;
  const intensity = intensityEl.value;
  const oil = oilEl.value;

  hoursVal.textContent = hours;
  intensityVal.textContent = intensity;
  oilVal.textContent = oil;

  dutyCycle.textContent = `ON: ${intensity}s | OFF: ${100 - intensity}s`;
}


// ------------------
// MAIN CALCULATION
// ------------------
function calculate() {
  const system = systems[systemEl.value];
  if (!system) return;

  const consumption = system.consumption;
  const container = system.container;

  const hours = parseFloat(hoursEl.value) || 0;
  const intensity = (parseFloat(intensityEl.value) || 0) / 100;
  const days = parseFloat(daysEl.value) || 0;
  const oilPercent = (parseFloat(oilEl.value) || 0) / 100;

  // Core calculations
  const daily = consumption * hours * intensity;
  const weekly = daily * days;
  const monthly = weekly * 4.33;

  const usableOil = container * oilPercent;

  // Prevent divide by zero
  if (monthly <= 0) {
    monthlyEl.textContent = "0 ml";
    usableOilEl.textContent = usableOil.toFixed(2) + " ml";
    daysElOut.textContent = "0";
    nextDateEl.textContent = "--";
    return;
  }

  const totalDays = (usableOil / monthly) * 30;

  // Date calculation
  const lastDate = new Date(lastDateEl.value);
  let nextDate = "--";

  if (!isNaN(lastDate)) {
    const tempDate = new Date(lastDate);
    tempDate.setDate(tempDate.getDate() + Math.round(totalDays));
    nextDate = tempDate.toLocaleDateString();
  }

  // Output
  monthlyEl.textContent = monthly.toFixed(2) + " ml";
  usableOilEl.textContent = usableOil.toFixed(2) + " ml";
  daysElOut.textContent = Math.round(totalDays);
  nextDateEl.textContent = nextDate;

  containerInfo.textContent = `Container: ${container} ml`;
  remainingOil.textContent = `Remaining Oil: ${usableOil.toFixed(2)} ml`;
}


// ------------------
// EVENT BINDING (FIXED)
// ------------------

// Sliders → real-time
hoursEl.addEventListener("input", () => {
  updateLabels();
  calculate();
});

intensityEl.addEventListener("input", () => {
  updateLabels();
  calculate();
});

oilEl.addEventListener("input", () => {
  updateLabels();
  calculate();
});

// Selects → change
daysEl.addEventListener("change", calculate);
systemEl.addEventListener("change", calculate);
lastDateEl.addEventListener("change", calculate);


// ------------------
// INIT
// ------------------
function init() {
  populateSystems();
  lastDateEl.valueAsDate = new Date();

  updateLabels();
  calculate();
}

init();