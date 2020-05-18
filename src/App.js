import React, { useState } from "react";
import "./App.css";
import Narrative from "./narrative.js";
import Lollipop from "./lollipop.js";
import DownArrow from "./down-arrow.js";
import UpArrow from "./up-arrow.js";
import Scatter from "./scatter.js";
import Bubble from "./bubble.js";

const sections = ["beeswarm", "lollipop", "scatter"];
function App() {
  const [section, setSection] = useState("beeswarm");
  const nextSection = () => {
    setSection(sections[sections.indexOf(section) + 1]);
  };
  const prevSection = () => {
    setSection(sections[sections.indexOf(section) - 1]);
  };

  const loadSection = () => {
    switch (section) {
      case "beeswarm":
        return <Bubble nextSection={nextSection} />;
      case "lollipop":
        return <Lollipop nextSection={nextSection} />;
      case "scatter":
        return <Narrative nextSection={nextSection} />;
      default:
        return null;
    }
  };
  return (
    <div className="App">
      {sections[sections.indexOf(section) - 1] !== undefined && <UpArrow onClick={prevSection} />}
      {loadSection()}
      {sections[sections.indexOf(section) + 1] !== undefined && <DownArrow onClick={nextSection} />}
    </div>
  );
}

export default App;
