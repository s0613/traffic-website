"use client";

import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../common/Sidebar";
import CrawlingChart from "./CrawlingChart";
import useCrawling from "./useCrawling";

// MUI Date Pickers (최신 버전)
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers";

const HeroSection: React.FC = () => {
    const [websites, setWebsites] = useState<string[]>([]);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [releaseTime, setReleaseTime] = useState<Date | null>(null);

    const [country, setCountry] = useState("");
    const [userTimezone, setUserTimezone] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    const [optimalTimeMessage, setOptimalTimeMessage] = useState("");
    const [loading, setLoading] = useState(false); // 로딩 상태 추가

    const [isFirstRequest, setIsFirstRequest] = useState(true); // 최초 요청 여부
    const [hasPopupShown, setHasPopupShown] = useState(false); // 팝업 노출 여부
    const [isAutoRequestActive, setIsAutoRequestActive] = useState(false); // 자동 요청 활성화 상태

    const { data, options } = useCrawling(selectedUrl);

    const abortControllerRef = useRef<AbortController | null>(null);
    const autoRequestIntervalRef = useRef<NodeJS.Timeout | null>(null); // 자동 요청 인터벌 참조
    const BASE_URL = "http://134.195.158.7:8000"; // 기본 URL 설정

    useEffect(() => {
        const fetchWebsites = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/sites/`); // BASE_URL 사용
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

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const response = await fetch("http://ip-api.com/json/");
                const locationData = await response.json();
                if (locationData.status === "success") {
                    setCountry(locationData.country);
                    setUserTimezone(locationData.timezone);
                }
            } catch (error) {
                console.error("Error fetching location:", error);
            }
        };
        fetchLocation();
    }, []);

    useEffect(() => {
        if (!userTimezone) return;

        const intervalId = setInterval(() => {
            const localString = new Date().toLocaleString("en-US", { timeZone: userTimezone });
            setCurrentTime(new Date(localString));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [userTimezone]);

    const fetchOptimalTime = async () => {
        if (!selectedUrl || !releaseTime) {
            setOptimalTimeMessage("Please select a site and choose a release time.");
            return;
        }

        // 이전 요청이 있다면 중단
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 새로운 AbortController 생성
        abortControllerRef.current = new AbortController();

        setLoading(true);
        try {
            // 현재 시간을 최신 값으로 업데이트
            const updatedCurrentTime = new Date();
            const currentTimeISO = updatedCurrentTime.toISOString();
            const releaseTimeISO = releaseTime.toISOString();

            console.log("Data sent to the server:", {
                site_domain: selectedUrl,
                release_time: releaseTimeISO,
                current_time: currentTimeISO,
            });

            const response = await fetch(`${BASE_URL}/api/best_entry_time/`, { // BASE_URL 사용
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    site_domain: selectedUrl,
                    release_time: releaseTimeISO,
                    current_time: currentTimeISO,
                }),
                signal: abortControllerRef.current.signal, // AbortSignal 연결
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch optimal time");
            }

            const result = await response.json();
            console.log("Server response:", result); // 서버 응답 로그

            if (response.ok && result.optimal_time) {
                const optimalTimeLocal = new Date(result.optimal_time).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });
                console.log("Optimal time calculated:", optimalTimeLocal); // 계산된 시간 로그
                setOptimalTimeMessage(`Optimal entry time: ${optimalTimeLocal}`);
            } else {
                setOptimalTimeMessage(result.error || "An unknown error occurred.");
            }
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    console.log("Request aborted");
                } else {
                    let errorMessage = "An error occurred while fetching the optimal entry time.";
                    errorMessage = error.message; // Error 객체의 message 속성에 접근
                    console.error("Error fetching optimal time:", error);
                    setOptimalTimeMessage(errorMessage);
                }
            } else {
                console.error("An unknown error occurred:", error);
                setOptimalTimeMessage("An unknown error occurred.");
            }
        } finally {
            setLoading(false);
            setIsFirstRequest(false); // 최초 요청 완료
            setHasPopupShown(true); // 팝업 노출 완료 설정
            abortControllerRef.current = null; // AbortController 초기화
        }
    };

    const startAutoRequest = () => {
        if (!isAutoRequestActive) {
            setIsAutoRequestActive(true); // 자동 요청 활성화
            autoRequestIntervalRef.current = setInterval(() => {
                fetchOptimalTime(); // 10초마다 요청
            }, 10000); // 10초마다 요청
        }
    };

    const stopAutoRequest = () => {
        if (autoRequestIntervalRef.current) {
            clearInterval(autoRequestIntervalRef.current); // 인터벌 중단
            autoRequestIntervalRef.current = null;
            setIsAutoRequestActive(false); // 자동 요청 비활성화
        }
    };

    const stopFetchingOptimalTime = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setOptimalTimeMessage("Request stopped by user.");
        }
        stopAutoRequest(); // 자동 요청도 중단
    };

    useEffect(() => {
        return () => {
            if (autoRequestIntervalRef.current) {
                clearInterval(autoRequestIntervalRef.current); // 컴포넌트 언마운트 시 인터벌 정리
            }
        };
    }, []);

    return (
        <div className="bg-black text-white min-h-screen flex flex-col relative">
            {/* 로딩 팝업 */}
            {loading && isFirstRequest && !hasPopupShown && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative w-80 h-80 rounded-full overflow-hidden">
                        <video
                            autoPlay
                            loop
                            muted
                            className="w-full h-full object-cover"
                        >
                            <source src="/videos/jarvis.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    urls={websites}
                    onSelect={(url: string) => {
                        setSelectedUrl(url);
                    }}
                />

                <main className="flex-1 flex flex-col items-center justify-start p-8 overflow-auto">
                    <h1 className="text-4xl font-bold mb-4 text-center">Monitoring</h1>
                    {selectedUrl ? (
                        <p className="text-lg text-gray-300 mb-4 text-center">
                            Selected Site: <span className="text-white">{selectedUrl}</span>
                        </p>
                    ) : (
                        <p className="text-lg text-gray-300 mb-4 text-center">
                            Please select a site to start monitoring.
                        </p>
                    )}

                    <CrawlingChart data={data} options={options} />

                    <div className="mt-6 p-4 bg-gray-800 rounded-lg max-w-md w-full">
                        <div className="mb-4 text-center">
                            <p className="text-lg text-gray-300">
                                <span className="text-white">{country || "Unknown Country"}</span>
                            </p>
                            <p className="text-lg text-gray-300">
                                <span className="text-white">
                                    {currentTime.toLocaleTimeString("en-US", {
                                        hour12: false,
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                    })}
                                </span>
                            </p>
                        </div>

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <div className="mb-2">
                                <label className="block mb-1" htmlFor="releaseTime">
                                    Release Time
                                </label>
                                <DateTimePicker
                                    label="Select Date & Time"
                                    value={releaseTime}
                                    onChange={(newValue: Date | null) => setReleaseTime(newValue)}
                                    slotProps={{
                                        textField: {
                                            id: "releaseTime",
                                            variant: "outlined",
                                            className: "w-full",
                                            sx: {
                                                backgroundColor: "#fff",
                                                borderRadius: "4px",
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </LocalizationProvider>

                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={() => {
                                    fetchOptimalTime();
                                    startAutoRequest();
                                }}
                                disabled={isAutoRequestActive} // 자동 요청 중 비활성화
                                className={`px-4 py-2 bg-green-600 hover:bg-green-500 rounded ${isAutoRequestActive ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                            >
                                Request Optimal Time
                            </button>
                            <button
                                onClick={stopFetchingOptimalTime}
                                className={`px-4 py-2 bg-red-600 hover:bg-red-500 rounded`}
                            >
                                Stop Request
                            </button>
                        </div>

                        {optimalTimeMessage && (
                            <p className="mt-4 text-center text-yellow-300">{optimalTimeMessage}</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HeroSection;