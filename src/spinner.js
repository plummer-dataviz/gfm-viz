import React from "react";
import "./spinner.css"

function Spinner(props) {
  return (
    <div className="lds-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}


export default Spinner;
