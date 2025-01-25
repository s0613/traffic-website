"use client";
import React, { useState } from "react";

interface AddProps {
    addUrl: (url: string) => void;
}

const Add: React.FC<AddProps> = ({ addUrl }) => {
    const [url, setUrl] = useState("");
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("http://134.195.158.8:8000/api/add_url/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ domain: url, name }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("URL added successfully!");
                addUrl(url); // Add the URL to the parent component's state
                setUrl(""); // Clear the input fields
                setName("");
            } else {
                setMessage(data.error || "Failed to add URL.");
            }
        } catch (error) {
            setMessage("An error occurred. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
            <h1 className="text-4xl font-bold mb-4">Add URL</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 mb-4 text-black"
                    placeholder="Enter URL"
                    required
                />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 mb-4 text-black"
                    placeholder="Enter Name (optional)"
                />
                <button type="submit" className="w-full p-2 bg-gray-700 text-white">
                    Add
                </button>
            </form>
            {message && <p className="mt-4 text-green-500">{message}</p>}
        </div>
    );
};

export default Add;
