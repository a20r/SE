//source - http://bl.ocks.org/mbostock/1667367
//source - http://bl.ocks.org/mbostock/3902569

//set for now (can update dynamically later for each graph
var currency = "(£)";
var csvFile = "data/aal.csv";

//Set graph position
var margin = {top: 10, right: 60, bottom: 100, left: 40};
var width = 1000 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
//dimensions for contect selector

var margin2 = {top: 430, right: 60, bottom: 20, left: 40};
var height2 = 500 - margin2.top - margin2.bottom;

//read date into a date object
var getDate = d3.time.format("%Y-%m-%e").parse;
//for labels
var splitData = d3.bisector(function (d) { return d.Date; }).left;
var formatValue = d3.format(",.2f");

//set axis scales 
var x = d3.time.scale().range([0, width]),
		x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

//place the axis
var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left");
	
//set up brush on bottom axis
var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x(d.Date); })
        .y0(height)
        .y1(function(d) { return y(d.Close); });

var area2 = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x2(d.Date); })
        .y0(height2)
        .y1(function(d) { return y2(d.Close); });

var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom);

svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
	
	//top graph displays the chart
var focus = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
//bottom graph (time selector)
var context = svg.append("g")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");




	//read in data
d3.csv( csvFile, function(error, data) {

        data.forEach(function(d) {
        d.Date = getDate(d.Date);
		// d.Volume = +d.Volume;
        d.Close = +d.Close;
        });
		
		data.sort(function (a, b) {
		return a.Date - b.Date;
		});

        x.domain(d3.extent(data.map(function(d) { return d.Date; })));
        y.domain([0, d3.max(data.map(function(d) { return d.Close; }))]);
        x2.domain(x.domain());
        y2.domain(y.domain());
	
		//plot area
        focus.append("path")
          .datum(data)
          .attr("clip-path", "url(#clip)")
          .attr("d", area);
		  
		//put scale xaxis
        focus.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);
		
		//put scale y axis
        focus.append("g")
          .attr("class", "y axis")
          .call(yAxis);
		  
	
		//label y axis
        focus.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Price (£)");              
		
		
        context.append("path")
          .datum(data)
          .attr("d", area2);

        context.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);

        context.append("g")
          .attr("class", "x brush")
          .call(brush)
        .selectAll("rect")
          .attr("y", -6)
          .attr("height", height2 + 7);
		
		var inter = focus.append("g")
			.attr("class", "focus")
			.style("display", "none");
		
		inter.append("circle")
			.attr("r", 4.5);
		
		inter.append("rect")
			.attr("x", 9)
			// .attr("y", 9)
			.attr("height", 100)
			.attr("width", 100)
			.attr("rx", 6)
			.attr("ry", 6)
		
	var date = inter.append("text")
				.attr("x", 12)
				.attr("y", 10)
				.attr("dy", ".35em");
	
	var volume = inter.append("text")
				.attr("x", 12)
				.attr("y", 25)
				.attr("dy", ".35em");	
		  
	var market = inter.append("text")
				.attr("x", 12)
				.attr("y", 45)
				.attr("dy", ".35em");
				
	var open = inter.append("text")
				.attr("x", 12)
				.attr("y", 60)
				.attr("dy", ".35em");	
		  
	var close = inter.append("text")
				.attr("x", 12)
				.attr("y", 70)
				.attr("dy", ".35em");
	
	var high = inter.append("text")
				.attr("x", 12)
				.attr("y", 80)
				.attr("dy", ".35em");	
		  
	var low = inter.append("text")
				.attr("x", 12)
				.attr("y", 90)
				.attr("dy", ".35em");	
		
	focus.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", function() { inter.style("display", null); })
      .on("mouseout", function() { inter.style("display", "none"); })
      .on("mousemove", mousemove);

	function mousemove() {
		var x0 = x.invert(d3.mouse(this)[0]),
			i = splitData(data, x0, 1),
			d0 = data[i - 1],
			d1 = data[i],
			d = x0 - d0.Date > d1.Date - x0 ? d1 : d0;
		inter.attr("transform", "translate(" + x(d.Date) + "," + y(d.Close) + ")");
		date.text(d.Date.toDateString());
		volume.text("Volume:" + d.Volume);
		market.text("Market");
		open.text("Open: £" + formatValue(d.Open));
		close.text("Close: £" + formatValue(d.Close));
		high.text("High: £" + formatValue(d.High));
		low.text("Low: £" + formatValue(d.Low));
	}
});


      function brushed() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        focus.select("path").attr("d", area);
        focus.select(".x.axis").call(xAxis);
      }