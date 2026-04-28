const hospitals = [
  {
    id: "st-marys",
    name: "St. Mary's Regional Hospital",
    distanceByLocation: { central: 2.8, highway: 8.4, campus: 4.2, industrial: 6.1 },
    specialties: ["cardiac", "respiratory", "pediatrics"],
    beds: { icu: 3, ed: 12, trauma: 2 },
    staffReady: 82,
    cathLab: true,
    strokeUnit: true,
    ventilators: 7,
  },
  {
    id: "city-trauma",
    name: "City Trauma and Neuro Center",
    distanceByLocation: { central: 5.4, highway: 3.2, campus: 9.1, industrial: 4.4 },
    specialties: ["trauma", "stroke"],
    beds: { icu: 5, ed: 8, trauma: 4 },
    staffReady: 76,
    cathLab: false,
    strokeUnit: true,
    ventilators: 5,
  },
  {
    id: "metro-care",
    name: "MetroCare Multispecialty",
    distanceByLocation: { central: 4.1, highway: 6.9, campus: 2.6, industrial: 8.6 },
    specialties: ["cardiac", "trauma", "respiratory", "stroke"],
    beds: { icu: 1, ed: 6, trauma: 1 },
    staffReady: 68,
    cathLab: true,
    strokeUnit: true,
    ventilators: 2,
  },
  {
    id: "north-general",
    name: "North General Emergency Wing",
    distanceByLocation: { central: 7.7, highway: 9.5, campus: 5.3, industrial: 3.1 },
    specialties: ["respiratory", "trauma"],
    beds: { icu: 6, ed: 14, trauma: 3 },
    staffReady: 91,
    cathLab: false,
    strokeUnit: false,
    ventilators: 11,
  },
];

const conditionRules = {
  cardiac: {
    label: "Cardiac Arrest - STEMI",
    specialty: "cardiac",
    needs: ["Cath lab", "ICU bed", "Cardiologist", "Defibrillator"],
    note: "Cath lab and ICU prep required before arrival.",
  },
  trauma: {
    label: "Trauma - Motor Vehicle Accident",
    specialty: "trauma",
    needs: ["Trauma bay", "CT imaging", "Blood bank", "Surgery team"],
    note: "Rapid trauma evaluation and imaging required.",
  },
  stroke: {
    label: "Suspected Stroke",
    specialty: "stroke",
    needs: ["Stroke unit", "CT imaging", "Neurology", "ICU standby"],
    note: "Time-sensitive stroke pathway should be activated.",
  },
  respiratory: {
    label: "Respiratory Distress",
    specialty: "respiratory",
    needs: ["Ventilator", "ED bed", "Pulmonology", "Oxygen support"],
    note: "Ventilator and respiratory team should be on standby.",
  },
};

const sampleCases = [
  {
    age: 62,
    sex: "Male",
    condition: "cardiac",
    heartRate: 145,
    spo2: 88,
    bp: 80,
    location: "central",
    severity: "critical",
    notes: "Sudden chest pain, sweating, dizziness. Suspected STEMI. Needs cath lab and ICU prep.",
  },
  {
    age: 34,
    sex: "Female",
    condition: "trauma",
    heartRate: 118,
    spo2: 94,
    bp: 105,
    location: "highway",
    severity: "urgent",
    notes: "Highway collision with suspected internal bleeding and limb fracture.",
  },
  {
    age: 71,
    sex: "Male",
    condition: "stroke",
    heartRate: 96,
    spo2: 97,
    bp: 172,
    location: "campus",
    severity: "critical",
    notes: "Facial droop, slurred speech, left-side weakness. Last known well 35 minutes ago.",
  },
  {
    age: 45,
    sex: "Female",
    condition: "respiratory",
    heartRate: 132,
    spo2: 82,
    bp: 118,
    location: "industrial",
    severity: "urgent",
    notes: "Severe breathlessness after chemical exposure. Oxygen saturation dropping.",
  },
];

const state = {
  currentCase: {
    id: "EC-2026-0142",
    eta: 4,
    status: "Awaiting hospital response",
    accepted: false,
    readiness: {
      "Clinical team paged": true,
      "Destination unit selected": true,
      "Bed assigned": false,
      "Equipment staged": false,
      "Family desk notified": false,
      "Route shared with ER": true,
    },
    ...sampleCases[0],
  },
  caseCounter: 142,
  sampleIndex: 0,
};

const form = document.querySelector("#caseForm");
const inputs = {
  age: document.querySelector("#ageInput"),
  sex: document.querySelector("#sexInput"),
  condition: document.querySelector("#conditionInput"),
  heartRate: document.querySelector("#heartRateInput"),
  spo2: document.querySelector("#spo2Input"),
  bp: document.querySelector("#bpInput"),
  location: document.querySelector("#locationInput"),
  notes: document.querySelector("#notesInput"),
};

const recommendationSummary = document.querySelector("#recommendationSummary");
const hospitalList = document.querySelector("#hospitalList");
const severityBadge = document.querySelector("#severityBadge");
const distanceMeter = document.querySelector("#distanceMeter");
const specialtyMeter = document.querySelector("#specialtyMeter");
const capacityMeter = document.querySelector("#capacityMeter");
const caseQueue = document.querySelector("#caseQueue");
const readinessList = document.querySelector("#readinessList");
const readinessScore = document.querySelector("#readinessScore");
const resourceCards = document.querySelector("#resourceCards");
const criticalCount = document.querySelector("#criticalCount");
const queueCount = document.querySelector("#queueCount");
const decisionTime = document.querySelector("#decisionTime");
const readyHospitals = document.querySelector("#readyHospitals");

function getSeverity() {
  return document.querySelector("input[name='severity']:checked").value;
}

function setSeverity(value) {
  const field = document.querySelector(`input[name='severity'][value='${value}']`);
  if (field) {
    field.checked = true;
  }
}

function getFormCase() {
  return {
    age: Number(inputs.age.value || 0),
    sex: inputs.sex.value,
    condition: inputs.condition.value,
    heartRate: Number(inputs.heartRate.value || 0),
    spo2: Number(inputs.spo2.value || 0),
    bp: Number(inputs.bp.value || 0),
    location: inputs.location.value,
    severity: getSeverity(),
    notes: inputs.notes.value.trim(),
  };
}

function applyCaseToForm(caseData) {
  inputs.age.value = caseData.age;
  inputs.sex.value = caseData.sex;
  inputs.condition.value = caseData.condition;
  inputs.heartRate.value = caseData.heartRate;
  inputs.spo2.value = caseData.spo2;
  inputs.bp.value = caseData.bp;
  inputs.location.value = caseData.location;
  inputs.notes.value = caseData.notes;
  setSeverity(caseData.severity);
}

function capacityScore(hospital, condition) {
  const specialty = conditionRules[condition].specialty;
  const bedScore =
    specialty === "trauma" ? hospital.beds.trauma * 13 : hospital.beds.icu * 14 + hospital.beds.ed * 2;
  const equipmentScore =
    (specialty === "cardiac" && hospital.cathLab ? 18 : 0) +
    (specialty === "stroke" && hospital.strokeUnit ? 18 : 0) +
    (specialty === "respiratory" ? Math.min(hospital.ventilators * 3, 20) : 0);

  return Math.min(100, bedScore + equipmentScore + hospital.staffReady * 0.28);
}

function scoreHospital(hospital, caseData) {
  const distance = hospital.distanceByLocation[caseData.location];
  const specialty = conditionRules[caseData.condition].specialty;
  const distanceComponent = Math.max(0, 100 - distance * 8);
  const specialtyComponent = hospital.specialties.includes(specialty) ? 100 : 42;
  const capacityComponent = capacityScore(hospital, caseData.condition);
  const severityBoost = caseData.severity === "critical" ? 1.08 : caseData.severity === "urgent" ? 1.02 : 0.96;
  const score = (distanceComponent * 0.34 + specialtyComponent * 0.36 + capacityComponent * 0.3) * severityBoost;

  return {
    ...hospital,
    distance,
    distanceComponent: Math.round(distanceComponent),
    specialtyComponent: Math.round(specialtyComponent),
    capacityComponent: Math.round(capacityComponent),
    score: Math.min(99, Math.round(score)),
  };
}

function getRankings(caseData = getFormCase()) {
  return hospitals
    .map((hospital) => scoreHospital(hospital, caseData))
    .sort((a, b) => b.score - a.score);
}

function getEta(distance, severity) {
  const trafficFactor = severity === "critical" ? 1.05 : 1.22;
  return Math.max(3, Math.round(distance * trafficFactor + 1));
}

function renderRecommendations() {
  const caseData = getFormCase();
  const rankings = getRankings(caseData);
  const top = rankings[0];
  const rule = conditionRules[caseData.condition];

  severityBadge.textContent = caseData.severity;
  severityBadge.className = `severity-badge ${caseData.severity}`;
  distanceMeter.value = top.distanceComponent;
  specialtyMeter.value = top.specialtyComponent;
  capacityMeter.value = top.capacityComponent;

  recommendationSummary.innerHTML = `
    <span>Recommended destination</span>
    <strong>${top.name}</strong>
    <p>${rule.note} Estimated arrival is ${getEta(top.distance, caseData.severity)} minutes with a ${top.score}% routing confidence.</p>
  `;

  hospitalList.innerHTML = rankings
    .map((hospital, index) => {
      const readiness = hospital.staffReady >= 80 ? "High readiness" : hospital.staffReady >= 70 ? "Moderate readiness" : "Limited readiness";
      return `
        <article class="hospital-card ${index === 0 ? "is-top" : ""}">
          <header>
            <div>
              <h3>${hospital.name}</h3>
              <small>${hospital.distance.toFixed(1)} km away - ${getEta(hospital.distance, caseData.severity)} min ETA</small>
            </div>
            <span class="score-pill">${hospital.score}%</span>
          </header>
          <div class="tags">
            <span class="tag">${readiness}</span>
            <span class="tag">ICU ${hospital.beds.icu}</span>
            <span class="tag">ED ${hospital.beds.ed}</span>
            <span class="tag">${hospital.cathLab ? "Cath lab" : "No cath lab"}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function formatCondition(caseData) {
  return conditionRules[caseData.condition].label;
}

function renderQueue() {
  const rankings = getRankings(state.currentCase);
  const destination = rankings[0];
  const rule = conditionRules[state.currentCase.condition];
  const critical = state.currentCase.severity === "critical";

  criticalCount.textContent = critical ? "1" : "0";
  queueCount.textContent = "1 active case";
  decisionTime.textContent = state.currentCase.accepted ? "18 sec" : "42 sec";

  caseQueue.innerHTML = `
    <article class="case-card ${critical ? "critical" : ""} ${state.currentCase.accepted ? "accepted" : ""}">
      <header>
        <div>
          <p class="eyebrow">${state.currentCase.id}</p>
          <h3>${formatCondition(state.currentCase)}</h3>
          <small>${state.currentCase.sex}, ${state.currentCase.age} years - Ambulance AMB-${state.currentCase.id.slice(-3)}</small>
        </div>
        <span class="severity-badge ${state.currentCase.severity}">${state.currentCase.severity}</span>
      </header>
      <div class="case-meta">
        <div><span>ETA</span><strong>${state.currentCase.eta} min</strong></div>
        <div><span>Vitals</span><strong>HR ${state.currentCase.heartRate} / SpO2 ${state.currentCase.spo2}%</strong></div>
        <div><span>Destination</span><strong>${destination.name}</strong></div>
        <div><span>Status</span><strong>${state.currentCase.status}</strong></div>
      </div>
      <p>${state.currentCase.notes}</p>
      <div class="tags">
        ${rule.needs.map((need) => `<span class="tag">${need}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderReadiness() {
  const entries = Object.entries(state.currentCase.readiness);
  const readyCount = entries.filter(([, ready]) => ready).length;
  const score = Math.round((readyCount / entries.length) * 100);

  readinessScore.textContent = `${score}% ready`;
  readinessList.innerHTML = entries
    .map(([label, ready]) => {
      return `
        <div class="readiness-item ${ready ? "is-ready" : ""}">
          <strong>${label}</strong>
          <button type="button" data-readiness="${label}">${ready ? "Ready" : "Mark ready"}</button>
        </div>
      `;
    })
    .join("");
}

function renderResources() {
  const rankings = getRankings(state.currentCase);
  readyHospitals.textContent = String(hospitals.filter((hospital) => hospital.staffReady >= 70).length);
  resourceCards.innerHTML = rankings
    .map((hospital) => {
      const totalBeds = hospital.beds.icu + hospital.beds.ed + hospital.beds.trauma;
      const fill = Math.min(100, Math.round((totalBeds / 24) * 100));
      return `
        <article class="resource-card">
          <header>
            <div>
              <span>${hospital.distanceByLocation[state.currentCase.location].toFixed(1)} km</span>
              <h3>${hospital.name}</h3>
            </div>
            <strong>${totalBeds}</strong>
          </header>
          <small>${hospital.beds.icu} ICU, ${hospital.beds.ed} ED, ${hospital.ventilators} ventilators</small>
          <div class="bar"><i style="width: ${fill}%"></i></div>
        </article>
      `;
    })
    .join("");
}

function renderAll() {
  renderRecommendations();
  renderQueue();
  renderReadiness();
  renderResources();
}

function dispatchCurrentForm() {
  const caseData = getFormCase();
  const top = getRankings(caseData)[0];
  state.caseCounter += 1;
  state.currentCase = {
    ...caseData,
    id: `EC-2026-${String(state.caseCounter).padStart(4, "0")}`,
    eta: getEta(top.distance, caseData.severity),
    status: "Awaiting hospital response",
    accepted: false,
    readiness: {
      "Clinical team paged": true,
      "Destination unit selected": true,
      "Bed assigned": false,
      "Equipment staged": false,
      "Family desk notified": false,
      "Route shared with ER": true,
    },
  };
  renderAll();
  document.querySelector("#command").scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("input", renderRecommendations);
form.addEventListener("change", renderRecommendations);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  dispatchCurrentForm();
});

document.querySelector("#clearBtn").addEventListener("click", () => {
  applyCaseToForm(sampleCases[0]);
  renderRecommendations();
});

document.querySelector("#simulateCaseBtn").addEventListener("click", () => {
  state.sampleIndex = (state.sampleIndex + 1) % sampleCases.length;
  applyCaseToForm(sampleCases[state.sampleIndex]);
  dispatchCurrentForm();
});

document.querySelector("#acceptBtn").addEventListener("click", () => {
  state.currentCase.accepted = true;
  state.currentCase.status = "Accepted - care team preparing";
  state.currentCase.readiness["Bed assigned"] = true;
  state.currentCase.readiness["Equipment staged"] = true;
  renderAll();
});

document.querySelector("#redirectBtn").addEventListener("click", () => {
  state.currentCase.accepted = false;
  state.currentCase.status = "Redirect sent with safer destination";
  state.currentCase.readiness["Destination unit selected"] = false;
  renderAll();
});

document.querySelector("#refreshBtn").addEventListener("click", () => {
  hospitals.forEach((hospital, index) => {
    const direction = index % 2 === 0 ? 2 : -2;
    hospital.staffReady = Math.max(62, Math.min(96, hospital.staffReady + direction));
  });
  renderAll();
});

readinessList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-readiness]");
  if (!button) {
    return;
  }
  const key = button.dataset.readiness;
  state.currentCase.readiness[key] = !state.currentCase.readiness[key];
  renderReadiness();
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((navItem) => navItem.classList.remove("is-active"));
    item.classList.add("is-active");
  });
});

applyCaseToForm(state.currentCase);
renderAll();
