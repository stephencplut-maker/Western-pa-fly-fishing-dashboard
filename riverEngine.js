"use strict";

/*
 * River Guide Dashboard
 * Version 1.2A decision engine.
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

/**
 * Determines whether a value is a usable number.
 */
function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Rates flow using one river's profile.
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
 * Rates gage height using one river's profile.
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
 * Returns the more conservative available safety rating.
 *
 * UNKNOWN does not override a valid reading. If only one measurement
 * is available, the available measurement determines the rating.
 */
function evaluateWading(profile, flow, stage) {
  const flowLevel = evaluateFlow(flow, profile);
  const stageLevel = evaluateStage(stage, profile);

  const validLevels = [flowLevel, stageLevel].filter(
    level => level !== WADING_LEVELS.UNKNOWN
  );

  const finalLevel =
    validLevels.length > 0
      ? Math.max(...validLevels)
      : WADING_LEVELS.UNKNOWN;

  return {
    level: finalLevel,
    label: WADING_LABELS[finalLevel],
    icon: WADING_ICONS[finalLevel],
    flowLevel,
    flowLabel: WADING_LABELS[flowLevel],
    stageLevel,
    stageLabel: WADING_LABELS[stageLevel]
  };
}

/**
 * Scores how closely flow matches the preferred fishing range.
 * Returns a value from 0 to 10.
 */
function scoreFlow(flow, profile) {
  if (!isValidNumber(flow)) {
    return null;
  }

  const { min, max } = profile.fishing.idealFlow;

  if (flow >= min && flow <= max) {
    return 10;
  }

  if (flow < min) {
    const ratio = flow / min;
    return clampScore(10 * ratio);
  }

  const excessRatio = (flow - max) / max;
  return clampScore(10 - excessRatio * 10);
}

/**
 * Scores water temperature for warm-water fishing.
 * Returns a value from 0 to 10.
 */
function scoreTemperature(temperature, profile) {
  if (!isValidNumber(temperature)) {
    return null;
  }

  const { min, max } = profile.fishing.preferredTemperature;

  if (temperature >= min && temperature <= max) {
    return 10;
  }

  if (temperature < min) {
    return clampScore(10 - (min - temperature) * 0.7);
  }

  return clampScore(10 - (temperature - max) * 0.9);
}

/**
 * Converts the wading recommendation into a score.
 */
function scoreWading(wadingLevel) {
  switch (wadingLevel) {
    case WADING_LEVELS.COMFORTABLE:
      return 10;

    case WADING_LEVELS.CAUTION:
      return 7;

    case WADING_LEVELS.EXPERIENCED:
      return 4;

    case WADING_LEVELS.NOT_RECOMMENDED:
      return 0;

    default:
      return null;
  }
}

/**
 * Produces a 0–10 fishing rating.
 *
 * Available factors are automatically reweighted when temperature
 * or another measurement is unavailable.
 */
function calculateFishingRating(profile, conditions) {
  const wading = evaluateWading(
    profile,
    conditions.flow,
    conditions.stage
  );

  const factors = [
    {
      name: "flow",
      score: scoreFlow(conditions.flow, profile),
      weight: 0.55
    },
    {
      name: "temperature",
      score: scoreTemperature(conditions.temperature, profile),
      weight: 0.25
    },
    {
      name: "wading",
      score: scoreWading(wading.level),
      weight: 0.2
    }
  ].filter(factor => factor.score !== null);

  if (factors.length === 0) {
    return {
      score: null,
      wading,
      factors: []
    };
  }

  const totalWeight = factors.reduce(
    (sum, factor) => sum + factor.weight,
    0
  );

  const weightedScore = factors.reduce(
    (sum, factor) => sum + factor.score * factor.weight,
    0
  );

  let finalScore = weightedScore / totalWeight;

  /*
   * A dangerous river should never become Best Choice Today merely
   * because its temperature and flow otherwise appear attractive.
   */
  if (wading.level === WADING_LEVELS.NOT_RECOMMENDED) {
    finalScore = Math.min(finalScore, 3);
  }

  return {
    score: Number(clampScore(finalScore).toFixed(1)),
    wading,
    factors
  };
}

/**
 * Selects a suggested fly based on temperature and conditions.
 */
function selectSuggestedFly(profile, conditions) {
  const flies = profile.flies;

  if (
    isValidNumber(conditions.temperature) &&
    conditions.temperature >= 68 &&
    conditions.temperature <= 75
  ) {
    return flies[2] || flies[0];
  }

  if (
    isValidNumber(conditions.flow) &&
    conditions.flow > profile.fishing.idealFlow.max
  ) {
    return flies[1] || flies[0];
  }

  return flies[0];
}

/**
 * Generates a concise guide-style explanation.
 */
function createGuideNotes(profile, conditions, result) {
  const notes = [];

  const flowScore = scoreFlow(conditions.flow, profile);
  const temperatureScore = scoreTemperature(
    conditions.temperature,
    profile
  );

  if (!isValidNumber(conditions.flow)) {
    notes.push("Current flow data is unavailable.");
  } else if (flowScore >= 9) {
    notes.push("Flow is in the preferred fishing range.");
  } else if (conditions.flow < profile.fishing.idealFlow.min) {
    notes.push("Flow is below the preferred range.");
  } else {
    notes.push("Flow is above the preferred range.");
  }

  if (!isValidNumber(conditions.temperature)) {
    notes.push("Water temperature is unavailable.");
  } else if (temperatureScore >= 9) {
    notes.push("Water temperature is excellent.");
  } else if (
    conditions.temperature <
    profile.fishing.preferredTemperature.min
  ) {
    notes.push("Cool water may slow smallmouth activity.");
  } else {
    notes.push("Warm water favors fishing early or late in the day.");
  }

  switch (result.wading.level) {
    case WADING_LEVELS.COMFORTABLE:
      notes.push("Wading conditions are comfortable.");
      break;

    case WADING_LEVELS.CAUTION:
      notes.push("Use caution while wading.");
      break;

    case WADING_LEVELS.EXPERIENCED:
      notes.push("Wading is appropriate only for experienced anglers.");
      break;

    case WADING_LEVELS.NOT_RECOMMENDED:
      notes.push("Wading is not recommended under current conditions.");
      break;

    default:
      notes.push("Confirm conditions before entering the water.");
  }

  return notes.join(" ");
}

/**
 * Evaluates one complete river observation.
 */
function evaluateRiver(riverId, conditions) {
  const profile = RIVER_PROFILES[riverId];

  if (!profile) {
    throw new Error(`Unknown river profile: ${riverId}`);
  }

  const rating = calculateFishingRating(profile, conditions);
  const suggestedFly = selectSuggestedFly(profile, conditions);
  const guideNotes = createGuideNotes(
    profile,
    conditions,
    rating
  );

  return {
    riverId,
    profile,
    conditions,
    fishingScore: rating.score,
    wading: rating.wading,
    suggestedFly,
    guideNotes
  };
}

/**
 * Selects the highest-rated river that has a valid score.
 */
function selectBestRiver(results) {
  const validResults = results.filter(
    result => isValidNumber(result.fishingScore)
  );

  if (validResults.length === 0) {
    return null;
  }

  return validResults.reduce((best, current) => {
    return current.fishingScore > best.fishingScore
      ? current
      : best;
  });
}

function clampScore(score) {
  return Math.max(0, Math.min(10, score));
}
