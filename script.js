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
    let bestScore = 0;


    for (const river of rivers) {

        const display = document.getElementById(river.id);

        try {

            const url =
            `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${river.site}&parameterCd=00060,00065,00010`;

            const response = await fetch(url);

            const data = await response.json();


            let flow = "N/A";
            let height = "N/A";
            let temp = "N/A";


            data.value.timeSeries.forEach(series => {

                const value =
                series.values[0].value[0].value;


                if (series.variable.variableCode[0].value === "00060") {
                    flow = Number(value);
                }

                if (series.variable.variableCode[0].value === "00065") {
                    height = Number(value).toFixed(2);
                }

                if (series.variable.variableCode[0].value === "00010") {
                    temp = Number(value).toFixed(1);
                    temp = ((temp * 9/5) + 32).toFixed(1);
                }

            });


            const rating = getRating(flow, temp);

            const score = getScore(flow, temp);


            if (score > bestScore) {

                bestScore = score;

                bestRiver = {
                    name: river.name,
                    fly: river.fly,
                    flow: flow,
                    height: height,
                    temp: temp,
                    rating: rating
                };

            }


            display.innerHTML =
            `
            <strong>Flow:</strong> ${flow} CFS
            <br>

            <strong>Gage Height:</strong> ${height} ft
            <br>

            <strong>Water Temp:</strong> ${temp}°F
            <br>

            <strong>Fishing:</strong> ${rating}
            <br>

            <strong>Try:</strong> ${river.fly}
            `;


        }

        catch(error) {

            display.innerHTML =
            "⚠️ Data unavailable";

            console.log(river.name, error);

        }

    }


    updateBestRiver(bestRiver);

}



function getRating(flow, temp) {


    if (
        flow >= 250 &&
        flow <= 700 &&
        temp >= 65 &&
        temp <= 75
    ) {

        return "🟢 Excellent";

    }


    if (
        flow >= 200 &&
        flow <= 1200
    ) {

        return "🟡 Fishable";

    }


    return "🔴 Poor";

}



function getScore(flow, temp) {

    let score = 0;


    if (flow >= 250 && flow <= 700) {
        score += 3;
    }

    else if (flow > 700 && flow <= 1200) {
        score += 2;
    }


    if (temp >= 65 && temp <= 75) {
        score += 3;
    }

    else if (temp >= 55 && temp < 65) {
        score += 1;
    }


    return score;

}



function updateBestRiver(river) {

    const box = document.getElementById("bestRiver");


    if (river) {

        let topwater = "";

        if (river.temp >= 68 && river.temp <= 78) {

            topwater =
            "<br><br>🐸 Topwater opportunity looks promising";

        }


        box.innerHTML =
        `
        🥇 <strong>${river.name}</strong>

        <br><br>

        Best current smallmouth opportunity

        <br><br>

        Flow: ${river.flow} CFS

        <br>

        Gage Height: ${river.height} ft

        <br>

        Water Temp: ${river.temp}°F

        <br>

        Rating: ${river.rating}

        <br>

        Try: ${river.fly}

        ${topwater}

        <br><br>

        Updated:
        ${new Date().toLocaleTimeString()}
        `;

    }

}



document.addEventListener(
"DOMContentLoaded",
loadRiverData
);
