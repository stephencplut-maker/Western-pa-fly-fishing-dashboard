"use strict";
/*
 * River Guide Dashboard
 * River-specific profiles and thresholds.
 *
 * The dashboard's primary purpose is to identify bodies
 * of water that can currently be safely waded.
 *
 * Fishing flow zones are retained as reference data but
 * are NOT used to calculate a numerical fishing rating.
 */
const RIVER_PROFILES = {
  clarion: {
    id: "clarion",
    name: "Clarion River",
    gaugeId: "03029500",
    gaugeLocation: "Cooksburg, PA",
    target: "Smallmouth Bass",
    wading: {
      flow: {
        comfortableMax: 500,
        cautionMax: 600,
        experiencedMax: 699,
        notRecommendedMin: 700
      },
      stage: {
        comfortableMax: 2.5,
        cautionMax: 2.75,
        experiencedMax: 3.05,
        notRecommendedMin: 3.06
      }
    },
    fishing: {
      flowZones: [
        {
          min: 0,
          max: 249,
          score: 1,
          label: "Poor",
          status: "low"
        },
        {
          min: 250,
          max: 500,
          score: 5,
          label: "Good to Optimal",
          status: "optimal"
        },
        {
          min: 501,
          max: 600,
          score: 2,
          label: "High but Poor",
          status: "high"
        },
        {
          min: 601,
          max: Infinity,
          score: 0,
          label: "Dangerous",
          status: "dangerous"
        }
      ],
      preferredTemperature: {
        min: 64,
        max: 72
      }
    },
    flies: [
      "Purple Woolly Bugger",
      "Olive Clouser Minnow",
      "Black Bass Popper"
    ]
  },
  oil: {
    id: "oil",
    name: "Oil Creek",
    gaugeId: "03020500",
    gaugeLocation: "Rouseville, PA",
    target: "Smallmouth Bass / Trout",
    wading: {
      flow: {
        comfortableMax: 400,
        cautionMax: 600,
        experiencedMax: 699,
        notRecommendedMin: 700
      },
      /*
       * Revised from actual field observation:
       * 220 CFS / 2.64 ft was easily wadable.
       */
      stage: {
        comfortableMax: 3.0,
        cautionMax: 3.5,
        experiencedMax: 4.0,
        notRecommendedMin: 4.01
      }
    },
    fishing: {
      flowZones: [
        {
          min: 0,
          max: 200,
          score: 1,
          label: "Poor",
          status: "low"
        },
        {
          min: 201,
          max: 400,
          score: 5,
          label: "Good to Optimal",
          status: "optimal"
        },
        {
          min: 401,
          max: 500,
          score: 2,
          label: "High but Poor",
          status: "high"
        },
        {
          min: 501,
          max: Infinity,
          score: 0,
          label: "Dangerous",
          status: "dangerous"
        }
      ],
      preferredTemperature: {
        min: 60,
        max: 70
      }
    },
    flies: [
      "Purple Woolly Bugger",
      "Olive Clouser Minnow",
      "Muddler Minnow"
    ]
  },
  tionesta: {
    id: "tionesta",
    name: "Tionesta Creek",
    gaugeId: "03017500",
    gaugeLocation: "Kelletville, PA",
    target: "Smallmouth Bass / Trout",
    wading: {
      /*
       * Temporary thresholds based on the Oil Creek
       * baseline. These will be field-tested and
       * adjusted using actual Tionesta observations.
       */
      flow: {
        comfortableMax: 400,
        cautionMax: 600,
        experiencedMax: 699,
        notRecommendedMin: 700
      },
      stage: {
        comfortableMax: 3.0,
        cautionMax: 3.5,
        experiencedMax: 4.0,
        notRecommendedMin: 4.01
      }
    },
    fishing: {
      flowZones: [
        {
          min: 0,
          max: 149,
          score: 1,
          label: "Poor",
          status: "low"
        },
        {
          min: 150,
          max: 400,
          score: 5,
          label: "Good to Optimal",
          status: "optimal"
        },
        {
          min: 401,
          max: 500,
          score: 2,
          label: "High but Poor",
          status: "high"
        },
        {
          min: 501,
          max: Infinity,
          score: 0,
          label: "Dangerous",
          status: "dangerous"
        }
      ],
      preferredTemperature: {
        min: 58,
        max: 68
      }
    },
    flies: [
      "Purple Woolly Bugger",
      "Olive Woolly Bugger",
      "Black Bass Popper"
    ]
  },
  french: {
    id: "french",
    name: "French Creek",
    gaugeId: "03023100",
    gaugeLocation: "Meadville, PA",
    target: "Smallmouth Bass",
    wading: {
      flow: {
        minimumPreferred: 100,
        comfortableMax: 300,
        cautionMax: 500,
        experiencedMax: 599,
        notRecommendedMin: 600
      },
      stage: {
        comfortableMax: 2.0,
        cautionMax: 2.8,
        experiencedMax: 2.99,
        notRecommendedMin: 3.0
      }
    },
    fishing: {
      flowZones: [
        {
          min: 0,
          max: 199,
          score: 1,
          label: "Poor",
          status: "low"
        },
        {
          min: 200,
          max: 500,
          score: 5,
          label: "Good to Optimal",
          status: "optimal"
        },
        {
          min: 501,
          max: 600,
          score: 2,
          label: "High but Poor",
          status: "high"
        },
        {
          min: 601,
          max: Infinity,
          score: 0,
          label: "Dangerous",
          status: "dangerous"
        }
      ],
      preferredTemperature: {
        min: 64,
        max: 72
      }
    },
    flies: [
      "Olive Clouser Minnow",
      "Purple Woolly Bugger",
      "Chartreuse Woolly Bugger"
    ]
  },
  redbank: {
    id: "redbank",
    name: "Redbank Creek",
    gaugeId: "03031882",
    gaugeLocation: "Brookville, PA",
    target: "Smallmouth Bass",
    wading: {
      flow: {
        minimumPreferred: 50,
        comfortableMax: 120,
        cautionMax: 180,
        experiencedMax: 199,
        notRecommendedMin: 200
      },
      stage: {
        comfortableMax: 6.1,
        cautionMax: 6.4,
        experiencedMax: 6.49,
        notRecommendedMin: 6.5
      }
    },
    fishing: {
      flowZones: [
        {
          min: 0,
          max: 79,
          score: 1,
          label: "Poor",
          status: "low"
        },
        {
          min: 80,
          max: 200,
          score: 5,
          label: "Good to Optimal",
          status: "optimal"
        },
        {
          min: 201,
          max: 250,
          score: 2,
          label: "High but Poor",
          status: "high"
        },
        {
          min: 251,
          max: Infinity,
          score: 0,
          label: "Dangerous",
          status: "dangerous"
        }
      ],
      preferredTemperature: {
        min: 64,
        max: 72
      }
    },
    flies: [
      "Purple Woolly Bugger",
      "Olive Clouser Minnow",
      "Green Frog Popper"
    ]
  },
  allegheny: {
    id: "allegheny",
    name: "Allegheny River",
    gaugeId: "03025500",
    gaugeLocation: "Franklin, PA",
    target: "Smallmouth Bass",
    wading: {
      flow: {
        comfortableMax: 1800,
        cautionMax: 3000,
        experiencedMax: 4499,
        notRecommendedMin: 4500
      },
      stage: {
        comfortableMax: 2.7,
        cautionMax: 3.2,
        experiencedMax: 3.69,
        notRecommendedMin: 3.7
      }
    },
    fishing: {
      flowZones: [
        {
          min: 0,
          max: 1799,
          score: 1,
          label: "Poor",
          status: "low"
        },
        {
          min: 1800,
          max: 3500,
          score: 5,
          label: "Good to Optimal",
          status: "optimal"
        },
        {
          min: 3501,
          max: 4500,
          score: 2,
          label: "High but Poor",
          status: "high"
        },
        {
          min: 4501,
          max: Infinity,
          score: 0,
          label: "Dangerous",
          status: "dangerous"
        }
      ],
      preferredTemperature: {
        min: 64,
        max: 72
      }
    },
    flies: [
      "Olive Clouser Minnow",
      "Purple Woolly Bugger",
      "Large Bass Popper"
    ]
  },
  pine: {
    id: "pine",
    name: "Pine Creek",
    gaugeId: "01548500",
    gaugeLocation: "Cedar Run, PA",
    target: "Smallmouth Bass / Trout",
    wading: {
      /*
       * Pine Creek at Cedar Run.
       *
       * Primary field-based flow thresholds:
       *
       * <500 CFS      = Comfortable
       * 500-900 CFS   = Use Caution
       * 901-1400 CFS  = Experienced Waders Only
       * >1400 CFS     = Not Recommended
       *
       * The 1400+ CFS cutoff is intentionally conservative.
       * Although published guidance identifies 3000+ CFS as
       * completely unsafe, wading becomes increasingly
       * difficult well before that level.
       */
      flow: {
        comfortableMax: 499,
        cautionMax: 900,
        experiencedMax: 1400,
        notRecommendedMin: 1401
      },
      /*
       * Stage is retained as a secondary safety indicator.
       *
       * USGS records show that the current flow/stage
       * relationship does not correspond exactly to the
       * approximate stage figures supplied for the flow
       * thresholds. For example, recent USGS data showed
       * approximately 476 CFS at 2.02 ft.
       *
       * These temporary thresholds therefore avoid allowing
       * stage alone to make normal low-flow conditions appear
       * unnecessarily dangerous.
       *
       * These should be field-tested and refined.
       */
      stage: {
        comfortableMax: 2.0,
        cautionMax: 3.0,
        experiencedMax: 4.5,
        notRecommendedMin: 4.51
      }
    },
    fishing: {
      flowZones: [
        {
          min: 0,
          max: 499,
          score: 1,
          label: "Poor",
          status: "low"
        },
        {
          min: 500,
          max: 900,
          score: 5,
          label: "Good to Optimal",
          status: "optimal"
        },
        {
          min: 901,
          max: 1400,
          score: 2,
          label: "High but Poor",
          status: "high"
        },
        {
          min: 1401,
          max: Infinity,
          score: 0,
          label: "Dangerous",
          status: "dangerous"
        }
      ],
      preferredTemperature: {
        min: 60,
        max: 70
      }
    },
    flies: [
      "Purple Woolly Bugger",
      "Olive Clouser Minnow",
      "Black Bass Popper"
    ]
  }
};
