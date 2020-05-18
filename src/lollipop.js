import React, { useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import "./Narrative.css";
import "./lollipop.css";
import Spinner from "./spinner.js";

const buildLol = (node, data) => {
  const margin = { top: 10, right: 30, bottom: 40, left: 50 },
    width = 750 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("style", "position: absolute; opacity: 0;");
  const svg = d3
    .select(node)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Parse the Data

  // Add X axis
  const x = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function(d) {
        return d.value;
      })
    ])
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y axis
  const y = d3
    .scaleBand()
    .range([0, height])
    .domain(
      data.map(function(d) {
        return d.word;
      })
    )
    .padding(1);
  svg.append("g").call(d3.axisLeft(y));

  // Lines

  svg
    .selectAll("myline")
    .data(data)
    .enter()
    .append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", function(d) {
      return y(d.word);
    })
    .attr("y2", function(d) {
      return y(d.word);
    })
    .attr("stroke", "grey");

  // Circles -> start at X=0
  svg
    .selectAll("mycircle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", x(0))
    .attr("cy", function(d) {
      return y(d.word);
    })
    .attr("r", "7")
    .style("fill", "#69b3a2")
    .attr("stroke", "black")
    .on("mouseover", function(d) {
      d3.select("#tooltip")
        .transition()
        .duration(200)
        .style("opacity", 1)
        .text(`Occurences: ${d.value}`);
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

  // Change the X coordinates of line and circle
  svg
    .selectAll("circle")
    .transition()
    .duration(2000)
    .attr("cx", function(d) {
      return x(d.value);
    });

  svg
    .selectAll("line")
    .transition()
    .duration(2000)
    .attr("x1", function(d) {
      return x(d.value);
    });
};
const stopWords = [
  "a",
  "able",
  "about",
  "across",
  "after",
  "all",
  "almost",
  "also",
  "am",
  "among",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "but",
  "by",
  "can",
  "cannot",
  "could",
  "dear",
  "did",
  "do",
  "does",
  "either",
  "else",
  "ever",
  "every",
  "for",
  "from",
  "get",
  "got",
  "had",
  "has",
  "have",
  "he",
  "her",
  "hers",
  "him",
  "his",
  "how",
  "however",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "least",
  "let",
  "like",
  "likely",
  "may",
  "me",
  "might",
  "most",
  "must",
  "my",
  "neither",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "often",
  "on",
  "only",
  "or",
  "other",
  "our",
  "own",
  "rather",
  "said",
  "say",
  "says",
  "she",
  "should",
  "since",
  "so",
  "some",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "tis",
  "to",
  "too",
  "twas",
  "us",
  "wants",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "yet",
  "you",
  "your",
  "ain't",
  "aren't",
  "can't",
  "could've",
  "couldn't",
  "didn't",
  "doesn't",
  "don't",
  "hasn't",
  "he'd",
  "he'll",
  "he's",
  "how'd",
  "how'll",
  "how's",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "isn't",
  "it's",
  "might've",
  "mightn't",
  "must've",
  "mustn't",
  "shan't",
  "she'd",
  "she'll",
  "she's",
  "should've",
  "shouldn't",
  "that'll",
  "that's",
  "there's",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "wasn't",
  "we'd",
  "we'll",
  "we're",
  "weren't",
  "what'd",
  "what's",
  "when'd",
  "when'll",
  "when's",
  "where'd",
  "where'll",
  "where's",
  "who'd",
  "who'll",
  "who's",
  "why'd",
  "why'll",
  "why's",
  "won't",
  "would've",
  "wouldn't",
  "you'd",
  "you'll",
  "you're",
  "you've"
];

const buildWordDict = (data, section) => {
  let words = "";
  data.forEach(d => (words = words.concat(` ${d[section]}`)));
  const wordCounts = {};
  const alphaText = words.replace(/[^a-zA-Z ]/g, "");
  const spaceRemoved = alphaText.replace(/  /g, " ");
  const cleanWords = spaceRemoved.split(" ");

  cleanWords.forEach(word => {
    const lowerCase = word.toLowerCase();
    if (lowerCase.length <= 3) return;
    if (stopWords.indexOf(lowerCase) !== -1) return;
    if (wordCounts[lowerCase] == null) {
      wordCounts[lowerCase] = 1;
    } else {
      wordCounts[lowerCase] = wordCounts[lowerCase] + 1;
    }
  });

  let dataArr = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
  dataArr = dataArr.slice(0, 10);
  let dataObj = dataArr.reduce(function(acc, cur, i) {
    acc = [...acc, { word: cur[0], value: cur[1] }];
    return acc;
  }, []);

  return dataObj;
};

const LollipopSection = props => {
  const [data, setData] = useState(null);
  const [section, setSection] = useState("Text");
  const lolRef = useCallback(
    node => {
      if (node !== null && data != null) {
        while (node.lastChild) {
          node.removeChild(node.lastChild);
        }
        buildLol(node, data, section);
      }
    },
    [data, section]
  );
  useEffect(() => {
    async function fetchData() {
      let data = await d3.csv("./gfm.csv");
      data = buildWordDict(data, section);
      setData(data);
    }
    fetchData();
  }, [section]);
  if (!data) return <Spinner />;
  return (
    <div className="Narrative-container">
      <div className="Narrative-textSide">
        <p>This trend continues when we analyze word breakdowns in GoFundMe descriptions. the words <strong>Help, Needs, and Today</strong> appear far more often then any other word, denoting that people are using the platform mainly for immediate relief.</p>
      </div>
      <div className="Lollipop-container">
        <h3>
          {" "}
          Most common words used in a GoFundMe{" "}
          {section === "Text" ? "description" : "title"}.
        </h3>

        <div className="LollipopChart-container">
          <h5>
            View Most Used Words In:{" "}
            <button onClick={() => setSection("Text")}>Description</button> |{" "}
            <button onClick={() => setSection("Title")}> Title</button>{" "}
          </h5>
          <div className="LollipopChart" ref={lolRef} />
        </div>
      </div>
    </div>
  );
};

export default LollipopSection;

// var foods = ['hotdog', 'hamburger', 'soup', 'sandwich', 'hotdog', 'watermelon', 'hotdog'];
// var result = _.chain(foods).countBy().pairs().max(_.last).head().value();
// console.log(result);
