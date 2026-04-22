const palette = {
  ma: "#ffd166",
  us: "#4cc9f0",
  gap: "#ff6b6b",
  grid: "#9aa0a6",
  baseline: "#d9d9d9"
};

d3.select("#heading").text("From peak pain to partial recovery: Massachusetts vs. America.");
d3.select("#subheading").text("");

const monthIndex = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
};

function parseData(rawText) {
  const lines = rawText.split(/\r?\n/);
  const headerIndex = lines.findIndex(
    (line) => line.includes('"Year"') && line.includes('"Month"')
  );
  if (headerIndex < 0) throw new Error("Could not find CSV header row.");

  const rows = d3.csvParse(lines.slice(headerIndex).join("\n"));
  const data = rows
    .filter((d) => monthIndex[d.Month] !== undefined)
    .map((d) => {
      const ma = +d["Massachusetts Unemployment Rate"];
      const us = +d["National Unemployment Rate"];
      const maParticipation = +d["Massachusetts Laborforce Participation Rate"];
      const usParticipation = +d["National Laborforce Participation Rate"];
      return {
        date: new Date(+d.Year, monthIndex[d.Month], 1),
        ma,
        us,
        gap: ma - us,
        maParticipation,
        usParticipation
      };
    })
    .filter((d) => d.ma > 0 && d.us > 0) // excludes 2025 October missing row
    .sort((a, b) => d3.ascending(a.date, b.date));

  if (!data.length) throw new Error("No valid monthly unemployment rows found.");
  return data;
}

function renderKpis(data) {
  const peakPoint = data.reduce((a, b) => (b.ma > a.ma ? b : a), data[0]);
  const latestPoint = data[data.length - 1];
  const currentGap = latestPoint.ma - latestPoint.us;
  const netImprovement = peakPoint.ma - latestPoint.ma;

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText("kpi-peak-ma", `${peakPoint.ma.toFixed(1)}%`);
  setText("kpi-latest-ma", `${latestPoint.ma.toFixed(1)}%`);
  setText("kpi-latest-us", `${latestPoint.us.toFixed(1)}%`);
  setText("kpi-current-gap", `${currentGap >= 0 ? "+" : ""}${currentGap.toFixed(1)} pts`);
  setText("kpi-net-improvement", `${netImprovement.toFixed(1)} pts`);
}

function setupKpiExplainers() {
  const kpiItems = document.querySelectorAll(".kpi-item");
  const modal = document.getElementById("kpi-modal");
  const closeButton = document.getElementById("kpi-modal-close");
  const modalTitle = document.getElementById("kpi-modal-title");
  const modalBody = document.getElementById("kpi-modal-body");
  if (!kpiItems.length || !modal || !closeButton || !modalTitle || !modalBody) return;

  const explainers = {
    "peak-ma": {
      title: "Peak MA",
      body: "The highest monthly Massachusetts unemployment rate in this dataset window (2020 to Jan 2026). It captures the worst point of labor market stress."
    },
    "latest-ma": {
      title: "Latest MA",
      body: "Massachusetts unemployment rate in the most recent month available. This shows where the state stands now."
    },
    "latest-us": {
      title: "Latest U.S.",
      body: "National unemployment rate in the most recent month available. It is the benchmark used to compare Massachusetts performance."
    },
    "current-gap": {
      title: "Current Gap",
      body: "Latest Massachusetts rate minus latest U.S. rate. Positive means Massachusetts is currently above the national unemployment rate."
    },
    "net-improvement": {
      title: "Net Improvement",
      body: "How much Massachusetts has fallen from its peak rate to the latest month. Larger value means a bigger recovery from the crisis peak."
    }
  };

  function openModal(key) {
    const content = explainers[key];
    if (!content) return;
    modalTitle.textContent = content.title;
    modalBody.textContent = content.body;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  kpiItems.forEach((item) => {
    item.addEventListener("click", () => openModal(item.dataset.kpiKey));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(item.dataset.kpiKey);
      }
    });
  });

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
}

function drawMainChart(data) {
  const width = 920;
  const height = 420;
  const margin = { top: 20, right: 24, bottom: 38, left: 46 };

  const svg = d3.select("#chart-main").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([
      Math.floor(d3.min(data, (d) => Math.min(d.ma, d.us))),
      Math.ceil(d3.max(data, (d) => Math.max(d.ma, d.us)))
    ])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("stroke", palette.grid)
    .attr("stroke-dasharray", "2,3")
    .selectAll("line")
    .data(y.ticks())
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d));

  const makeLine = (key) => d3.line()
    .x((d) => x(d.date))
    .y((d) => y(d[key]));

  svg.append("path")
    .datum(data)
    .attr("class", "line-ma")
    .attr("fill", "none")
    .attr("stroke", palette.ma)
    .attr("stroke-width", 2.8)
    .attr("d", makeLine("ma"));

  svg.append("path")
    .datum(data)
    .attr("class", "line-us")
    .attr("fill", "none")
    .attr("stroke", palette.us)
    .attr("stroke-width", 2.8)
    .attr("d", makeLine("us"));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y"))
        .tickSizeOuter(0)
    );

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .tickValues(d3.range(Math.ceil(y.domain()[0]), Math.floor(y.domain()[1]) + 1))
        .tickFormat((d) => `${d}%`)
        .tickSizeOuter(0)
    )
    .call((g) => g.select(".domain").remove());

  const legend = svg.append("g").attr("transform", `translate(${width - 208}, ${margin.top + 6})`);
  const legendData = [
    { label: "Massachusetts", color: palette.ma },
    { label: "United States", color: palette.us }
  ];

  const row = legend.selectAll("g")
    .data(legendData)
    .join("g")
    .attr("transform", (_, i) => `translate(0, ${i * 19})`);

  row.append("line")
    .attr("x1", 0)
    .attr("x2", 18)
    .attr("y1", 8)
    .attr("y2", 8)
    .attr("stroke", (d) => d.color)
    .attr("stroke-width", 3);

  row.append("text")
    .attr("x", 24)
    .attr("y", 8)
    .attr("dominant-baseline", "middle")
    .attr("font-size", 12)
    .attr("fill", "#ffffff")
    .text((d) => d.label);
}

function drawMassachusettsMap() {
  const width = 920;
  const height = 380;
  const svg = d3.select("#chart-map").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then((us) => {
    const states = topojson.feature(us, us.objects.states).features;
    const borders = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

    const projection = d3.geoAlbersUsa().fitSize([width, height], { type: "FeatureCollection", features: states });
    const path = d3.geoPath(projection);

    svg.append("g")
      .selectAll("path")
      .data(states)
      .join("path")
      .attr("class", "us-state")
      .attr("d", path);

    svg.append("path")
      .datum(borders)
      .attr("class", "us-borders")
      .attr("d", path);

    const massachusetts = states.find((d) => +d.id === 25);
    if (massachusetts) {
      svg.append("path")
        .datum(massachusetts)
        .attr("class", "ma-highlight")
        .attr("d", path);
    }
  });
}

function drawGapChart(data) {
  const width = 920;
  const height = 320;
  const margin = { top: 20, right: 24, bottom: 36, left: 56 };

  const svg = d3.select("#chart-gap").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const maxAbsGap = d3.max(data, (d) => Math.abs(d.gap));
  const y = d3.scaleLinear()
    .domain([-Math.ceil(maxAbsGap), Math.ceil(maxAbsGap)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3.line()
    .x((d) => x(d.date))
    .y((d) => y(d.gap));

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", palette.baseline)
    .attr("stroke-width", 1.2);

  svg.append("path")
    .datum(data)
    .attr("class", "line-gap")
    .attr("fill", "none")
    .attr("stroke", palette.gap)
    .attr("stroke-width", 2.8)
    .attr("d", line);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y"))
        .tickSizeOuter(0)
    );

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .ticks(7)
        .tickFormat((d) => `${d > 0 ? "+" : ""}${d.toFixed(0)} pts`)
        .tickSizeOuter(0)
    )
    .call((g) => g.select(".domain").remove());

  const peak = data.reduce((a, b) => (Math.abs(b.gap) > Math.abs(a.gap) ? b : a), data[0]);
  const peakText = `${d3.timeFormat("%b %Y")(peak.date)}: ${peak.gap > 0 ? "+" : ""}${peak.gap.toFixed(1)} pts`;

  svg.append("circle")
    .attr("cx", x(peak.date))
    .attr("cy", y(peak.gap))
    .attr("r", 4)
    .attr("fill", palette.gap);

  svg.append("text")
    .attr("x", x(peak.date) + 8)
    .attr("y", y(peak.gap) - 8)
    .attr("font-size", 12)
    .attr("fill", "#ffffff")
    .text(`Largest gap: ${peakText}`);

}

function drawRecoverySlopeChart(data) {
  const width = 920;
  const height = 320;
  const margin = { top: 28, right: 180, bottom: 44, left: 72 };
  const svg = d3.select("#chart-recovery").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const peakPoint = data.reduce((a, b) => (b.ma > a.ma ? b : a), data[0]);
  const latestPoint = data[data.length - 1];
  const endpointData = [
    {
      series: "Massachusetts",
      color: palette.ma,
      startValue: peakPoint.ma,
      endValue: latestPoint.ma
    },
    {
      series: "United States",
      color: palette.us,
      startValue: peakPoint.us,
      endValue: latestPoint.us
    }
  ];

  const x = d3.scalePoint()
    .domain(["Peak", "Latest"])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, Math.ceil(d3.max(endpointData, (d) => Math.max(d.startValue, d.endValue)))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}%`).tickSizeOuter(0))
    .call((g) => g.select(".domain").remove());

  endpointData.forEach((d) => {
    const path = d3.path();
    path.moveTo(x("Peak"), y(d.startValue));
    path.lineTo(x("Latest"), y(d.endValue));

    svg.append("path")
      .attr("class", `recovery-line recovery-line-${d.series.toLowerCase().replace(/\s+/g, "-")}`)
      .attr("fill", "none")
      .attr("stroke", d.color)
      .attr("stroke-width", 3)
      .attr("d", path.toString());

    svg.append("circle")
      .attr("cx", x("Peak"))
      .attr("cy", y(d.startValue))
      .attr("r", 4)
      .attr("fill", d.color);

    svg.append("circle")
      .attr("cx", x("Latest"))
      .attr("cy", y(d.endValue))
      .attr("r", 4)
      .attr("fill", d.color);

  });

  const legend = svg.append("g").attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 8})`);
  const legendRows = legend.selectAll("g")
    .data(endpointData)
    .join("g")
    .attr("transform", (_, i) => `translate(0, ${i * 20})`);

  legendRows.append("line")
    .attr("x1", 0)
    .attr("x2", 18)
    .attr("y1", 8)
    .attr("y2", 8)
    .attr("stroke", (d) => d.color)
    .attr("stroke-width", 3);

  legendRows.append("text")
    .attr("x", 24)
    .attr("y", 8)
    .attr("dominant-baseline", "middle")
    .attr("font-size", 12)
    .attr("fill", "#ffffff")
    .text((d) => `${d.series}: ${d.startValue.toFixed(1)}% -> ${d.endValue.toFixed(1)}%`);
}

function drawYearlyGapBars(data) {
  const width = 920;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 44, left: 60 };
  const svg = d3.select("#chart-yearly-gap").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const yearly = Array.from(
    d3.rollup(
      data,
      (values) => d3.mean(values, (d) => d.gap),
      (d) => d.date.getFullYear()
    ),
    ([year, avgGap]) => ({ year: String(year), avgGap })
  ).sort((a, b) => d3.ascending(+a.year, +b.year));

  const maxAbs = Math.ceil(d3.max(yearly, (d) => Math.abs(d.avgGap)));
  const x = d3.scaleBand()
    .domain(yearly.map((d) => d.year))
    .range([margin.left, width - margin.right])
    .padding(0.22);

  const y = d3.scaleLinear()
    .domain([-maxAbs, maxAbs])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", palette.baseline)
    .attr("stroke-width", 1.2);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(7).tickFormat((d) => `${d > 0 ? "+" : ""}${d}%`).tickSizeOuter(0))
    .call((g) => g.select(".domain").remove());

  const zeroY = y(0);

  svg.selectAll("rect")
    .data(yearly)
    .join("rect")
    .attr("class", "yearly-gap-bar")
    .attr("x", (d) => x(d.year))
    .attr("width", x.bandwidth())
    .attr("y", zeroY)
    .attr("height", 0)
    .attr("data-target-y", (d) => (d.avgGap >= 0 ? y(d.avgGap) : y(0)))
    .attr("data-target-height", (d) => Math.abs(y(d.avgGap) - y(0)))
    .attr("data-zero-y", zeroY)
    .attr("fill", palette.gap);

  svg.selectAll(".yearly-gap-label")
    .data(yearly)
    .join("text")
    .attr("class", "yearly-gap-label")
    .attr("x", (d) => x(d.year) + x.bandwidth() / 2)
    .attr("y", (d) => (d.avgGap >= 0 ? y(d.avgGap) - 8 : y(d.avgGap) + 14))
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("fill", "#ffffff")
    .attr("opacity", 0)
    .text((d) => `${d.avgGap > 0 ? "+" : ""}${d.avgGap.toFixed(1)}`);
}

function drawParticipationChart(data) {
  const width = 920;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 40, left: 56 };
  const svg = d3.select("#chart-participation").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yMin = Math.floor(d3.min(data, (d) => Math.min(d.maParticipation, d.usParticipation)));
  const yMax = Math.ceil(d3.max(data, (d) => Math.max(d.maParticipation, d.usParticipation)));
  const y = d3.scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = (key) => d3.line()
    .x((d) => x(d.date))
    .y((d) => y(d[key]));

  svg.append("g")
    .attr("stroke", palette.grid)
    .attr("stroke-dasharray", "2,3")
    .selectAll("line")
    .data(y.ticks())
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d));

  svg.append("path")
    .datum(data)
    .attr("class", "line-participation-ma")
    .attr("fill", "none")
    .attr("stroke", palette.ma)
    .attr("stroke-width", 2.8)
    .attr("d", line("maParticipation"));

  svg.append("path")
    .datum(data)
    .attr("class", "line-participation-us")
    .attr("fill", "none")
    .attr("stroke", palette.us)
    .attr("stroke-width", 2.8)
    .attr("d", line("usParticipation"));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(7).tickFormat((d) => `${d}%`).tickSizeOuter(0))
    .call((g) => g.select(".domain").remove());
}

function drawMonthlyMaChangeChart(data) {
  const width = 920;
  const height = 360;
  const margin = { top: 24, right: 24, bottom: 42, left: 62 };
  const svg = d3.select("#chart-mom-change").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const changes = data.slice(1).map((d, i) => ({
    date: d.date,
    change: +(d.ma - data[i].ma).toFixed(1)
  }));

  const maxAbs = Math.max(0.5, Math.ceil(d3.max(changes, (d) => Math.abs(d.change)) * 2) / 2);
  const x = d3.scaleBand()
    .domain(changes.map((d) => d.date.getTime()))
    .range([margin.left, width - margin.right])
    .padding(0.12);

  const y = d3.scaleLinear()
    .domain([-maxAbs, maxAbs])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", palette.baseline)
    .attr("stroke-width", 1.2);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickValues(changes.filter((_, i) => i % 12 === 0).map((d) => d.date.getTime()))
        .tickFormat((d) => d3.timeFormat("%Y")(new Date(+d)))
        .tickSizeOuter(0)
    );

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(7).tickFormat((d) => `${d > 0 ? "+" : ""}${d.toFixed(1)} pts`).tickSizeOuter(0))
    .call((g) => g.select(".domain").remove());

  svg.selectAll(".mom-change-bar")
    .data(changes)
    .join("rect")
    .attr("class", "mom-change-bar")
    .attr("x", (d) => x(d.date.getTime()))
    .attr("width", x.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("data-target-y", (d) => (d.change >= 0 ? y(d.change) : y(0)))
    .attr("data-target-height", (d) => Math.abs(y(d.change) - y(0)))
    .attr("data-zero-y", y(0))
    .attr("fill", (d) => (d.change >= 0 ? palette.gap : palette.us));
}

function animatePathDraw(pathSelection, durationMs = 1400, delayMs = 0) {
  pathSelection.each(function animate() {
    const path = d3.select(this);
    const totalLength = this.getTotalLength();

    path
      .interrupt()
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .delay(delayMs)
      .duration(durationMs)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0)
      .on("end", function cleanup() {
        d3.select(this)
          .attr("stroke-dasharray", null)
          .attr("stroke-dashoffset", null);
      });
  });
}

function playChartAnimation(chartKey) {
  if (chartKey === "main") {
    animatePathDraw(d3.select("#chart-main .line-ma"), 1500, 0);
    animatePathDraw(d3.select("#chart-main .line-us"), 1500, 160);
    return;
  }

  if (chartKey === "gap") {
    animatePathDraw(d3.select("#chart-gap .line-gap"), 1400, 0);
    return;
  }

  if (chartKey === "map") {
    d3.select("#chart-map .ma-highlight")
      .interrupt()
      .attr("opacity", 0.2)
      .transition()
      .duration(850)
      .attr("opacity", 1)
      .transition()
      .duration(850)
      .attr("opacity", 0.8);
    return;
  }

  if (chartKey === "recovery") {
    animatePathDraw(d3.selectAll("#chart-recovery .recovery-line"), 1300, 0);
    return;
  }

  if (chartKey === "yearly-gap") {
    d3.selectAll("#chart-yearly-gap .yearly-gap-bar")
      .interrupt()
      .attr("y", function resetY() { return +this.getAttribute("data-zero-y"); })
      .attr("height", 0)
      .transition()
      .duration(900)
      .delay((_, i) => i * 90)
      .attr("y", function targetY() { return +this.getAttribute("data-target-y"); })
      .attr("height", function targetH() { return +this.getAttribute("data-target-height"); });

    d3.selectAll("#chart-yearly-gap .yearly-gap-label")
      .interrupt()
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .delay((_, i) => 300 + i * 90)
      .attr("opacity", 1);
    return;
  }

  if (chartKey === "participation") {
    animatePathDraw(d3.select("#chart-participation .line-participation-ma"), 1400, 0);
    animatePathDraw(d3.select("#chart-participation .line-participation-us"), 1400, 150);
    return;
  }

  if (chartKey === "mom-change") {
    d3.selectAll("#chart-mom-change .mom-change-bar")
      .interrupt()
      .attr("y", function resetY() { return +this.getAttribute("data-zero-y"); })
      .attr("height", 0)
      .transition()
      .duration(900)
      .delay((_, i) => i * 12)
      .attr("y", function targetY() { return +this.getAttribute("data-target-y"); })
      .attr("height", function targetH() { return +this.getAttribute("data-target-height"); });
  }
}

function setupScrollAnimations() {
  const revealNodes = document.querySelectorAll(".reveal");
  const chartSections = document.querySelectorAll("[data-animate-chart]");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));

  const chartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        playChartAnimation(entry.target.dataset.animateChart);
      });
    },
    { threshold: 0.45 }
  );

  chartSections.forEach((section) => chartObserver.observe(section));
}

function setupTypewriterMessage() {
  const messageSection = document.querySelector(".inpage-message");
  const message = document.querySelector(".inpage-message p");
  if (!messageSection || !message) return;

  const fullText = message.textContent.trim();
  message.dataset.fullText = fullText;
  message.textContent = "";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    message.textContent = fullText;
    return;
  }

  let hasTyped = false;
  const typeObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || hasTyped) return;
        hasTyped = true;
        observer.unobserve(entry.target);

        message.classList.add("is-typing");
        let i = 0;
        const speedMs = 16;
        const timer = window.setInterval(() => {
          i += 1;
          message.textContent = fullText.slice(0, i);
          if (i >= fullText.length) {
            window.clearInterval(timer);
            message.classList.remove("is-typing");
          }
        }, speedMs);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  typeObserver.observe(messageSection);
}

d3.text("massachusetts_unemployment.csv")
  .then(parseData)
  .then((data) => {
    renderKpis(data);
    setupKpiExplainers();
    drawMainChart(data);
    drawMassachusettsMap();
    drawGapChart(data);
    drawRecoverySlopeChart(data);
    drawYearlyGapBars(data);
    drawParticipationChart(data);
    drawMonthlyMaChangeChart(data);
    setupScrollAnimations();
    setupTypewriterMessage();
  })
  .catch((error) => {
    const storyRoot = document.getElementById("story");
    if (storyRoot) {
      const errorText = document.createElement("p");
      errorText.className = "story-note";
      errorText.textContent = `Chart failed to load: ${error.message}`;
      storyRoot.appendChild(errorText);
    }
  });
