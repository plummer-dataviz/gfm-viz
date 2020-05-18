import React, { useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import * as Sentiment from "sentiment";
import _ from "lodash";
import "./Narrative.css";
import Spinner from "./spinner";
import Select from "react-select";
const sentiment = new Sentiment();

const TOP_4 = ["medical", "memorial", "family", "emergency"];

const buildBee = (node, data, category) => {
  const margin = { top: 20, right: 20, bottom: 30, left: 20 };
  const padding = 1;
  const height = 550;
  const width = 700;
  let radius = 1.8;
  const x = d3
    .scaleLinear()
    .domain([-25, 30])
    .range([margin.left, width - margin.right]);

  let svg;
  if (!node.children.length) {
    svg = d3
      .select(node)
      .append("svg")
      .attr("viewBox", [0, 0, width, height]);
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "tooltip")
      .attr("style", "position: absolute; opacity: 0;");
    const xAxis = g =>
      g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0));
    svg.append("g").call(xAxis);
  } else {
    svg = d3.select(node.children[0]);
  }
  if (category) {
    data = data.filter(d => TOP_4.indexOf(d.Category.toLowerCase()) !== -1);
  }
  data = dodge(data, radius * 2 + padding, x, category);
  let circles;
  if (!node.getElementsByClassName("hello").length) {
    circles = svg
      .append("g")
      .attr("class", "hello")
      .selectAll(`circle.circle`)
      .data(data, d => d.data.Title);
  } else {
    circles = d3
      .select(node.children[0].getElementsByClassName("hello")[0])
      .selectAll(`circle.circle`)
      .data(data, d => d.data.Title);
  }
  circles
    .join(
      enter =>
        enter
          .append("circle")
          .style("opacity", 0)
          .attr("cx", d => d.x)
          .attr("cy", d => height - margin.bottom - radius - padding)
          .call(enter =>
            enter
              .transition()
              .duration(1000)
              .attr("cx", d => d.x)
              .attr("cy", d => height - margin.bottom - radius - padding - d.y)
              .attr("r", radius)
              .attr("class", d => `circle circle-${d.data.Category}`)
              .attr("fill", d => {
                return d3.interpolateRdYlBu(d.data.text_sentiment);
              })

              .style("opacity", 1)
          ),
      update =>
        update.call(update =>
          update
            .transition()
            .duration(1000)
            .attr("cx", d => d.x)
            .attr("cy", d => height - margin.bottom - radius - padding - d.y)
        ),
      exit => {
        return exit.style("opacity", 1).call(exit =>
          exit
            .transition()
            .duration(1000)
            .attr("cy", d => height - margin.bottom - radius - padding)
            .remove()
        );
      }
    )
    .on("mouseover", function(d) {
      d3.select("#tooltip")
        .transition()
        .duration(200)
        .style("opacity", 1)
        .text(d.data.Text);
    })
    .on("mouseout", function() {
      d3.select("#tooltip").style("opacity", 0);
    })
    .on("mouseexit", function() {
      d3.select("#tooltip").style("opacity", 0);
    })
    .on("mousemove", function() {
      d3.select("#tooltip")
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY + 10 + "px");
    });
};

const dodge = (data, radius, x, category) => {
  const radius2 = radius ** 2;
  const circles = data
    .map(d => ({ x: x(d.text_sentiment), data: d }))
    .sort((a, b) => a.x - b.x);
  const epsilon = 1e-3;
  let head = null,
    tail = null;

  // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
  function intersects(x, y) {
    let a = head;
    while (a) {
      if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
        return true;
      }
      a = a.next;
    }
    return false;
  }

  // Place each circle sequentially.
  for (const b of circles) {
    // Remove circles from the queue that can’t intersect the new circle b.
    while (head && head.x < b.x - radius2) head = head.next;

    // Choose the minimum non-intersecting tangent.
    if (intersects(b.x, (b.y = 0))) {
      let a = head;
      b.y = Infinity;
      do {
        let y = a.y + Math.sqrt(radius2 - (a.x - b.x) ** 2);
        if (y < b.y && !intersects(b.x, y)) b.y = y;
        a = a.next;
      } while (a);
    }

    // Add b to the queue.
    b.next = null;
    if (head === null) head = tail = b;
    else tail = tail.next = b;
  }

  return circles;
};

const Narrative = props => {
  const [data, setData] = useState(null);
  const [category, setCategory] = useState(false);
  const [totals, setTotals] = useState({});
  const [filteredTotals, setFilteredTotals] = useState({});
  const beeRef = useCallback(
    node => {
      if (node !== null && data != null) {
        buildBee(node, data, category);
      }
    },
    [data, category]
  );
  useEffect(() => {
    async function fetchData() {
      let data = await d3.csv("./gfm.csv");
      data = data.map(d => {
        d.Text = d.Text.replace(/\W/g, " ");
        d.text_sentiment = sentiment.analyze(d.Text).score;
        d.title_sentiment = sentiment.analyze(d.Title).score;
        return d;
      });
      data = _.orderBy(data, ["Category"], ["asc"]);
      setData(data);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let positive = 0;
    let negative = 0;
    let all = 0;
    if (data) {
      data.forEach(d => {
        if (d.text_sentiment > 0) {
          positive = positive + 1;
        } else {
          negative = negative + 1;
        }
        all = all + 1;
      });
      setTotals({ positive, negative, all });

      positive = 0;
      negative = 0;
      all = 0;
      data.forEach(d => {
        if (TOP_4.indexOf(d.Category.toLowerCase()) !== -1) {
          if (d.text_sentiment > 0) {
            positive = positive + 1;
          } else {
            negative = negative + 1;
          }
          all = all + 1;
          setFilteredTotals({ positive, negative, all });
        }
      });
    }
  }, [data, category]);

  if (!data) return <Spinner />;
  console.log(totals);
  console.log(filteredTotals);

  return (
    <div className="Narrative-container">
      <div className="Narrative-textSide">
        <p>
          {" "}
          Perfoming a sentiment analysis on the text of go fund me campaign
          descriptions, we find them generally pitched with a positive sentiment
          - <strong>{d3.format(".1%")(totals.positive / totals.all)}</strong> of
          all GoFundMe descriptions tilt positive.
        </p>
        <p>
          This changes when looking at the top 4 categories -{" "}
          <strong> Family, Medical, Memorial, and Emergency</strong> - positive
          sentiment drops to{" "}
          <strong>
            {d3.format(".1%")(filteredTotals.positive / filteredTotals.all)}
          </strong>{" "}
        </p>
      </div>
      <div className="BeeSwarmContainer">
        <h3 className="BeeChart-headline">
          {" "}
          Sentiment Analysis of GoFundMe Campaign Descriptions
        </h3>
        <h5 className="BeeChart-headline">
          View By:{" "}
          <button onClick={() => setCategory(false)}>All Categories</button> |{" "}
          <button onClick={() => setCategory(true)}>
            Top 4 Categories(Family, Medical, Memorial, and Emergency){" "}
          </button>{" "}
        </h5>
        <div className="BeeChart-container animate__animated animate__fadeIn">
          <div className="BeeChart" key={"BeeChart"} ref={beeRef} />
          <div className="BeeChart-labels">
            <div className="BeeChart-left">More Negative</div>
            <div className="BeeChart-right">More Positive</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Narrative;

// var foods = ['hotdog', 'hamburger', 'soup', 'sandwich', 'hotdog', 'watermelon', 'hotdog'];
// var result = _.chain(foods).countBy().pairs().max(_.last).head().value();
// console.log(result);
