import React, { useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import "./Narrative.css";
import Spinner from "./spinner.js";

d3.selection.prototype.goUp = function() {
  return d3.select(this.node().parentNode);
};

const buildBubble = (node, data) => {
  const margin = { top: 10, right: 30, bottom: 40, left: 10 },
    width = 900 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;

  const formatPerc = d3.format(".1%");
  const pack = data =>
    d3
      .pack()
      .size([width - 2, height - 2])
      .padding(3)(d3.hierarchy({ children: data }).sum(d => d.value));

  const colors = d3.scaleOrdinal([...d3.schemeSet1, ...d3.schemeSet2]);
  const root = pack(data);
  const svg = d3
    .select(node)
    .append("svg")
    .style("width", width)
    .style("height", height)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle");

  const leaf = svg
    .selectAll("g")
    .append("g")
    .data(root.leaves());

  const entrance = leaf.enter().append("g");

  const circles = entrance.append("circle");

  circles
    .attr("class", d => (d.data.perc > 0.09 ? "dominant" : "small"))
    .attr("r", d => 0)
    .attr("fill", d => {
      return colors(d.data.category);
    })
    .style("stroke", "black")
    .attr("opacity", d => (d.data.perc < 0.09 ? ".2" : "1"))
    .transition()
    .delay(function(d, i) {
      return i * 2;
    })
    .attr("r", d => d.r)
    .duration(2000);

  entrance
    .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`)
    .append("text")
    .selectAll("tspan")
    .data(d => [d.data.category, formatPerc(d.data.perc)])
    .join("tspan")
    .attr("x", 0)
    .attr("y", (d, i, nodes) => `${i * 1.3 - nodes.length / 2 + 1}em`)
    .attr("font-weight", "normal")
    .attr("font-size", 0)
    .text(d => d)
    .transition()
    .delay(function(d, i) {
      return i * 2;
    })
    .attr("font-size", 14)
    .duration(2000);

  const loop = d3
    .selectAll("circle.dominant")
    .transition()
    .delay(2000)
    .on("start", function repeat() {
      d3.active(this)
        .attr("r", d => d.r)
        .transition()
        .delay(1000)
        .attr("r", d => d.r - 4)
        .transition()
        .on("start", repeat);
    });

  d3.selectAll("circle.dominant + text")
    .selectAll("tspan")
    .transition()
    .duration(2000)
    .attr("font-size", 18);
};

const buildCatsByDon = data => {
  let catsByDonation = {};
  data.forEach(d => {
    if (!d.Number_of_Donators) return;
    if (catsByDonation[d.Category] == null) {
      catsByDonation[d.Category] = parseFloat(d.Number_of_Donators);
    } else {
      catsByDonation[d.Category] =
        catsByDonation[d.Category] + parseFloat(d.Number_of_Donators);
    }
  });

  let dataArr = Object.entries(catsByDonation)
    .sort((a, b) => b[1] - a[1])
    .reduce(function(acc, cur, i) {
      acc = [...acc, { category: cur[0], value: cur[1] }];
      return acc;
    }, []);
  const total = d3.sum(dataArr, d => d.value);
  dataArr.map(function(d) {
    d.perc = d.value / total;
    return d;
  });
  return dataArr;
};

const BubbleSection = props => {
  const [data, setData] = useState(null);
  const bubbleRef = useCallback(
    node => {
      if (node !== null && data != null) {
        while (node.lastChild) {
          node.removeChild(node.lastChild);
        }
        buildBubble(node, data);
      }
    },
    [data]
  );
  useEffect(() => {
    async function fetchData() {
      let data = await d3.csv("./gfm.csv");
      data = buildCatsByDon(data);
      setData(data);
    }
    fetchData();
  }, []);
  if (!data) return <Spinner />;
  return (
    <div className="Narrative-container">
      <div className="Narrative-textSide">
        <p>
          <strong>GoFundMe</strong> describes itself as a crowdfunding platform
          that allows people to raise money for events ranging from life events
          such as celebrations and graduations to challenging circumstances like
          accidents and illnesses.From 2010 to the beginning of 2020, over $9
          billion has been raised on the platform [
          <a href="https://en.wikipedia.org/wiki/GoFundMe">1</a>]. However, it
          is increasingly associated with users in desperate situations as a
          sort of safety net to help them through hard times.
        </p>
        <p>
          Using a dataset that scraped the first 4 pages of each category in
          2018, some clear patterns emerge. The number of total individual
          donations for the categories 
          <strong> Family, Medical, Memorial, and Emergency</strong> account for
          over <strong>40%</strong> of all donations.{" "} 
        </p>
      </div>
      <div className="Bubble-container">
        <h3> Percentage of Individual Donations by Category</h3>
        <div className="BubbleChart-container">
          <div className="BubbleChart" ref={bubbleRef} />
        </div>
      </div>
    </div>
  );
};

export default BubbleSection;
