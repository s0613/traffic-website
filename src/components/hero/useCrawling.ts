import { useEffect, useState, useRef } from "react";

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
    }[];
}

const useCrawling = (selectedUrl: string | null) => {
    const MAX_DATA_POINTS = 50;

    const [data, setData] = useState<ChartData>({
        labels: [],
        datasets: [
            {
                label: "Response Time (s)",
                data: [],
                backgroundColor: "rgba(75,192,192,0.8)",
            },
        ],
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const measureResponseTime = (url: string): Promise<number> => {
        return new Promise((resolve) => {
            // 언더스코어('_')를 도트('.')로 변환
            let formattedUrl = url.includes("_") ? url.replace(/_/g, ".") : url;
            // URL에 프로토콜이 없는 경우 기본적으로 https:// 추가
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }

            const img = new Image();
            const startTime = performance.now();

            const onComplete = () => {
                const responseTime = (performance.now() - startTime) / 1000; // 초 단위
                resolve(responseTime);
            };

            img.onload = onComplete;
            img.onerror = onComplete;

            // favicon.ico 요청, 캐시 방지를 위해 타임스탬프 쿼리 추가
            img.src = `${formattedUrl}`;
        });
    };

    const addResponseTimeToChart = (newResponseTime: number) => {
        const timestamp = new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        setData((prev) => {
            const newLabels = [...prev.labels, timestamp].slice(-MAX_DATA_POINTS);
            const newData = [...prev.datasets[0].data, newResponseTime].slice(-MAX_DATA_POINTS);
            return {
                ...prev,
                labels: newLabels,
                datasets: [
                    {
                        ...prev.datasets[0],
                        data: newData,
                    },
                ],
            };
        });
    };

    const startRequestLoop = () => {
        if (!selectedUrl) return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(async () => {
            const responseTimeSec = await measureResponseTime(selectedUrl);
            addResponseTimeToChart(responseTimeSec);
        }, 3000);

        (async () => {
            const responseTimeSec = await measureResponseTime(selectedUrl);
            addResponseTimeToChart(responseTimeSec);
        })();
    };

    const stopRequestLoop = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        if (selectedUrl) {
            setData({
                labels: [],
                datasets: [
                    {
                        label: "Response Time (s)",
                        data: [],
                        backgroundColor: "rgba(75,192,192,0.8)",
                    },
                ],
            });

            stopRequestLoop();
            startRequestLoop();
        }

        return () => {
            stopRequestLoop();
        };
    }, [selectedUrl]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                ticks: { autoSkip: false },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                min: 0,
                suggestedMax: 2,
                ticks: { stepSize: 0.1 },
            },
        },
        animation: { duration: 0 },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: "Response Time Over Time",
            },
        },
    };

    return { data, options };
};

export default useCrawling;
