const rivers = [
    {
        name: "Clarion River",
        id: "clarion",
        site: "03029500",
        gauge: "Cooksburg"
    },
    {
        name: "Oil Creek",
        id: "oil",
        site: "03020500",
        gauge: "Rouseville"
    },
    {
        name: "French Creek",
        id: "french",
        site: "03023100",
        gauge: "Meadville"
    },
    {
        name: "Redbank Creek",
        id: "redbank",
        site: "03031882",
        gauge: "Brookville"
    },
    {
        name: "Allegheny River",
        id: "allegheny",
        site: "03025500",
        gauge: "Franklin"
    }
];


async function loadRiverData() {

    let bestRiver = null;
    let highestScore = 0;


    for (const river of rivers) {

        const display = document.getElementById(river.id);

        try {

            const url =
            `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${river.site}&parameterCd=00060,00065,00010`;

            const response = await fetch(url);
            const data = await response.json();


            let flow = null;
            let height = null;
            let temp = null;


            data.value.timeSeries.forEach(series => {

                const code =
                series.variable.variableCode[0].value;

                const value =
                Number(series.values[0].value[0].value);


                if (code === "00060") flow = value;

                if (code === "00065") height = value;

                if (code === "00010") {
                    temp = ((value * 9 / 5) + 32).toFixed(1);
                }

            });


            const conditions =
            evaluateConditions(flow, height, temp);


            if (
                conditions.totalScore > highestScore &&
                conditions.wadeStatus !== "🔴 Unsafe"
            ) {

                highestScore = conditions.totalScore;

                bestRiver = {
                    name: river.name,
                    gauge: river.gauge,
                    flow,
                    height,
                    temp,
                    score: conditions.fishingScore,
                    rating: conditions.rating,
                    wadeStatus: conditions.wadeStatus,
                    note: conditions.note
                };

            }


            display.innerHTML =

            `
            <strong>USGS Gauge:</strong> ${river.gauge}

            <br>

            <strong>Flow:</strong> ${flow ?? "N/A"} CFS

            <br>

            <strong>Gage Height:</strong>
            ${height ? height.toFixed(2) : "N/A"} ft

            <br>

            <strong>Water Temp:</strong>
            ${temp ? temp + "°F" : "Not reported"}

            <br>

            <strong>Wade Safety:</strong>
            ${conditions.wadeStatus}

            <br>

            <strong>Fishing:</strong>
            ${conditions.rating}
            `;


        } catch(error) {

            display.innerHTML =
            "⚠️ Data unavailable";

            console.log(river.name, error);

        }

    }


    updateRecommendation(bestRiver);

}



function evaluateConditions(flow, height, temp) {

    let score = 5;


    let wadeStatus;
    let note;


    if (
        flow !== null &&
        flow <= 900 &&
        height !== null &&
        height <= 4
    ) {

        wadeStatus = "🟢 Good";
        note = "Normal wading conditions.";

    }

    else if (
        flow !== null &&
        flow <= 1400 &&
        height !== null &&
        height <= 5
    ) {

        wadeStatus = "🟡 Caution";
        note = "Limit crossings and use care.";

        score -= 1;

    }

    else {

        wadeStatus = "🔴 Unsafe";
        note = "Avoid normal wading.";

        score -= 3;

    }



    if (flow >= 250 && flow <= 700)
        score += 3;

    else if (flow > 700 && flow <= 1200)
        score += 1;


    if (temp !== null) {

        if (temp >= 65 && temp <= 75)
            score += 2;

    }


    let rating =
    score >= 9 ? "🟢 Excellent" :
    score >= 7 ? "🟡 Good" :
    "🔴 Limited";


    return {

        totalScore: score,
        fishingScore: score,
        rating,
        wadeStatus,
        note

    };

}



function updateRecommendation(river) {

    const box =
    document.getElementById("bestRiver");


    if (!river) {

        box.innerHTML =
        "No safe wading options found.";

        return;

    }


    box.innerHTML =

    `
    🥇 <strong>${river.name}</strong>

    <br><br>

    <strong>USGS Gauge:</strong>
    ${river.gauge}

    <br>

    <strong>Wade Safety:</strong>
    ${river.wadeStatus}

    <br>

    <strong>Smallmouth Index:</strong>
    ${river.score}/10

    <br><br>

    Flow:
    ${river.flow} CFS

    <br>

    Gage Height:
    ${river.height ? river.height.toFixed(2) : "N/A"} ft

    <br>

    Water Temp:
    ${river.temp ? river.temp + "°F" : "Not reported"}

    <br><br>

    🎣 First Fly:
    Purple Woolly Bugger

    <br>

    Backup:
    White Clouser Minnow

    <br><br>

    ${river.note}

    <br><br>

    Updated:
    ${new Date().toLocaleTimeString()}
    `;

}



document.addEventListener(
"DOMContentLoaded",
loadRiverData
);
