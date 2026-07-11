const rivers = [
    {
        name: "Clarion River",
        id: "clarion",
        site: "03029500",
        fly: "Purple Woolly Bugger"
    },
    {
        name: "Oil Creek",
        id: "oil",
        site: "03024000",
        fly: "Olive Woolly Bugger"
    },
    {
        name: "French Creek",
        id: "french",
        site: "03027500",
        fly: "White Clouser Minnow"
    },
    {
        name: "Redbank Creek",
        id: "redbank",
        site: "03029000",
        fly: "Black Woolly Bugger"
    },
    {
        name: "Allegheny River",
        id: "allegheny",
        site: "03020500",
        fly: "Chartreuse Clouser Minnow"
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
                    temp = ((value * 9/5) + 32).toFixed(1);
                }

            });


            const analysis =
            analyzeConditions(flow, height, temp);


            if (analysis.score > highestScore) {

                highestScore = analysis.score;

                bestRiver = {
                    name: river.name,
                    flow,
                    height,
                    temp,
                    fly: river.fly,
                    score: analysis.score,
                    rating: analysis.rating,
                    summary: analysis.summary
                };

            }


            display.innerHTML =
            `
            <strong>Flow:</strong> ${flow ?? "N/A"} CFS
            <br>

            <strong>Gage Height:</strong> ${height ? height.toFixed(2) : "N/A"} ft
            <br>

            <strong>Water Temp:</strong> ${temp ?? "Not reported"}
            <br>

            <strong>Outlook:</strong> ${analysis.rating}
            <br>

            ${analysis.summary}

            <br><br>

            <strong>Try:</strong> ${river.fly}
            `;


        }

        catch(error) {

            display.innerHTML =
            "⚠️ Data unavailable";

            console.log(river.name,error);

        }

    }


    updateRecommendation(bestRiver);

}



function analyzeConditions(flow,height,temp) {

    let score = 5;
    let comments = [];


    // Flow assessment

    if (flow >= 250 && flow <= 700) {

        score += 3;

        comments.push(
            "Flow is in a strong wading range."
        );

    }

    else if (flow > 700 && flow <= 1200) {

        score += 1;

        comments.push(
            "Higher water favors larger streamers."
        );

    }

    else {

        score -= 2;

        comments.push(
            "Flow is outside the prime range."
        );

    }



    // Temperature assessment

    if (temp) {

        temp = Number(temp);

        if (temp >= 65 && temp <= 75) {

            score += 2;

            comments.push(
                "Water temperature is ideal for active smallmouth."
            );

        }

        else if (temp < 60) {

            comments.push(
                "Cool water may require slower presentations."
            );

        }

    }

    else {

        comments.push(
            "No live temperature sensor available."
        );

    }



    let rating;


    if (score >= 9) rating = "🟢 Excellent";

    else if (score >= 7) rating = "🟡 Good";

    else rating = "🔴 Limited";



    return {

        score,

        rating,

        summary:
        comments.join(" ")

    };

}



function updateRecommendation(river) {

    const box =
    document.getElementById("bestRiver");


    if (!river) {

        box.innerHTML =
        "No recommendation available.";

        return;

    }


    box.innerHTML =
    `
    🥇 <strong>${river.name}</strong>

    <br><br>

    <strong>Smallmouth Index:</strong>
    ${river.score}/10

    <br>

    ${river.rating}

    <br><br>

    ${river.summary}

    <br><br>

    Flow:
    ${river.flow ?? "N/A"} CFS

    <br>

    Gage Height:
    ${river.height ? river.height.toFixed(2) : "N/A"} ft

    <br>

    Water Temp:
    ${river.temp ?? "Not reported"}

    <br><br>

    Recommended fly:
    ${river.fly}

    <br><br>

    Updated:
    ${new Date().toLocaleTimeString()}
    `;

}



document.addEventListener(
"DOMContentLoaded",
loadRiverData
);
