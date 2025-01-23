"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// ChartJS 설정
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CrawlingChartProps {
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
        }[];
    };
    options: any;
}

const CrawlingChart: React.FC<CrawlingChartProps> = ({ data, options }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg w-full max-w-4xl overflow-x-auto">
            <div style={{ height: "400px", width: "100%" }}>
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default CrawlingChart;
