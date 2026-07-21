"use strict";

/*
 * River Guide Dashboard
 * Version 2.0 decision engine.
 *
 * Fishing quality and wading safety are evaluated separately.
 *
 * Fishing score:
 * - Flow only when water temperature is unavailable
 * - 70% flow and 30% temperature when temperature is available
 *
 * Wading safety:
 * - Uses the more conservative result from flow and gage height
 * - A dangerous fishing-flow zone automatically becomes
 *   Not Recommended for wading
 */

const WADING_LEVELS = Object.freeze({
  COMFORTABLE: 0,
  CAUTION: 1,
  EXPERIENCED: 2,
  NOT_RECOMMENDED: 3,
  UNKNOWN: 4
});

const WADING_LABELS = Object.freeze({
  [WADING_LEVELS.COMFORTABLE]: "Comfortable",
  [WADING_LEVELS.CAUTION]: "Use Caution",
  [WADING_LEVELS.EXPERIENCED]: "Experienced Waders Only",
  [WADING_LEVELS.NOT_RECOMMENDED]: "Not Recommended",
  [WADING_LEVELS.UNKNOWN]: "Conditions Unavailable"
});

const WADING_ICONS = Object.freeze({
  [WADING_LEVELS.COMFORTABLE]: "🟢",
  [WADING_LEVELS.CAUTION]: "🟡",
  [WADING_LEVELS.EXPERIENCED]: "🟠",
  [WADING_LEVELS.NOT_RECOMMENDED]: "🔴",
  [WADING_LEVELS.UNKNOWN]: "⚪"
});

const FLOW_ZONE_ICONS = Object.freeze({
  low: "🔵",
  optimal: "🟢",
  high: "🟠",
  dangerous: "🔴",
  unknown: "⚪"
});

/**
 * Determines whether a value is a usable finite number.
 */
function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Limits a score to the 0–10 range.
 */
function clampScore(score) {
  return Math.max(0, Math.min(10, score));
}

/**
 * Finds the fishing flow zone containing the current flow.
 */
function getFlowZone(flow, profile) {
  if (!isValidNumber(flow)) {
    return {
      min: null,
      max: null,
      score: null,
      label: "Conditions Unavailable",
      status: "unknown",
      icon: FLOW_ZONE_ICONS.unknown
    };
  }

  const zones = profile.fishing.flowZones;

  if (!Array.isArray(zones) || zones.length === 0) {
    throw new Error(
      `No fishing flow zones configured for ${profile.name}`
    );
  }

  const zone = zones.find(
    currentZone =>
      flow >= currentZone.min && flow <= currentZone.max
  );

  if (!zone) {
    return {
      min: null,
      max: null,
      score: null,
      label: "Unclassified",
      status: "unknown",
      icon: FLOW_ZONE_ICONS.unknown
    };
  }

  return {
    ...zone,
    icon:
      FLOW_ZONE_ICONS[zone.status] ||
      FLOW_ZONE_ICONS.unknown
  };
}

/**
 * Converts a configured 0–5 flow-zone score to a 0–10 score.
 */
function scoreFlow(flow, profile) {
  const zone = getFlowZone(flow, profile);

  if (!isValidNumber(zone.score)) {
    return null;
  }

  return clampScore(zone.score * 2);
}

/**
 * Scores water temperature from 0–10.
 */
function scoreTemperature(temperature, profile) {
  if (!isValidNumber(temperature)) {
    return null;
  }

  const preferred =
    profile.fishing.preferredTemperature;

  if (
    !preferred ||
    !isValidNumber(preferred.min) ||
    !isValidNumber(preferred.max)
  ) {
    return null;
  }

  const { min, max } = preferred;

  if (temperature >= min && temperature <= max) {
    return 10;
  }

  if (temperature < min) {
    return clampScore(
      10 - (min - temperature) * 0.7
    );
  }

  return clampScore(
    10 - (temperature - max) * 0.9
  );
}

/**
 * Rates flow for wading safety.
 */
function evaluateFlow(flow, profile) {
  if (!isValidNumber(flow)) {
    return WADING_LEVELS.UNKNOWN;
  }

  const thresholds = profile.wading.flow;

  if (flow >= thresholds.notRecommendedMin) {
    return WADING_LEVELS.NOT_RECOMMENDED;
  }

  if (flow > thresholds.cautionMax) {
    return WADING_LEVELS.EXPERIENCED;
  }

  if (flow > thresholds.comfortableMax) {
    return WADING_LEVELS.CAUTION;
  }

  return WADING_LEVELS.COMFORTABLE;
}

/**
 * Rates gage height for wading safety.
 */
function evaluateStage(stage, profile) {
  if (!isValidNumber(stage)) {
    return WADING_LEVELS.UNKNOWN;
  }

  const thresholds = profile.wading.stage;

  if (stage >= thresholds.notRecommendedMin) {
    return WADING_LEVELS.NOT_RECOMMENDED;
  }

  if (stage > thresholds.cautionMax) {
    return WADING_LEVELS.EXPERIENCED;
  }

  if (stage > thresholds.comfortableMax) {
    return WADING_LEVELS.CAUTION;
  }

  return WADING_LEVELS.COMFORTABLE;
}

/**
 * Returns the more conservative available wading rating.
 *
 * A dangerous fishing-flow zone overrides the normal wading
 * thresholds and produces a Not Recommended rating.
 */
function evaluateWading(profile, flow, stage, flowZone) {
  const flowLevel = evaluateFlow(flow, profile);
  const stageLevel = evaluateStage(stage, profile);

  const validLevels = [flowLevel, stageLevel].filter(
    level => level !== WADING_LEVELS.UNKNOWN
  );

  let finalLevel =
    validLevels.length > 0
      ? Math.max(...validLevels)
      : WADING_LEVELS.UNKNOWN;

  if (flowZone?.status === "dangerous") {
    finalLevel = WADING_LEVELS.NOT_RECOMMENDED;
  }

  return {
    level: finalLevel,
    label: WADING_LABELS[finalLevel],
    icon: WADING_ICONS[finalLevel],

    flowLevel,
    flowLabel: WADING_LABELS[flowLevel],

    stageLevel,
    stageLabel: WADING_LABELS[stageLevel],

    dangerousFlowOverride:
      flowZone?.status === "dangerous"
  };
}

/**
 * Produces the fishing-quality score.
 *
 * Temperature available:
 * - Flow: 70%
 * - Temperature: 30%
 *
 * Temperature unavailable:
 * - Flow alone determines the rating
 *
 * Wading is deliberately excluded from this score.
 */
function calculateFishingRating(profile, conditions) {
  const flowZone = getFlowZone(
    conditions.flow,
    profile
  );

  const flowScore = scoreFlow(
    conditions.flow,
    profile
  );

  const temperatureScore = scoreTemperature(
    conditions.temperature,
    profile
  );

  const wading = evaluateWading(
    profile,
    conditions.flow,
    conditions.stage,
    flowZone
  );

  if (flowScore === null) {
    return {
      score: null,
      flowZone,
      wading,
      factors: []
    };
  }

  const factors = [
    {
      name: "flow",
      score: flowScore,
      weight:
        temperatureScore === null ? 1 : 0.7
    }
  ];

  let finalScore = flowScore;

  if (temperatureScore !== null) {
    factors.push({
      name: "temperature",
      score: temperatureScore,
      weight: 0.3
    });

    finalScore =
      flowScore * 0.7 +
      temperatureScore * 0.3;
  }

  /*
   * Dangerous fishing flow always receives a zero,
   * regardless of water temperature.
   */
  if (flowZone.status === "dangerous") {
    finalScore = 0;
  }

  return {
    score: Number(
      clampScore(finalScore).toFixed(1)
    ),
    flowZone,
    wading,
    factors
  };
}

/**
 * Selects a suggested fly based on temperature and flow zone.
 */
function selectSuggestedFly(
  profile,
  conditions,
  flowZone
) {
  const flies = profile.flies || [];

  if (flies.length === 0) {
    return "No fly recommendation available";
  }

  /*
   * Favor a popper or other third-listed fly during
   * suitable warm-water conditions.
   */
  if (
    isValidNumber(conditions.temperature) &&
    conditions.temperature >= 68 &&
    conditions.temperature <= 75 &&
    flowZone.status === "optimal"
  ) {
    return flies[2] || flies[0];
  }

  /*
   * Favor the second-listed subsurface pattern
   * when water is high.
   */
  if (
    flowZone.status === "high" ||
    flowZone.status === "dangerous"
  ) {
    return flies[1] || flies[0];
  }

  return flies[0];
}

/**
 * Produces a basic condition summary.
 *
 * This property is retained for compatibility with the current
 * display code. More detailed Guide's Notes remain deferred.
 */
function createConditionSummary(
  profile,
  conditions,
  result
) {
  const notes = [];

  if (!isValidNumber(conditions.flow)) {
    notes.push("Current flow data is unavailable.");
  } else {
    notes.push(
      `Fishing flow is rated ${result.flowZone.label.toLowerCase()}.`
    );
  }

  if (!isValidNumber(conditions.temperature)) {
    notes.push(
      "The fishing rating is based on flow because water temperature is unavailable."
    );
  } else {
    notes.push(
      "The fishing rating includes flow and water temperature."
    );
  }

  if (
    result.wading.level ===
    WADING_LEVELS.NOT_RECOMMENDED
  ) {
    notes.push(
      "Wading is not recommended."
    );
  }

  return notes.join(" ");
}

/**
 * Evaluates one complete river observation.
 */
function evaluateRiver(riverId, conditions = {}) {
  const profile = RIVER_PROFILES[riverId];

  if (!profile) {
    throw new Error(
      `Unknown river profile: ${riverId}`
    );
  }

  const normalizedConditions = {
    flow: isValidNumber(conditions.flow)
      ? conditions.flow
      : null,

    stage: isValidNumber(conditions.stage)
      ? conditions.stage
      : null,

    temperature: isValidNumber(
      conditions.temperature
    )
      ? conditions.temperature
      : null
  };

  const rating = calculateFishingRating(
    profile,
    normalizedConditions
  );

  const suggestedFly = selectSuggestedFly(
    profile,
    normalizedConditions,
    rating.flowZone
  );

  const guideNotes = createConditionSummary(
    profile,
    normalizedConditions,
    rating
  );

  return {
    riverId,
    profile,
    conditions: normalizedConditions,

    fishingScore: rating.score,

    flowZone: rating.flowZone,
    flowZoneLabel: rating.flowZone.label,
    flowZoneStatus: rating.flowZone.status,
    flowZoneIcon: rating.flowZone.icon,

    wading: rating.wading,

    suggestedFly,
    guideNotes,

    factors: rating.factors,

    /*
     * Eligible for Best Choice Today only when:
     * - A fishing score exists
     * - Fishing flow is not dangerous
     * - Wading is not rated Not Recommended
     */
    bestChoiceEligible:
      isValidNumber(rating.score) &&
      rating.flowZone.status !== "dangerous" &&
      rating.wading.level !==
        WADING_LEVELS.NOT_RECOMMENDED
  };
}

/**
 * Selects the highest-rated safe and eligible river.
 */
function selectBestRiver(results) {
  if (!Array.isArray(results)) {
    return null;
  }

  const eligibleResults = results.filter(
    result =>
      result &&
      result.bestChoiceEligible === true &&
      isValidNumber(result.fishingScore)
  );

  if (eligibleResults.length === 0) {
    return null;
  }

  return eligibleResults.reduce(
    (best, current) => {
      if (
        current.fishingScore >
        best.fishingScore
      ) {
        return current;
      }

      /*
       * Tie-breaker:
       * Prefer the river with the safer wading rating.
       */
      if (
        current.fishingScore ===
          best.fishingScore &&
        current.wading.level <
          best.wading.level
      ) {
        return current;
      }

      return best;
    }
  );
}
