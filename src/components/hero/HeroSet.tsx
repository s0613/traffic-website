"use client";

import { useEffect, useState, useRef } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";

import DatePicker, { registerLocale } from "react-datepicker";
import { enUS } from "date-fns/locale";

ChartJS.register(CategoryScale, LinearScale, BarElement);
registerLocale("en", enUS);

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
    }[];
}

export function useHeroSet() {
    const MAX_DATA_POINTS = 50;

    // 사이트 목록 및 선택 상태
    const [websites, setWebsites] = useState<string[]>([]);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    // 릴리즈 시간 (Date 객체)
    const [releaseTime, setReleaseTime] = useState<Date | null>(null);

    // 현재 시간, 국가 정보
    const [currentTime, setCurrentTime] = useState(new Date());
    const [country, setCountry] = useState("");

    // 차트 상태
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

    // 최적 진입 시간 관련 상태
    const [optimalTimeMessage, setOptimalTimeMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    // 주기적 요청(인터벌) 관리
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1) 현재 시간 1초 간격 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 2) IP 기반 국가 정보
    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const response = await fetch("http://ip-api.com/json/");
                const locationData = await response.json();
                if (locationData.status === "success") {
                    setCountry(locationData.country);
                }
            } catch (error) {
                console.error("Error fetching location:", error);
            }
        };
        fetchLocation();
    }, []);

    // 3) 서버에서 사이트 목록 불러오기
    useEffect(() => {
        const fetchWebsites = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/sites/");
                if (!response.ok) {
                    throw new Error(`Failed to fetch websites: ${response.statusText}`);
                }
                const result = await response.json();
                const siteDomains = result.sites.map((site: { domain: string }) => site.domain);
                setWebsites(siteDomains);
            } catch (error) {
                console.error("Error fetching websites:", error);
            }
        };
        fetchWebsites();
    }, []);

    // 빈 요청을 보내고 응답 시간을 측정하는 함수
    const measureResponseTime = async (): Promise<number> => {
        if (!selectedUrl) return 0;
        const start = performance.now();
        try {
            await fetch(selectedUrl, { method: "GET" }); // CORS 허용 가정
        } catch (err) {
            console.error("Error measuring response time:", err);
        }
        const end = performance.now();
        return (end - start) / 1000; // ms → 초
    };

    // 차트에 새 응답 시간을 추가
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

    // 최적 진입 시간 API 호출
    const fetchOptimalTime = async () => {
        if (!selectedUrl || !releaseTime) {
            setOptimalTimeMessage("Please select a site and choose a release time.");
            return;
        }

        try {
            const currentTimeNow = new Date();
            const currentTimeISO = currentTimeNow.toISOString();
            const releaseTimeISO = releaseTime.toISOString();

            console.log("Sending request with data:", {
                site_domain: selectedUrl,
                release_time: releaseTimeISO,
                current_time: currentTimeISO,
            });

            const response = await fetch("http://127.0.0.1:8000/api/best_entry_time/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    site_domain: selectedUrl,
                    release_time: releaseTimeISO,
                    current_time: currentTimeISO,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch optimal time");
            }

            const result = await response.json();
            console.log("Received response:", result);

            if (response.ok && result.optimal_time) {
                const optimalTimeLocal = new Date(result.optimal_time).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });
                setOptimalTimeMessage(`Optimal entry time: ${optimalTimeLocal}`);
            } else {
                setOptimalTimeMessage(result.error || "An unknown error occurred.");
            }
        } catch (error) {
            let errorMessage = "An error occurred while fetching the optimal entry time.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.error("Error fetching optimal time:", error);
            setOptimalTimeMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 3초 간격 루프 시작
    const startRequestLoop = () => {
        if (!selectedUrl || !releaseTime) {
            setOptimalTimeMessage("Please select a site and choose a release time.");
            return;
        }
        setIsRunning(true);
        setLoading(true);
        setOptimalTimeMessage("");

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // 3초마다: 응답 시간 + 최적 진입 시간
        intervalRef.current = setInterval(async () => {
            console.log("3 seconds passed. Measuring response time & fetching optimal time...");

            const responseTimeSec = await measureResponseTime();
            addResponseTimeToChart(responseTimeSec);

            await fetchOptimalTime();
        }, 3000);

        // 최초 한 번 즉시 실행
        (async () => {
            const responseTimeSec = await measureResponseTime();
            addResponseTimeToChart(responseTimeSec);
            await fetchOptimalTime();
        })();
    };

    // 루프 중지
    const stopRequestLoop = () => {
        setIsRunning(false);
        setLoading(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        console.log("Request loop stopped.");
    };

    // 언마운트 시 인터벌 정리
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    // 차트 옵션
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
        plugins: { legend: { display: false } },
    };

    return {
        websites,
        selectedUrl,
        setSelectedUrl,
        releaseTime,
        setReleaseTime,
        currentTime,
        country,
        data,
        options,
        optimalTimeMessage,
        loading,
        isRunning,
        startRequestLoop,
        stopRequestLoop,
        // 아래 값들은 UI에서 직접 사용할 수 있도록 노출
    };
}
