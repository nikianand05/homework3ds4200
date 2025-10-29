// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
  // Convert string values to numbers
  data.forEach(function(d) {
    d.Likes = +d.Likes;
  });

  // ======= Part 2.1: Side-by-side boxplot =======

  // Define the dimensions and margins for the SVG
  const margin = { top: 36, right: 24, bottom: 56, left: 68 };
  const width = 700 - margin.left - margin.right;
  const height = 420 - margin.top - margin.bottom;

  // Create the SVG container
  const svg = d3
    .select("#boxplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales for x and y axes
  // x domain = unique AgeGroup values in input order
  const ageGroups = [...new Set(data.map(d => d.AgeGroup))];
  const xScale = d3
    .scaleBand()
    .domain(ageGroups)
    .range([0, width])
    .paddingInner(0.4)
    .paddingOuter(0.2);

  // y domain = [min, max] Likes (or 0..1000 if you prefer a fixed frame)
  const likesMin = d3.min(data, d => d.Likes);
  const likesMax = d3.max(data, d => d.Likes);
  const yScale = d3
    .scaleLinear()
    .domain([Math.min(0, likesMin), likesMax]) // allow 0 baseline if all positive
    .nice()
    .range([height, 0]);

  // Add axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(8);

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);
  svg.append("g").call(yAxis);

  // Add x-axis label
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Age Group");

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -48)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Likes");

  // Rollup to compute summary stats per AgeGroup
  const rollupFunction = function(groupData) {
    const values = groupData.map(d => d.Likes).sort(d3.ascending);
    const min = d3.min(values);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const max = d3.max(values);
    const iqr = q3 - q1;
    return { min, q1, median, q3, max, iqr };
  };

  // This line groups rows by AgeGroup and applies rollupFunction to each group,
  // producing a Map where: key = AgeGroup, value = {min, q1, median, q3, max, iqr}.
  const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

  // For each AgeGroup (key), we compute the x-position and available box width
  // so we can draw that group's whisker, box (q1..q3), and median line.
  quantilesByGroups.forEach((quantiles, AgeGroup) => {
    const x = xScale(AgeGroup);
    const boxWidth = xScale.bandwidth();

    // Draw vertical line (whisker): from min to max
    svg
      .append("line")
      .attr("x1", x + boxWidth / 2)
      .attr("x2", x + boxWidth / 2)
      .attr("y1", yScale(quantiles.min))
      .attr("y2", yScale(quantiles.max))
      .attr("stroke", "#555")
      .attr("stroke-width", 2);

    // Draw the box: from q1 to q3
    svg
      .append("rect")
      .attr("x", x + boxWidth * 0.15)
      .attr("width", boxWidth * 0.7)
      .attr("y", yScale(quantiles.q3))
      .attr("height", Math.max(1, yScale(quantiles.q1) - yScale(quantiles.q3))) // ensure min height 1
      .attr("fill", "#e8eef7")
      .attr("stroke", "#2b6cb0")
      .attr("stroke-width", 2);

    // Draw the median line
    svg
      .append("line")
      .attr("x1", x + boxWidth * 0.15)
      .attr("x2", x + boxWidth * 0.85)
      .attr("y1", yScale(quantiles.median))
      .attr("y2", yScale(quantiles.median))
      .attr("stroke", "#2b6cb0")
      .attr("stroke-width", 2);
  });
});

// ======= Part 2.2: Side-by-side (grouped) bar plot =======
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
  // 1) Convert to numbers
  data.forEach(d => { d.AvgLikes = +d.AvgLikes; });

  // 1) SVG
  const margin = { top: 36, right: 160, bottom: 64, left: 68 };
  const width  = 760 - margin.left - margin.right;
  const height = 420 - margin.top  - margin.bottom;

  const svg = d3.select("#barplot")
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 2) Scales (x0: Platform, x1: PostType, y: AvgLikes, color: PostType)
  const platforms = [...new Set(data.map(d => d.Platform))];
  const postTypes = [...new Set(data.map(d => d.PostType))];

  const x0 = d3.scaleBand()
    .domain(platforms)
    .range([0, width])
    .paddingInner(0.2)
    .paddingOuter(0.1);

  const x1 = d3.scaleBand()
    .domain(postTypes)
    .range([0, x0.bandwidth()])
    .padding(0.15);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.AvgLikes)])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(postTypes)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  // 3) Axes + labels
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  svg.append("g")
    .call(d3.axisLeft(y).ticks(8));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 48)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Platform");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -48)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Average Likes");

  // 4) Group by Platform, then draw one rect per PostType in that group
  const dataByPlatform = d3.groups(data, d => d.Platform);
  const group = svg.selectAll(".group")
    .data(dataByPlatform)
    .enter()
    .append("g")
    .attr("class", "group")
    .attr("transform", d => `translate(${x0(d[0])},0)`);

  group.selectAll("rect")
    .data(d => d[1])
    .enter()
    .append("rect")
    .attr("x", d => x1(d.PostType))
    .attr("y", d => y(d.AvgLikes))
    .attr("width",  x1.bandwidth())
    .attr("height", d => Math.max(0, height - y(d.AvgLikes)))
    .attr("fill", d => color(d.PostType));

  // 5) Legend (square + text)
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 16}, ${margin.top - 16})`);

  postTypes.forEach((type, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 22)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", color(type));

    legend.append("text")
      .attr("x", 20)
      .attr("y", i * 22 + 11)
      .attr("alignment-baseline", "middle")
      .text(type);
  });
});

// ======= Part 2.3: Line plot over time =======
// Data columns: Date (e.g., "3/1/2024 (Friday)") and AvgLikes
const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {

  // 1) Convert and parse
  data.forEach(d => {
    d.AvgLikes = +d.AvgLikes;
    // Extract the date part before the space → "3/1/2024"
    const datePart = d.Date.split(" ")[0];
    d.parsedDate = d3.timeParse("%m/%d/%Y")(datePart);
  });

  // Sort chronologically
  data.sort((a, b) => d3.ascending(a.parsedDate, b.parsedDate));

  // SVG setup
  const margin = { top: 36, right: 24, bottom: 64, left: 68 };
  const width  = 700 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#lineplot")
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 1) Scales
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.parsedDate))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.AvgLikes)])
    .nice()
    .range([height, 0]);

  // 1) Axes + labels (rotate x labels if long)
  const xAxis = d3.axisBottom(x)
    .ticks(data.length)
    .tickFormat(d3.timeFormat("%m/%d"));
  const yAxis = d3.axisLeft(y).ticks(8);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-25)");

  svg.append("g").call(yAxis);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 48)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -48)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text("Average Likes");

  // 2) Line and path (curveNatural)
  const line = d3.line()
    .x(d => x(d.parsedDate))
    .y(d => y(d.AvgLikes))
    .curve(d3.curveNatural);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", line);

  // dots on each point
  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.parsedDate))
    .attr("cy", d => y(d.AvgLikes))
    .attr("r", 3)
    .attr("fill", "#1f77b4");
});
