//source - http://bl.ocks.org/mbostock/1667367
//source - http://bl.ocks.org/mbostock/3902569

//set for now (can update dynamically later for each graph
var currency = "GBP";
var csvFile = "data/ftse100.csv";

//Set graph position
var margin = {top: 10, right: 60, bottom: 100, left: 200};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;
//dimensions for contect selector

var margin2 = {top: 430, right: 60, bottom: 20, left: 200};
var height2 = 500 - margin2.top - margin2.bottom;

//read date into a date object
var getDate = d3.time.format("%e/%m/%Y").parse;
//for labels
var splitData = d3.bisector(function (d) { return d.date; }).left;
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
        .x(function(d) { return x(d.date); })
        .y0(height)
        .y1(function(d) { return y(d.close); });

var area2 = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return x2(d.date); })
        .y0(height2)
        .y1(function(d) { return y2(d.close); });

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
        d.date = getDate(d.date);
        d.close = +d.close;
        });
		
		data.sort(function (a, b) {
		return a.date - b.date;
		});

        x.domain(d3.extent(data.map(function(d) { return d.date; })));
        y.domain([0, d3.max(data.map(function(d) { return d.close; }))]);
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
        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 206)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text(currency);              
		
		
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
			.attr("height", 30)
			.attr("width", 100)
			.attr("rx", 6)
			.attr("ry", 6)
		
		var date = inter.append("text")
				.attr("x", 12)
				.attr("y", 10)
				.attr("dy", ".35em");
		  
		var price = inter.append("text")
				.attr("x", 12)
				.attr("y", 20)
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
			d = x0 - d0.date > d1.date - x0 ? d1 : d0;
		inter.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
		date.text(d.date.toDateString());
		price.text(formatValue(d.close));
	}
});


      function brushed() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        focus.select("path").attr("d", area);
        focus.select(".x.axis").call(xAxis);
      }