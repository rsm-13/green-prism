import React from "react";
import "./loader.css";

// loader: simple spinner used while data is being fetched
export default function Loader() {
  return (
    <div className="loading-container">
      {/* spinner element: styled via loader.css */}
      <div className="spinner" />
      <p className="loading-text">Loading data...</p>
    </div>
  );
}
