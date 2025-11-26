// Chart.jsx
import React, { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

const Chart = ({ data, height = 400 }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Initialize chart once
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: "solid", color: "#ffffff" },
        textColor: "#333333",
      },
      grid: {
        vertLines: { color: "#eeeeee" },
        horzLines: { color: "#eeeeee" },
      },
      rightPriceScale: {
        borderColor: "#cccccc",
      },
      timeScale: {
        borderColor: "#cccccc",
      },
    });

    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries, {
      lineWidth: 2,
      lineColor: "#2962FF",
    });
    seriesRef.current = lineSeries;

    // Initial data
    if (data && data.length > 0) {
      lineSeries.setData(data);
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [height]); // height affects chart init

  // Update data when `data` changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !data) return;
    seriesRef.current.setData(data);
    chartRef.current.timeScale().fitContent();
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: "100%", height }} />;
};

export default Chart;