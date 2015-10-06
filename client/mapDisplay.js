var pickDisplay = require("./pickDisplay.js");

function Location(name, address, iurl, ll) {
    this.name = name;
    this.addr = address;
    this.iurl = iurl;
    this.ll = ll;
}

var locs = {};
var picked = {};
var picks = [];
module.exports.picks = picks;

var cb;
function update() {
    cb();
}
function onUpdate(c) {
    cb = c;
}
module.exports.onUpdate = onUpdate;

// --------------------------------------------------------------------------------

var mapStyle = require("./mapStyle.json");
var gmap = new GMaps({
    div: "#map",
    lat: 0,
    lng: 0
});
var map = gmap.map;
map.setOptions({styles: mapStyle});
module.exports.map = map;

// --------------------------------------------------------------------------------

var colors = [
    "#76FF03",
    "#00E676",
    "#FFEA00",
    "#1DE9B6",
    "#2E7D32",
    "#C6FF00",
    "#558B2F"
];
var cr=0;
function nextColor() {
    return colors[(cr++)%colors.length];
}

function route() {
    var glory = [];
    gmap.removeOverlays();
    for(var i = 0; i < picks.length; i++) {
        var pick = picks[i];
        var ll = pick.ll; glory.push(ll);
        var iurl = pick.iurl;
        var ole = gmap.drawOverlay({
            lat: ll.lat(),
            lng: ll.lng(),
            layer: "overlayMouseTarget",
            content: "<div class='dot'><img src='"+iurl+"'></div>",
        });
        gmap.fitLatLngBounds(glory);
    }
    for(var i = 0; i < picks.length-1; i++) {
        var ll1 = picks[i].ll;
        var ll2 = picks[i+1].ll;
        gmap.drawRoute({
            origin: [ll1.lat(),ll1.lng()],
            destination: [ll2.lat(),ll2.lng()],
            travelMode: "driving",
            strokeColor: nextColor(),
            strokeWeight: 7
        });
    }
    center();
}
module.exports.route = route;

var ri = 0;
var hole = null;
var nole = null;
function center() {
    var cen = [];
    var here = picks[ri].ll;
    cen.push(picks[ri].ll);
    if(ri+1<picks.length) {
        var there = picks[ri+1].ll;
        cen.push(there);
        gmap.fitLatLngBounds(cen);
    }
    hole = gmap.drawOverlay({
        lat: here.lat(),
        lng: here.lng(),
        layer: "floatPane",
        verticalAlign: "top",
        verticalOffset: -30,
        content: "<div class='here'>YOU<br>ARE<br>HERE</div>"
    });
    if(there)
    nole = gmap.drawOverlay({
        lat: there.lat(),
        lng: there.lng(),
        layer: "floatPane",
        verticalAlign: "top",
        verticalOffset: -30,
        content: "<div class='there'>NEXT<br>SPOT</div>"
    });
    pickDisplay.next(picks[ri+1], picks[ri]);
}
function next() {
    ri++;
    gmap.removeOverlay(hole);
    if(nole)
    gmap.removeOverlay(nole);
    hole = null;
    nole = null;
    center();
}
module.exports.next = next;

// --------------------------------------------------------------------------------

var request = require("browser-request");
var url = "/yelp";
var json = {
    term: TER,
    location: LOC
};

request.post({method:"POST", url:url, json:json}, function(err, res) {
    var destiny = [];
    var data = JSON.parse(res.response);
    for(var i = 0; i < data.businesses.length; i++) {
        var b = data.businesses[i];
        
        (function() {
            var name = b.name;
            var address = b.location.display_address.join(", ");
            var iurl = b.image_url;

            var mole = null;
            var ll = null;

            var tt = "<div class='tt'><img src='"+iurl+"'><div class='name'>"+name+"</div><div class='btn'><span class='fa fa-fw fa-plus'></span>Add</div></div>";

            var loc = new Location(name, address, iurl);
            locs[name] = loc;
            
            function handle(results, status) {
                if(status === 'OK') {
                    ll = results[0].geometry.location;
                    destiny.push(ll);
                    loc.ll = ll;
                    var olay = gmap.drawOverlay({
                        lat: ll.lat(),
                        lng: ll.lng(),
                        layer: "overlayMouseTarget",
                        content: "<div class='dot'><img src='"+iurl+"'></div>",
                        click: onClick
                    });
                    gmap.fitLatLngBounds(destiny);
                }
                else {
                    console.log(status);
                }
            }

            function onClick() {
                if(!mole) {
                    mole = gmap.drawOverlay({
                        lat: ll.lat(),
                        lng: ll.lng(),
                        layer: "floatPane",
                        verticalAlign: "top",
                        content: tt,
                        verticalOffset: -35,
                        click: addPick
                    });
                } else {
                    gmap.removeOverlay(mole);
                    mole = null;
                }
            }

            function addPick() {
                if(!picked[loc.name]) {
                    picks.push(loc);
                    picked[loc.name] = true;
                    update();
                }
                if(mole) {
                    gmap.removeOverlay(mole);
                    mole = null;
                }
            }

            setTimeout(function(){
                GMaps.geocode({address: address, callback: handle})
            },500*i);
        })();
        
        //console.log(JSON.stringify(b,null,4));
        //console.log(b.name);
    }
});
