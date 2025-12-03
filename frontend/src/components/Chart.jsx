// Chart.jsx
import React, { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

const Chart = ({ data, height = 400, theme }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Initialize chart (recreate when height or theme changes)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const isDark = theme === "dark" || document.documentElement.classList.contains("dark");
    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: "solid", color: isDark ? "#0b1120" : "#ffffff" },
        textColor: isDark ? "#e5e7eb" : "#333333",
      },
      grid: {
        vertLines: { color: isDark ? "#0f1724" : "#eeeeee" },
        horzLines: { color: isDark ? "#0f1724" : "#eeeeee" },
      },
      rightPriceScale: {
        borderColor: isDark ? "#1f2937" : "#cccccc",
        visible: true,
      },
      timeScale: {
        borderColor: isDark ? "#1f2937" : "#cccccc",
      },
      crosshair: { mode: 1 },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      lineWidth: 2,
      lineColor: isDark ? "#60a5fa" : "#2962FF",
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    if (data && data.length > 0) {
      seriesRef.current.setData(data);
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
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
  }, [height, theme]); // re-init chart when height or theme changes

  // Update data when `data` changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !data) return;
    seriesRef.current.setData(data);
    chartRef.current.timeScale().fitContent();
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: "100%", height }} />;
};

export default Chart;