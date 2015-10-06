var d3 = require("d3");
var request = require("browser-request");
var map = require("./mapDisplay.js");

var picks = d3.select(".picks");

// --------------------------------------------------------------------------------

// --------------------------------------------------------------------------------

var go = d3.select(".go");
go.on("click", function() {
    var side = d3.select("#side");
    var main = d3.select("#map");

    side.transition()
        .duration(800)
        .style("left","-24%");
    main.transition()
        .duration(800)
        .styleTween("width",function() {
            var inter = d3.interpolate(76,100);
            return function(t) {
                window.dispatchEvent(new Event('resize'));
                return inter(t)+"%";
            };
        });
    map.route();
});

// --------------------------------------------------------------------------------

function getPrice(l11, l12, l21, l22, cb) {
    var url = "/uber/price";
    var json = {
        l11:l11,
        l12:l12,
        l21:l21,
        l22:l22
    };
    request.post({method:"POST", url:url, json:json}, function(err, res) {
        var data = JSON.parse(res.response);
        //console.log(data);
        if(cb) cb(data);
    });
}

function getTime(l1, l2, cb) {
    var url = "/uber/time";
    var json = {
        l1:l1,
        l2:l2
    };
    request.post({method:"POST", url:url, json:json}, function(err, res) {
        var data = JSON.parse(res.response);
        if(cb) cb(data);
    });
}

// --------------------------------------------------------------------------------

var total_min=0,
    total_max=0,
    total_time=0;
    total_dist=0;
var box = d3.select(".box");
function next(loc, ploc) {
    console.log(loc);
    if(!loc) {
        //box.style("opacity","0");
        var html = "";
        html += "<div class='now'>Final destination:</div>";
        html += "<div class='cover'><img src='"+ploc.iurl+"'></div>";
        html += "<div class='prev'>"+ploc.name+"</div>";
        box.html(html);
        var hop = box.append("div")
        .attr("class", "walk")
        .html("<span class='fa fa-car'></span><br>Fare paid:<br>$"+total_min+" to $"+total_max);
        var walk = box.append("div")
        .attr("class", "walk")
        .html("<span class='fa fa-child'></span><br>Total Distance Walked:<br>"+total_dist+"mi");
        return;
    }
    box.style("opacity","1");
    var html = "";
    html += "<div class='now'>Currently at:</div>";
    html += "<div class='prev'>"+ploc.name+"</div>";
    html += "<div class='then'>Next up:</div>";
    html += "<div class='cover'><img src='"+loc.iurl+"'></div>";
    html += "<div class='next'>"+loc.name+"</div>";
    box.html(html);
    var hop = box.append("div")
        .attr("class", "hop")
        .html("<span class='fa fa-car'></span><br>Hop")
        .on("click", hopClick);
    var walk = box.append("div")
        .attr("class", "walk")
        .html("<span class='fa fa-child'></span><br>Walk")
        .on("click", walkClick);

    var min = 100000;
    var max = 0;
    var dist = 0;
    function hopClick() {
        total_min += min;
        total_max += max;
        map.next();
    }
    function walkClick() {
        total_dist += dist;
        map.next();
    }
    getPrice(ploc.ll.lat(), ploc.ll.lng(), loc.ll.lat(), loc.ll.lng(), function(data) {
        var dura = 0;
        for(var i = 0; i < data.prices.length; i++) {
            var d = data.prices[i];
            if(!d.low_estimate || !d.high_estimate)
                continue;
            min = Math.min(min, d.low_estimate);
            max = Math.max(max, d.high_estimate);
            dist = d.distance;
            dura = d.duration;
        }
        var sec = dura % 60;
        var minu = Math.floor(dura / 60);
        hop.html("<span class='fa fa-car'></span><br>Hop<br>"+minu+":"+sec+"m<br>$"+min+" to $"+max);
        walk.html("<span class='fa fa-child'></span><br>Walk<br>"+dist+"mi")
    });
}
module.exports.next = next;

// --------------------------------------------------------------------------------

function render(data) {
    if(data.length>=2)
        go.style("visibility","visible")
    var items = picks.selectAll(".item")
        .data(data, function(d) {return d.name;});

    items.enter().append("div")
        .attr("class", "item");

    items
        .each(function(d) {
            var elem = d3.select(this);
            elem.html("<div class='cover'><img src='"+d.iurl+"'></div><div class='content'><div class='name'>"+d.name+"</div><div class='addr'>"+"</div></div>");
        });
}

module.exports.render = render;
