import React from "react";
import "./loader.css";

export default function Loader() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p className="loading-text">Loading data...</p>
    </div>
  );
}
