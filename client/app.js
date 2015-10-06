var mapDisplay = require("./mapDisplay.js");
var pickDisplay = require("./pickDisplay.js");

mapDisplay.onUpdate(function() {
    pickDisplay.render(mapDisplay.picks);
});


