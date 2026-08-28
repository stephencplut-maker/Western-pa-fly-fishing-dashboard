"use strict";

/*
 * Western PA Fly Fishing Dashboard
 *
 * Version 2.0
 *
 * Primary purpose:
 * Determine which rivers can safely be waded today
 * using river-specific USGS flow and gage-height
 * thresholds.
 *
 * This version intentionally does NOT attempt to predict
 * fishing quality or produce a numerical fishing score.
 *
 * The angler decides how good the fishing is likely to be
 * based on season, weather, water temperature, experience,
 * and personal knowledge.
 */

const USGS_PARAMETER_CODES = {
  flow: "00060",
  stage: "00065",
  temperature: "00010"
};


/*
 * Load river conditions after the page is ready.
 */
document.addEventListener(
  "DOMContentLoaded",
  loadRiverData
);


/*
 * Retrieve and display all configured rivers.
 */
async function loadRiverData() {

  const profiles =
    Object.values(RIVER_PROFILES);

  const results =
    await Promise.all(
      profiles.map(loadSingleRiver)
    );

  const availableResults =
    results.filter(
      result => result !== null
    );

  updateRecommendation(
    availableResults
  );
}


/*
 * Retrieve USGS data for one river.
 */
async function loadSingleRiver(profile) {

  const display =
    document.getElementById(profile.id);

  if (!display) {

    console.warn(
      `No HTML element found for river ID: ${profile.id}`
    );

    return null;
  }

  try {

    const readings =
      await fetchUsgsReadings(
        profile.gaugeId
      );

    const evaluation =
      evaluateRiverConditions(
        profile,
        readings.flow,
        readings.stage
      );

    display.innerHTML =
      createRiverCardContent(
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

  const response =
    await fetch(url);

  if (!response.ok) {

    throw new Error(
      `USGS request failed with status ${response.status}`
    );
  }

  const data =
    await response.json();

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
      series?.variable
        ?.variableCode?.[0]?.value;

    const latestValue =
      series?.values?.[0]
        ?.value?.[0];

    if (!latestValue) {
      continue;
    }

    const numericValue =
      Number(latestValue.value);

    if (!Number.isFinite(numericValue)) {
      continue;
    }


    if (
      parameterCode ===
      USGS_PARAMETER_CODES.flow
    ) {

      readings.flow =
        numericValue;
    }


    if (
      parameterCode ===
      USGS_PARAMETER_CODES.stage
    ) {

      readings.stage =
        numericValue;
    }


    if (
      parameterCode ===
      USGS_PARAMETER_CODES.temperature
    ) {

      readings.temperature =
        celsiusToFahrenheit(
          numericValue
        );
    }


    if (
      latestValue.dateTime &&
      !readings.timestamp
    ) {

      readings.timestamp =
        new Date(
          latestValue.dateTime
        );
    }
  }

  return readings;
}


/*
 * Evaluate river wading conditions.
 *
 * Flow and gage height are evaluated independently.
 *
 * The more conservative result always wins.
 */
function evaluateRiverConditions(
  profile,
  flow,
  stage
) {

  const flowRating =
    evaluateThreshold(
      flow,
      profile.wading.flow
    );


  const stageRating =
    evaluateThreshold(
      stage,
      profile.wading.stage
    );


  const wading =
    chooseMoreConservativeRating(
      flowRating,
      stageRating
    );


  return {
    flowRating,
    stageRating,
    wading
  };
}


/*
 * Convert a current reading into one of the
 * four river-specific wading safety levels.
 *
 * Level 1 = Comfortable
 * Level 2 = Use Caution
 * Level 3 = Experienced Waders Only
 * Level 4 = Not Recommended
 *
 * Level 0 = Not Available
 */
function evaluateThreshold(
  value,
  thresholds
) {

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


  if (
    value <=
    thresholds.comfortableMax
  ) {

    return {
      level: 1,
      label: "🟢 Comfortable"
    };
  }


  if (
    value <=
    thresholds.cautionMax
  ) {

    return {
      level: 2,
      label: "🟡 Use Caution"
    };
  }


  if (
    value <=
    thresholds.experiencedMax
  ) {

    return {
      level: 3,
      label:
        "🟠 Experienced Waders Only"
    };
  }


  return {
    level: 4,
    label:
      "🔴 Not Recommended"
  };
}


/*
 * If flow and stage disagree, use the
 * more conservative rating.
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


  return flowRating.level >=
    stageRating.level
    ? flowRating
    : stageRating;
}


/*
 * Create the information displayed inside
 * each river card.
 */
function createRiverCardContent(
  profile,
  readings,
  evaluation
) {

  const updatedTime =
    readings.timestamp
      ? readings.timestamp.toLocaleString()
      : "Not reported";


  let availabilityMessage;


  switch (
    evaluation.wading.level
  ) {

    case 1:

      availabilityMessage =
        `
        <p>
          <strong>Wading Status:</strong>
          🟢 <strong>AVAILABLE</strong>
        </p>
        `;

      break;


    case 2:

      availabilityMessage =
        `
        <p>
          <strong>Wading Status:</strong>
          🟡 <strong>AVAILABLE — USE CAUTION</strong>
        </p>
        `;

      break;


    case 3:

      availabilityMessage =
        `
        <p>
          <strong>Wading Status:</strong>
          🟠 <strong>AVAILABLE — EXPERIENCED WADERS</strong>
        </p>
        `;

      break;


    case 4:

      availabilityMessage =
        `
        <p>
          <strong>Wading Status:</strong>
          🔴 <strong>NOT AVAILABLE FOR NORMAL WADING</strong>
        </p>
        `;

      break;


    default:

      availabilityMessage =
        `
        <p>
          <strong>Wading Status:</strong>
          ⚪ <strong>UNABLE TO DETERMINE</strong>
        </p>
        `;
  }


  return `

    ${availabilityMessage}

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
      ${formatTemperature(
        readings.temperature
      )}
    </p>

    <p>
      <strong>Wading Recommendation:</strong>
      ${evaluation.wading.label}
    </p>

    <p>
      <strong>Suggested Fly:</strong>
      ${selectSuggestedFly(profile)}
    </p>

    <p>
      <small>
        USGS updated:
        ${updatedTime}
      </small>
    </p>

  `;
}


/*
 * Select a simple first-choice fly.
 *
 * This is NOT a fishing prediction.
 * It is simply the first fly listed in
 * the river's profile.
 */
function selectSuggestedFly(profile) {

  const flies =
    profile.flies ?? [];

  if (
    flies.length === 0
  ) {

    return "Purple Woolly Bugger";
  }

  return flies[0];
}


/*
 * Update the top-of-page recommendation.
 *
 * The purpose is now to answer:
 *
 * "Which rivers can I safely wade today?"
 *
 * No fishing score is used.
 */
function updateRecommendation(
  results
) {

  const box =
    document.getElementById(
      "bestRiver"
    );

  if (!box) {
    return;
  }


  const comfortable =
    results.filter(
      result =>
        result.evaluation.wading.level === 1
    );


  const caution =
    results.filter(
      result =>
        result.evaluation.wading.level === 2
    );


  const experienced =
    results.filter(
      result =>
        result.evaluation.wading.level === 3
    );


  const notRecommended =
    results.filter(
      result =>
        result.evaluation.wading.level === 4
    );


  let html = "";


  html += `
    <h3>
      🟢 Rivers Available for Wading
    </h3>
  `;


  if (
    comfortable.length === 0 &&
    caution.length === 0 &&
    experienced.length === 0
  ) {

    html += `
      <p>
        No rivers currently meet the
        available wading criteria.
      </p>
    `;

  } else {


    if (
      comfortable.length > 0
    ) {

      html += `
        <p>
          <strong>
            🟢 Comfortable
          </strong>
        </p>
      `;

      for (
        const result
        of comfortable
      ) {

        html += `
          <p>
            <strong>
              ${result.profile.name}
            </strong>
            —
            ${formatFlow(
              result.readings.flow
            )}
          </p>
        `;
      }
    }


    if (
      caution.length > 0
    ) {

      html += `
        <p>
          <strong>
            🟡 Use Caution
          </strong>
        </p>
      `;

      for (
        const result
        of caution
      ) {

        html += `
          <p>
            <strong>
              ${result.profile.name}
            </strong>
            —
            ${formatFlow(
              result.readings.flow
            )}
          </p>
        `;
      }
    }


    if (
      experienced.length > 0
    ) {

      html += `
        <p>
          <strong>
            🟠 Experienced Waders Only
          </strong>
        </p>
      `;

      for (
        const result
        of experienced
      ) {

        html += `
          <p>
            <strong>
              ${result.profile.name}
            </strong>
            —
            ${formatFlow(
              result.readings.flow
            )}
          </p>
        `;
      }
    }
  }


  if (
    notRecommended.length > 0
  ) {

    html += `
      <hr>

      <p>
        <strong>
          🔴 Not Recommended
        </strong>
      </p>
    `;


    for (
      const result
      of notRecommended
    ) {

      html += `
        <p>
          <strong>
            ${result.profile.name}
          </strong>
          —
          ${formatFlow(
            result.readings.flow
          )}
        </p>
      `;
    }
  }


  html += `
    <p>
      <small>
        Wading status is based on the
        more conservative of flow and
        gage-height conditions.
      </small>
    </p>

    <p>
      <small>
        Dashboard checked:
        ${new Date().toLocaleTimeString()}
      </small>
    </p>
  `;


  box.innerHTML = html;
}


/*
 * Formatting helpers.
 */
function formatFlow(flow) {

  return Number.isFinite(flow)
    ? `${Math.round(
        flow
      ).toLocaleString()} CFS`
    : "Not reported";
}


function formatStage(stage) {

  return Number.isFinite(stage)
    ? `${stage.toFixed(2)} ft`
    : "Not reported";
}


function formatTemperature(
  temperature
) {

  return Number.isFinite(
    temperature
  )
    ? `${temperature.toFixed(1)}°F`
    : "Not reported";
}


function celsiusToFahrenheit(
  celsius
) {

  return Number(
    (
      (celsius * 9 / 5) +
      32
    ).toFixed(1)
  );
}
