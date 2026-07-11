document.addEventListener(“DOMContentLoaded”, function () {

const today = new Date();

const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
};

const dateString = today.toLocaleDateString("en-US", options);


const bestRiver = document.getElementById("bestRiver");

bestRiver.innerHTML =
    `
    <strong>${dateString}</strong><br><br>
    Current dashboard status:<br>
    🟡 Waiting for live river data integration.<br><br>
    Next update will add automatic USGS readings,
    river trends, and fishing-condition scoring.
    `;
});
