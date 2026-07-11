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
            `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${river.site}&parameterCd=00060`;

            const response = await fetch(url);

            const data = await response.json();


            const flow = Number(
                data.value
                .timeSeries[0]
                .values[0]
                .value[0]
                .value
            );


            const rating = getRating(flow);

            const score = getScore(flow);


            if (score > bestScore) {
                bestScore = score;
                bestRiver = river;
                bestRiver.flow = flow;
                bestRiver.rating = rating;
            }


            display.innerHTML =
            `
            <strong>Flow:</strong> ${flow} CFS
            <br>
            <strong>Fishing:</strong> ${rating}
            <br>
            <strong>Suggested fly:</strong> ${river.fly}
            `;


        }

        catch(error) {

            display.innerHTML =
            `
            ⚠️ River data unavailable
            `;

            console.log(
                river.name,
                error
            );

        }

    }


    updateBestRiver(bestRiver);

}



function getRating(flow) {

    if (flow >= 250 && flow <= 700) {

        return "🟢 Excellent";

    }


    if (flow > 700 && flow <= 1200) {

        return "🟡 Fishable";

    }


    return "🔴 Poor";

}



function getScore(flow) {

    if (flow >= 250 && flow <= 700) {

        return 3;

    }


    if (flow > 700 && flow <= 1200) {

        return 2;

    }


    return 1;

}



function updateBestRiver(river) {

    const box = document.getElementById("bestRiver");


    if (river) {

        box.innerHTML =
        `
        🥇 <strong>${river.name}</strong>
        <br><br>
        Best current smallmouth opportunity
        <br><br>
        Flow: ${river.flow} CFS
        <br>
        Rating: ${river.rating}
        <br>
        Try: ${river.fly}
        <br><br>
        Updated:
        ${new Date().toLocaleTimeString()}
        `;

    }

    else {

        box.innerHTML =
        `
        No favorable river conditions detected.
        `;

    }

}



document.addEventListener(
"DOMContentLoaded",
loadRiverData
);
