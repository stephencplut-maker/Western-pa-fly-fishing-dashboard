"use strict";

/*
 * Western PA Fly Fishing Dashboard
 *
 * Loads live USGS data for every river defined in riverProfiles.js,
 * evaluates wading safety and fishing conditions, updates each card,
 * and selects the best safe fishing option.
 */

const USGS_PARAMETER_CODES = {
  flow: "00060",
  stage: "00065",
  temperature: "00010"
};


/*
 * Load all river conditions after the page is ready.
 */
document.addEventListener("DOMContentLoaded", loadRiverData);


/*
 * Retrieve and display data for every configured river.
 */
async function loadRiverData() {
  const profiles = Object.values(RIVER_PROFILES);

  const results = await Promise.all(
    profiles.map(loadSingleRiver)
  );

  const availableResults = results.filter(
    result => result !== null
  );

  updateRecommendation(availableResults);
}


/*
 * Retrieve USGS data for one river.
 */
async function loadSingleRiver(profile) {
  const display = document.getElementById(profile.id);

  if (!display) {
    console.warn(
      `No HTML element found for river ID: ${profile.id}`
    );

    return null;
  }

  try {
    const readings = await fetchUsgsReadings(profile.gaugeId);

    const evaluation = evaluateRiverConditions(
      profile,
      readings.flow,
      readings.stage,
      readings.temperature
    );

    display.innerHTML = createRiverCardContent(
      profile,
      readings,
      evaluation
    );

    return {
      profile,
      readings,
      evaluation
    };

  } catch (error) {
    console.error(
      `Unable to load ${profile.name}:`,
      error
    );

    display.innerHTML = `
      <p class="data-error">
        ⚠️ Live USGS data is currently unavailable.
      </p>
    `;

    return null;
  }
}


/*
 * Request current instantaneous values from USGS.
 */
async function fetchUsgsReadings(gaugeId) {
  const url =
    "https://waterservices.usgs.gov/nwis/iv/" +
    `?format=json&sites=${gaugeId}` +
    "&parameterCd=00060,00065,00010" +
    "&siteStatus=all";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `USGS request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  const readings = {
    flow: null,
    stage: null,
    temperature: null,
    timestamp: null
  };

  const timeSeries = data?.value?.timeSeries ?? [];

  for (const series of timeSeries) {
    const parameterCode =
      series?.variable?.variableCode?.[0]?.value;

    const latestValue =
      series?.values?.[0]?.value?.[0];

    if (!latestValue) {
      continue;
    }

    const numericValue = Number(latestValue.value);

    if (!Number.isFinite(numericValue)) {
      continue;
    }

    if (parameterCode === USGS_PARAMETER_CODES.flow) {
      readings.flow = numericValue;
    }

    if (parameterCode === USGS_PARAMETER_CODES.stage) {
      readings.stage = numericValue;
    }

    if (
      parameterCode ===
      USGS_PARAMETER_CODES.temperature
    ) {
      readings.temperature =
        celsiusToFahrenheit(numericValue);
    }

    if (
      latestValue.dateTime &&
      !readings.timestamp
    ) {
      readings.timestamp =
        new Date(latestValue.dateTime);
    }
  }

  return readings;
}


/*
 * Evaluate one river using its river-specific profile.
 */
function evaluateRiverConditions(
  profile,
  flow,
  stage,
  temperature
) {
  const flowRating = evaluateThreshold(
    flow,
    profile.wading.flow
  );

  const stageRating = evaluateThreshold(
    stage,
    profile.wading.stage
  );

  const wading = chooseMoreConservativeRating(
    flowRating,
    stageRating
  );

  const flowScore = calculateFlowScore(
    flow,
    profile.fishing.idealFlow
  );

  const temperatureScore =
    calculateTemperatureScore(
      temperature,
      profile.fishing.preferredTemperature
    );

  const safetyScore =
    calculateSafetyScore(wading.level);

  const totalScore = Math.max(
    0,
    Math.min(
      10,
      flowScore +
      temperatureScore +
      safetyScore
    )
  );

  return {
    flowRating,
    stageRating,
    wading,
    score: Number(totalScore.toFixed(1)),
    fishingRating:
      createFishingRating(totalScore),
    suggestedFly:
      selectSuggestedFly(profile, totalScore),
    notes:
      createGuideNotes(
        profile,
        flow,
        temperature,
        wading,
        totalScore
      )
  };
}


/*
 * Convert a current reading into one of the four
 * wading-safety levels.
 */
function evaluateThreshold(value, thresholds) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return {
      level: 0,
      label: "⚪ Not Available"
    };
  }

  if (value <= thresholds.comfortableMax) {
    return {
      level: 1,
      label: "🟢 Comfortable"
    };
  }

  if (value <= thresholds.cautionMax) {
    return {
      level: 2,
      label: "🟡 Use Caution"
    };
  }

  if (value <= thresholds.experiencedMax) {
    return {
      level: 3,
      label: "🟠 Experienced Waders Only"
    };
  }

  return {
    level: 4,
    label: "🔴 Not Recommended"
  };
}


/*
 * Use the more conservative result when flow and
 * stage produce different ratings.
 */
function chooseMoreConservativeRating(
  flowRating,
  stageRating
) {
  if (flowRating.level === 0) {
    return stageRating;
  }

  if (stageRating.level === 0) {
    return flowRating;
  }

  return flowRating.level >= stageRating.level
    ? flowRating
    : stageRating;
}


/*
 * Score flow conditions from 0 to 5.
 */
function calculateFlowScore(flow, idealFlow) {
  if (
    flow === null ||
    !Number.isFinite(flow)
  ) {
    return 1;
  }

  if (
    flow >= idealFlow.min &&
    flow <= idealFlow.max
  ) {
    return 5;
  }

  const lowerNearRange = idealFlow.min * 0.7;
  const upperNearRange = idealFlow.max * 1.35;

  if (
    flow >= lowerNearRange &&
    flow <= upperNearRange
  ) {
    return 4;
  }

  const lowerFairRange = idealFlow.min * 0.4;
  const upperFairRange = idealFlow.max * 1.75;

  if (
    flow >= lowerFairRange &&
    flow <= upperFairRange
  ) {
    return 2.5;
  }

  return 1;
}


/*
 * Score water temperature from 0 to 3.
 */
function calculateTemperatureScore(
  temperature,
  preferredRange
) {
  if (
    temperature === null ||
    !Number.isFinite(temperature)
  ) {
    return 1;
  }

  if (
    temperature >= preferredRange.min &&
    temperature <= preferredRange.max
  ) {
    return 3;
  }

  if (
    temperature >= preferredRange.min - 5 &&
    temperature <= preferredRange.max + 5
  ) {
    return 2;
  }

  return 0.5;
}


/*
 * Score wading safety from 0 to 2.
 */
function calculateSafetyScore(wadingLevel) {
  switch (wadingLevel) {
    case 1:
      return 2;

    case 2:
      return 1.5;

    case 3:
      return 0.5;

    case 4:
      return 0;

    default:
      return 0.5;
  }
}


/*
 * Convert the numerical score to a fishing label.
 */
function createFishingRating(score) {
  if (score >= 8.5) {
    return "🟢 Excellent";
  }

  if (score >= 7) {
    return "🟢 Very Good";
  }

  if (score >= 5.5) {
    return "🟡 Good";
  }

  if (score >= 4) {
    return "🟠 Fair";
  }

  return "🔴 Limited";
}


/*
 * Select a fly from the river's profile.
 */
function selectSuggestedFly(profile, score) {
  const flies = profile.flies ?? [];

  if (flies.length === 0) {
    return "Purple Woolly Bugger";
  }

  if (score >= 7) {
    return flies[0];
  }

  if (score >= 5 && flies.length >= 2) {
    return flies[1];
  }

  return flies[flies.length - 1];
}


/*
 * Create concise guide-style notes.
 */
function createGuideNotes(
  profile,
  flow,
  temperature,
  wading,
  score
) {
  const notes = [];

  if (
    flow !== null &&
    flow >= profile.fishing.idealFlow.min &&
    flow <= profile.fishing.idealFlow.max
  ) {
    notes.push("Flow is in the ideal fishing range.");
  } else if (flow !== null) {
    notes.push("Flow is outside the ideal fishing range.");
  } else {
    notes.push("Flow data is not currently reported.");
  }

  if (
    temperature !== null &&
    temperature >=
      profile.fishing.preferredTemperature.min &&
    temperature <=
      profile.fishing.preferredTemperature.max
  ) {
    notes.push("Water temperature is excellent.");
  } else if (temperature !== null) {
    notes.push(
      "Water temperature is outside the preferred range."
    );
  } else {
    notes.push(
      "Water temperature is not currently reported."
    );
  }

  if (wading.level === 1) {
    notes.push("Wading conditions appear comfortable.");
  }

  if (wading.level === 2) {
    notes.push(
      "Use caution and limit unnecessary crossings."
    );
  }

  if (wading.level === 3) {
    notes.push(
      "Conditions are appropriate only for experienced waders."
    );
  }

  if (wading.level === 4) {
    notes.push("Normal wading is not recommended.");
  }

  if (score >= 8.5) {
    notes.push("Excellent overall fishing conditions.");
  }

  return notes;
}


/*
 * Build the live conditions displayed in each card.
 */
function createRiverCardContent(
  profile,
  readings,
  evaluation
) {
  const updatedTime = readings.timestamp
    ? readings.timestamp.toLocaleString()
    : "Not reported";

  return `
    <p>
      <strong>Flow:</strong>
      ${formatFlow(readings.flow)}
    </p>

    <p>
      <strong>Gage Height:</strong>
      ${formatStage(readings.stage)}
    </p>

    <p>
      <strong>Water Temperature:</strong>
      ${formatTemperature(readings.temperature)}
    </p>

    <p>
      <strong>Wading Recommendation:</strong>
      ${evaluation.wading.label}
    </p>

    <p>
      <strong>Fishing Rating:</strong>
      ${evaluation.score} / 10
      — ${evaluation.fishingRating}
    </p>

    <p>
      <strong>Suggested Fly:</strong>
      ${evaluation.suggestedFly}
    </p>

    <p>
      <strong>Guide Notes:</strong><br>
      ${evaluation.notes.join("<br>")}
    </p>

    <p class="updated-time">
      <small>
        USGS updated: ${updatedTime}
      </small>
    </p>
  `;
}


/*
 * Select and display the highest-scoring river that
 * is not rated Not Recommended.
 */
function updateRecommendation(results) {
  const box = document.getElementById("bestRiver");

  if (!box) {
    return;
  }

  const safeResults = results.filter(
    result =>
      result.evaluation.wading.level > 0 &&
      result.evaluation.wading.level < 4
  );

  if (safeResults.length === 0) {
    box.innerHTML = `
      <p>
        No recommended wading options were found
        using the currently available gauge data.
      </p>
    `;

    return;
  }

  safeResults.sort(
    (a, b) =>
      b.evaluation.score -
      a.evaluation.score
  );

  const best = safeResults[0];

  box.innerHTML = `
    <p>
      🥇 <strong>${best.profile.name}</strong>
    </p>

    <p>
      <strong>USGS Gauge:</strong>
      ${best.profile.gaugeLocation}
    </p>

    <p>
      <strong>Wading Recommendation:</strong>
      ${best.evaluation.wading.label}
    </p>

    <p>
      <strong>Fishing Rating:</strong>
      ${best.evaluation.score} / 10
      — ${best.evaluation.fishingRating}
    </p>

    <p>
      <strong>Flow:</strong>
      ${formatFlow(best.readings.flow)}
    </p>

    <p>
      <strong>Gage Height:</strong>
      ${formatStage(best.readings.stage)}
    </p>

    <p>
      <strong>Water Temperature:</strong>
      ${formatTemperature(
        best.readings.temperature
      )}
    </p>

    <p>
      🎣 <strong>First Fly:</strong>
      ${best.evaluation.suggestedFly}
    </p>

    <p>
      ${best.evaluation.notes.join("<br>")}
    </p>

    <p>
      <small>
        Dashboard checked:
        ${new Date().toLocaleTimeString()}
      </small>
    </p>
  `;
}


/*
 * Formatting helpers.
 */
function formatFlow(flow) {
  return Number.isFinite(flow)
    ? `${Math.round(flow).toLocaleString()} CFS`
    : "Not reported";
}


function formatStage(stage) {
  return Number.isFinite(stage)
    ? `${stage.toFixed(2)} ft`
    : "Not reported";
}


function formatTemperature(temperature) {
  return Number.isFinite(temperature)
    ? `${temperature.toFixed(1)}°F`
    : "Not reported";
}


function celsiusToFahrenheit(celsius) {
  return Number(
    ((celsius * 9 / 5) + 32).toFixed(1)
  );
}
