const rivers = [
{
name: “Clarion River”,
site: “03029500”,
fly: “Purple Woolly Bugger”
},
{
name: “Oil Creek”,
site: “03024000”,
fly: “Olive Woolly Bugger”
},
{
name: “French Creek”,
site: “03027500”,
fly: “White Clouser Minnow”
},
{
name: “Redbank Creek”,
site: “03029000”,
fly: “Black Woolly Bugger”
},
{
name: “Allegheny River”,
site: “03020500”,
fly: “Chartreuse Clouser Minnow”
}
];

async function getRiverData() {

for (const river of rivers) {

    const url =
    `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${river.site}&parameterCd=00060&siteStatus=all`;

    try {

        const response = await fetch(url);
        const data = await response.json();

        const value =
        data.value.timeSeries[0]
        .values[0]
        .value[0]
        .value;

        updateRiverCard(river, value);

    }

    catch(error) {

        console.log(
            "Could not load " + river.name,
            error
        );

    }
}
}

function updateRiverCard(river, flow) {

const cards =
document.querySelectorAll(".card");


cards.forEach(card => {

    if(card.innerHTML.includes(river.name)) {

        let rating = getRating(flow);

        card.innerHTML +=
        `
        <hr>
        <p><strong>Current Flow:</strong> ${flow} CFS</p>
        <p><strong>Fishing Outlook:</strong> ${rating}</p>
        <p><strong>Try:</strong> ${river.fly}</p>
        `;

    }

});
}

function getRating(flow) {

flow = Number(flow);


if(flow >= 250 && flow <= 700) {

    return "🟢 Excellent";

}

else if(flow > 700 && flow <= 1200) {

    return "🟡 Fishable";

}

else {

    return "🔴 Check conditions";

}
}

document.addEventListener(
“DOMContentLoaded”,
function(){

getRiverData();
});


