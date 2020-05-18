import React, { useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import * as Sentiment from "sentiment";
import _ from "lodash";
import "./Narrative.css";
import Spinner from "./spinner";
import Select from "react-select";
const sentiment = new Sentiment();

const buildBee = (node, data, category) => {
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const padding = 1;
  const height = 550;
  const width = 700;
  let radius = 3;
  let svg;
  if (category) data = data.filter(d => d.Category === category);
  let xScale = d3
    .scaleLinear()
    .domain([0, 150])
    .range([margin.left, width - margin.right]);

  let yScale = d3
    .scaleLinear()
    .domain([0, 1100])
    .range([height - margin.bottom, margin.top]);

  // AXES
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  if (!node.children.length) {
    svg = d3
      .select(node)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // add the xAxis
    svg
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .append("text")
      .attr("class", "axis-label")
      .attr("x", "50%")
      .attr("dy", "3em")
      .text("Sentiment Score");

    // add the yAxis
    svg
      .append("g")
      .attr("class", "axis y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .append("text")
      .attr("class", "axis-label")
      .attr("y", "50%")
      .attr("dx", "-3em")
      .attr("writing-mode", "vertical-rl")
      .text("Number of Donations");
  } else {
    svg = d3.select(node.children[0]);
  }
  // create an svg element in our main `d3-container` element
  const colors = d3.scaleOrdinal([...d3.schemeSet1, ...d3.schemeSet2]);
  const dot = svg
    .selectAll(".dot")
    .data(data, d => d.Title)
    .join(
      enter =>
        enter
          .append("circle")
          .attr("class", "dot") // Note: this is important so we can identify it in future updates
          .attr("stroke", "lightgrey")
          .attr("opacity", 0.5)
          .attr("fill", d => {
            return colors(d.Category);
          })
          .attr("r", radius)
          .attr("cy", d => yScale(parseFloat(d.Number_of_Donators)))
          .attr("cx", d => margin.left) // initial value - to be transitioned
          .call(enter =>
            enter
              .transition() // initialize transition
              .delay(function(d, i) {
                return i*2;
              })
              .duration(2000)
              .attr("cx", d => xScale(d.wordLength))
          ),
      update => update,
      exit =>
        exit.call(exit =>
          // exit selections -- all the `.dot` element that no longer match to HTML elements
          exit
            .transition()
            .delay(function(d, i) {
              return i * 3;
            })
            .duration(2000)
            .attr("cx", width)
            .remove()
        )
    );
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

const ScatterPlot = props => {
  const [data, setData] = useState(null);
  const [category, setCategory] = useState("");
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
        const words = d.Text;
        const alphaText = words.replace(/[^a-zA-Z ]/g, "");
        const spaceRemoved = alphaText.replace(/  /g, " ");
        const cleanWords = spaceRemoved.split(" ");
        d.wordLength = cleanWords.length;
        const titleWords = d.Title;
        const titleAlphaText = titleWords.replace(/[^a-zA-Z ]/g, "");
        const titleSpaceRemoved = titleAlphaText.replace(/  /g, " ");
        const titleCleanWords = titleSpaceRemoved.split(" ");
        d.titleWordLength = titleCleanWords.length;
        return d;
      });
      data = _.orderBy(data, ["Category"], ["asc"]);
      data = data.filter(d => d.Number_of_Donators);
      setData(data);
    }
    fetchData();
  }, []);
  if (!data) return <Spinner />;
  const categories = [...new Set(data.map(d => d.Category))];
  return (
    <div className="Narrative-container">
      <div className="Narrative-textSide">
        <p>
          {" "}
          Over here, I will describe the goal of these visualizations, as well
          as describe what a sentiment analysis is.
        </p>
      </div>
      <div className="BeeSwarmContainer">
        <h3 className="BeeChart-headline">
          {" "}
          Sentiment Analysis of GoFundMe Campaign Descriptions
        </h3>
        <div className="BeeChart-container animate__animated animate__fadeIn">
          <Select
            options={categories.map(c => {
              return { label: c, value: c };
            })}
            onChange={e => {
              setCategory(e.value);
            }}
          />
          <div className="BeeChart" key={"BeeChart"} ref={beeRef} />
        </div>
      </div>
    </div>
  );
};

export default ScatterPlot;

// var foods = ['hotdog', 'hamburger', 'soup', 'sandwich', 'hotdog', 'watermelon', 'hotdog'];
// var result = _.chain(foods).countBy().pairs().max(_.last).head().value();
// console.log(result);
