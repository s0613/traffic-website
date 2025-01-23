"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // 로그인 로직을 여기에 추가합니다.
        // 예를 들어, API 요청을 보내고 성공하면 홈 페이지로 리디렉션합니다.
        const response = await fetch('http://localhost:8000/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            // 로그인 성공 시 로컬 스토리지에 로그인 상태 저장
            localStorage.setItem('isLoggedIn', 'true');
            router.push('/');
        } else {
            // 로그인 실패 처리
            alert('Login failed. Please check your credentials and try again.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 w-full max-w-md">
                <h1 className="text-4xl font-bold mb-4 text-center">J.A.R.V.I.S</h1>
                <form onSubmit={handleSubmit} className="w-full">
                    <label className="block mb-2 text-sm font-medium text-gray-300">ID</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 mb-4 text-black bg-white"
                        placeholder="Enter your email"
                        required
                    />
                    <label className="block mb-2 text-sm font-medium text-gray-300">PASSWORD</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 mb-4 text-black bg-white"
                        placeholder="Enter your password"
                        required
                    />
                    <button type="submit" className="w-full p-2 bg-gray-700 text-white">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;