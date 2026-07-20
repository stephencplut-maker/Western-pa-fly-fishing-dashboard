"use strict";

/*
 * River Guide Dashboard
 * River-specific profiles and thresholds.
 *
 * This file contains configuration data only.
 * Decision logic belongs in riverEngine.js.
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
      idealFlow: {
        min: 300,
        max: 500
      },

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

      stage: {
        comfortableMax: 2.3,
        cautionMax: 2.7,
        experiencedMax: 3.09,
        notRecommendedMin: 3.1
      }
    },

    fishing: {
      idealFlow: {
        min: 200,
        max: 400
      },

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
      flow: {
        comfortableMax: 99,
        cautionMax: 250,
        experiencedMax: 400,
        notRecommendedMin: 401
      },

      stage: {
        comfortableMax: 1.19,
        cautionMax: 1.5,
        experiencedMax: 1.8,
        notRecommendedMin: 1.81
      }
    },

    fishing: {
      idealFlow: {
        min: 60,
        max: 150
      },

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
      idealFlow: {
        min: 100,
        max: 300
      },

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
      idealFlow: {
        min: 50,
        max: 120
      },

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
      idealFlow: {
        min: 900,
        max: 1800
      },

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
  }
};
