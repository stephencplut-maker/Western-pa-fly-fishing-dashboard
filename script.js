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


                if (code === "00060")
                    flow = value;

                if (code === "00065")
                    height = value;

                if (code === "00010")
                    temp =
                    ((value * 9/5)+32).toFixed(1);

            });



            const conditions =
            evaluateRiver(flow,height,temp);



            if (conditions.totalScore > highestScore &&
                conditions.wadeStatus !== "🔴 Unsafe") {

                highestScore =
                conditions.totalScore;


                bestRiver = {

                    name: river.name,
                    flow,
                    height,
                    temp,
                    score: conditions.fishingScore,
                    rating: conditions.rating,
                    wadeStatus: conditions.wadeStatus,
                    wadeNote: conditions.wadeNote,
                    guideNote: conditions.guideNote

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
            ${temp ? temp+"°F" : "Not reported"}

            <br>

            <strong>Wade Safety:</strong>
            ${conditions.wadeStatus}

            <br>

            <strong>Fishing:</strong>
            ${conditions.rating}
            `;


        }

        catch(error) {

            display.innerHTML =
            "⚠️ Data unavailable";

            console.log(error);

        }

    }


    updateRecommendation(bestRiver);

}



function evaluateRiver(flow,height,temp) {


    let fishingScore = 5;


    let wadeStatus;
    let wadeNote;



    /*
       Conservative wading rules.
       These will be tuned by river later.
    */


    if (
        (flow <= 900) &&
        (height <= 4)
    ) {

        wadeStatus =
        "🟢 Good";

        wadeNote =
        "Normal wading conditions.";

    }


    else if (
        (flow <= 1400) &&
        (height <= 5)
    ) {

        wadeStatus =
        "🟡 Caution";

        wadeNote =
        "Fishable, but limit crossings and use care.";

        fishingScore -=1;

    }


    else {

        wadeStatus =
        "🔴 Unsafe";

        wadeNote =
        "Avoid wading at current levels.";

        fishingScore -=3;

    }



    if(flow >=250 && flow <=700)
        fishingScore +=3;


    else if(flow >700 && flow <=1200)
        fishingScore +=1;


    if(temp) {

        if(temp >=65 && temp <=75)
            fishingScore +=2;

    }



    let rating =
    fishingScore >=9 ? "🟢 Excellent" :
    fishingScore >=7 ? "🟡 Good" :
    "🔴 Limited";



    return {

        totalScore:
        fishingScore,

        fishingScore,

        rating,

        wadeStatus,

        wadeNote,

        guideNote:
        buildGuideNote(flow,temp)

    };

}



function buildGuideNote(flow,temp) {


    let notes = [];


    if(flow >=250 && flow <=700)
        notes.push(
        "Ideal streamer flow for smallmouth."
        );


    if(temp >=65 && temp <=75)
        notes.push(
        "Water temperature favors active fish."
        );


    notes.push(
    "Focus on pools, seams, and shaded structure."
    );


    return notes.join(" ");

}



function chooseFly() {

    return {

        first:
        "Purple Woolly Bugger",

        backup:
        "White Clouser Minnow"

    };

}



function updateRecommendation(river) {


    const box =
    document.getElementById("bestRiver");


    if(!river) {

        box.innerHTML =
        "No safe wading options found.";

        return;

    }


    const fly =
    chooseFly();



    box.innerHTML =

    `
    🥇 <strong>${river.name}</strong>

    <br><br>

    <strong>Wade Safety:</strong>
    ${river.wadeStatus}

    <br>

    <strong>Smallmouth Index:</strong>
    ${river.score}/10

    <br><br>

    ${river.guideNote}

    <br><br>

    Flow:
    ${river.flow} CFS

    <br>

    Gage Height:
    ${river.height ? river.height.toFixed(2):"N/A"} ft

    <br>

    Water Temp:
    ${river.temp ? river.temp+"°F":"Not reported"}

    <br><br>

    🎣 First Fly:
    ${fly.first}

    <br>

    Backup:
    ${fly.backup}

    <br><br>

    ${river.wadeNote}

    <br><br>

    Updated:
    ${new Date().toLocaleTimeString()}
    `;

}



document.addEventListener(
"DOMContentLoaded",
loadRiverData
);
