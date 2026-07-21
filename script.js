"use strict";

/*
 * Western PA Fly Fishing Dashboard
 * Version 2.0
 *
 * Loads live USGS data for every river defined in riverProfiles.js,
 * evaluates each river through riverEngine.js, updates the river cards,
 * and selects the best safe wading option.
 */

const USGS_PARAMETER_CODES = Object.freeze({
  flow: "00060",
  stage: "00065",
  temperature: "00010"
});


/*
 * Load all river conditions after the page is ready.
 *
 * Script order in index.html must be:
 *
 * 1. riverProfiles.js
 * 2. riverEngine.js
 * 3. script.js
 */
document.addEventListener(
  "DOMContentLoaded",
  loadRiverData
);


/*
 * Retrieve and display conditions for every configured river.
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
 * Retrieve USGS data and evaluate one river.
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
    const readings = await fetchUsgsReadings(
      profile.gaugeId
    );

    /*
     * All fishing and wading decisions now come from
     * riverEngine.js.
     */
    const evaluation = evaluateRiver(
      profile.id,
      readings
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
  const parameterCodes = Object.values(
    USGS_PARAMETER_CODES
  ).join(",");

  const url =
    "https://waterservices.usgs.gov/nwis/iv/" +
    `?format=json&sites=${encodeURIComponent(gaugeId)}` +
    `&parameterCd=${parameterCodes}` +
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

  const timeSeries =
    data?.value?.timeSeries ?? [];

  for (const series of timeSeries) {
    const parameterCode =
      series?.variable?.variableCode?.[0]?.value;

    const latestValue =
      getLatestValidValue(series);

    if (!latestValue) {
      continue;
    }

    const numericValue = Number(
      latestValue.value
    );

    if (!Number.isFinite(numericValue)) {
      continue;
    }

    if (
      parameterCode ===
      USGS_PARAMETER_CODES.flow
    ) {
      readings.flow = numericValue;
    }

    if (
      parameterCode ===
      USGS_PARAMETER_CODES.stage
    ) {
      readings.stage = numericValue;
    }

    if (
      parameterCode ===
      USGS_PARAMETER_CODES.temperature
    ) {
      readings.temperature =
        celsiusToFahrenheit(numericValue);
    }

    if (latestValue.dateTime) {
      const observationTime =
        new Date(latestValue.dateTime);

      if (
        !Number.isNaN(
          observationTime.getTime()
        ) &&
        (
          readings.timestamp === null ||
          observationTime >
            readings.timestamp
        )
      ) {
        readings.timestamp =
          observationTime;
      }
    }
  }

  return readings;
}


/*
 * Return the most recent usable value from one USGS series.
 */
function getLatestValidValue(series) {
  const values =
    series?.values?.[0]?.value ?? [];

  for (let index = values.length - 1; index >= 0; index -= 1) {
    const candidate = values[index];
    const numericValue = Number(candidate?.value);

    if (Number.isFinite(numericValue)) {
      return candidate;
    }
  }

  return null;
}


/*
 * Build the live conditions displayed in each river card.
 */
function createRiverCardContent(
  profile,
  readings,
  evaluation
) {
  const updatedTime =
    formatTimestamp(readings.timestamp);

  const scoringBasis =
    createScoringBasis(evaluation);

  const fishingRating =
    createFishingRating(
      evaluation.fishingScore
    );

  return `
    <p>
      <strong>Flow:</strong>
      ${formatFlow(readings.flow)}
    </p>

    <p>
      <strong>Fishing Flow Zone:</strong>
      ${evaluation.flowZoneIcon}
      ${evaluation.flowZoneLabel}
    </p>

    <p>
      <strong>Gage Height:</strong>
      ${formatStage(readings.stage)}
    </p>

    <p>
      <strong>Water Temperature:</strong>
      ${formatTemperature(
        readings.temperature
      )}
    </p>

    <p>
      <strong>Wading Recommendation:</strong>
      ${evaluation.wading.icon}
      ${evaluation.wading.label}
    </p>

    <p>
      <strong>Fishing Rating:</strong>
      ${formatFishingScore(
        evaluation.fishingScore
      )}
      ${fishingRating}
    </p>

    <p>
      <strong>Rating Basis:</strong>
      ${scoringBasis}
    </p>

    <p>
      <strong>Suggested Fly:</strong>
      ${evaluation.suggestedFly}
    </p>

    <p>
      <strong>Condition Summary:</strong><br>
      ${evaluation.guideNotes}
    </p>

    <p class="updated-time">
      <small>
        USGS updated: ${updatedTime}
      </small>
    </p>
  `;
}


/*
 * Select and display the highest-rated eligible river.
 *
 * Eligibility is determined by riverEngine.js and requires:
 *
 * - a valid fishing score
 * - a non-dangerous fishing-flow zone
 * - wading that is not rated Not Recommended
 */
function updateRecommendation(results) {
  const box = document.getElementById(
    "bestRiver"
  );

  if (!box) {
    return;
  }

  const evaluations = results.map(
    result => result.evaluation
  );

  const bestEvaluation =
    selectBestRiver(evaluations);

  if (!bestEvaluation) {
    box.innerHTML = `
      <p>
        🔴 <strong>No river is currently recommended
        for wading.</strong>
      </p>

      <p>
        Review the individual river cards before
        deciding whether to fish from shore or postpone
        the trip.
      </p>

      <p>
        <small>
          Dashboard checked:
          ${new Date().toLocaleString()}
        </small>
      </p>
    `;

    return;
  }

  const best = results.find(
    result =>
      result.evaluation.riverId ===
      bestEvaluation.riverId
  );

  if (!best) {
    box.innerHTML = `
      <p>
        No recommendation could be produced from the
        currently available data.
      </p>
    `;

    return;
  }

  const fishingRating =
    createFishingRating(
      best.evaluation.fishingScore
    );

  const scoringBasis =
    createScoringBasis(
      best.evaluation
    );

  box.innerHTML = `
    <p>
      🥇 <strong>${best.profile.name}</strong>
    </p>

    <p>
      <strong>USGS Gauge:</strong>
      ${best.profile.gaugeLocation}
    </p>

    <p>
      <strong>Flow:</strong>
      ${formatFlow(best.readings.flow)}
    </p>

    <p>
      <strong>Fishing Flow Zone:</strong>
      ${best.evaluation.flowZoneIcon}
      ${best.evaluation.flowZoneLabel}
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
      <strong>Wading Recommendation:</strong>
      ${best.evaluation.wading.icon}
      ${best.evaluation.wading.label}
    </p>

    <p>
      <strong>Fishing Rating:</strong>
      ${formatFishingScore(
        best.evaluation.fishingScore
      )}
      ${fishingRating}
    </p>

    <p>
      <strong>Rating Basis:</strong>
      ${scoringBasis}
    </p>

    <p>
      🎣 <strong>First Fly:</strong>
      ${best.evaluation.suggestedFly}
    </p>

    <p>
      ${best.evaluation.guideNotes}
    </p>

    <p>
      <small>
        Dashboard checked:
        ${new Date().toLocaleString()}
      </small>
    </p>
  `;
}


/*
 * Describe which measurements contributed to the fishing score.
 */
function createScoringBasis(evaluation) {
  const factorNames = evaluation.factors.map(
    factor => factor.name
  );

  const includesFlow =
    factorNames.includes("flow");

  const includesTemperature =
    factorNames.includes("temperature");

  if (
    includesFlow &&
    includesTemperature
  ) {
    return "Flow and water temperature";
  }

  if (includesFlow) {
    return "Flow only — water temperature unavailable";
  }

  return "Insufficient live data";
}


/*
 * Convert the numerical score into a display label.
 */
function createFishingRating(score) {
  if (!Number.isFinite(score)) {
    return "⚪ Unavailable";
  }

  if (score >= 8.5) {
    return "— 🟢 Excellent";
  }

  if (score >= 7) {
    return "— 🟢 Very Good";
  }

  if (score >= 5.5) {
    return "— 🟡 Good";
  }

  if (score >= 4) {
    return "— 🟠 Fair";
  }

  return "— 🔴 Limited";
}


/*
 * Formatting helpers.
 */
function formatFishingScore(score) {
  return Number.isFinite(score)
    ? `${score.toFixed(1)} / 10`
    : "Not available";
}


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


function formatTimestamp(timestamp) {
  if (
    !(timestamp instanceof Date) ||
    Number.isNaN(timestamp.getTime())
  ) {
    return "Not reported";
  }

  return timestamp.toLocaleString();
}


function celsiusToFahrenheit(celsius) {
  return Number(
    (
      (celsius * 9 / 5) +
      32
    ).toFixed(1)
  );
}
