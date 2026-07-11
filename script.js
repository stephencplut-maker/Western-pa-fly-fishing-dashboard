const rivers = [
    {
        name: "Clarion River",
        id: "clarion",
        site: "03029500"
    },
    {
        name: "Oil Creek",
        id: "oil",
        site: "03024000"
    },
    {
        name: "French Creek",
        id: "french",
        site: "03027500"
    },
    {
        name: "Redbank Creek",
        id: "redbank",
        site: "03029000"
    },
    {
        name: "Allegheny River",
        id: "allegheny",
        site: "03020500"
    }
];


async function loadRiverData() {

    let bestRiver = null;
    let highestScore = 0;


    for (const river of rivers) {

        const display =
        document.getElementById(river.id);


        try {

            const url =
            `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${river.site}&parameterCd=00060,00065,00010`;


            const response =
            await fetch(url);


            const data =
            await response.json();


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
                    temp =
                    ((value * 9/5) + 32).toFixed(1);
                }

            });


            const analysis =
            analyzeConditions(flow,temp);


            if (analysis.score > highestScore) {

                highestScore = analysis.score;

                bestRiver = {

                    name: river.name,
                    flow,
                    height,
                    temp,
                    score: analysis.score,
                    rating: analysis.rating

                };

            }



            display.innerHTML =
            `
            <strong>Flow:</strong>
            ${flow ?? "N/A"} CFS

            <br>

            <strong>Gage Height:</strong>
            ${height ? height.toFixed(2) : "N/A"} ft

            <br>

            <strong>Water Temp:</strong>
            ${temp ? temp + "°F" : "Not reported"}

            <br>

            <strong>Outlook:</strong>
            ${analysis.rating}
            `;



        }

        catch(error) {

            display.innerHTML =
            "⚠️ Data unavailable";

        }

    }


    updateRecommendation(bestRiver);

}



function analyzeConditions(flow,temp) {

    let score = 5;


    if (flow >=250 && flow <=700)
        score +=3;

    else if (flow >700 && flow <=1200)
        score +=1;

    else
        score -=2;



    if(temp) {

        if(temp >=65 && temp <=75)
            score +=2;

        else if(temp <60)
            score -=1;

    }


    let rating =
    score >=9 ? "🟢 Excellent" :
    score >=7 ? "🟡 Good" :
    "🔴 Limited";


    return {

        score,
        rating

    };

}



function chooseFly(river) {

    if(river.temp >=68 && river.temp <=78) {

        return {

            first:
            "🐸 Frog Popper",

            backup:
            "Purple Woolly Bugger",

            note:
            "Warm water favors aggressive smallmouth. Work banks, shade, and surface structure."

        };

    }


    if(river.flow >700) {

        return {

            first:
            "Black Woolly Bugger",

            backup:
            "Chartreuse Clouser Minnow",

            note:
            "Higher water favors larger profiles and slower presentations near current breaks."

        };

    }


    return {

        first:
        "Purple Woolly Bugger",

        backup:
        "White Clouser Minnow",

        note:
        "Fish pools, seams, and structure with a 5 wt floating line."

    };

}



function updateRecommendation(river) {


    const box =
    document.getElementById("bestRiver");


    if(!river) {

        box.innerHTML =
        "No recommendation available.";

        return;

    }


    const fly =
    chooseFly(river);



    box.innerHTML =

    `
    🥇 <strong>${river.name}</strong>

    <br><br>

    <strong>Smallmouth Index:</strong>
    ${river.score}/10

    <br>

    ${river.rating}

    <br><br>

    Flow:
    ${river.flow} CFS

    <br>

    Gage Height:
    ${river.height ? river.height.toFixed(2) : "N/A"} ft

    <br>

    Water Temp:
    ${river.temp ? river.temp+"°F" : "Not reported"}

    <br><br>

    🎣 <strong>First fly:</strong>
    ${fly.first}

    <br>

    Backup:
    ${fly.backup}

    <br><br>

    ${fly.note}

    <br><br>

    Updated:
    ${new Date().toLocaleTimeString()}

    `;

}



document.addEventListener(
"DOMContentLoaded",
loadRiverData
);
