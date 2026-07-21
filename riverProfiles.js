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
  }
});
