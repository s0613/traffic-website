"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Next.js의 Image 컴포넌트 사용

const Navbar = () => (
    <nav className="bg-black p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
            <div className="flex items-center">
                <Image src="/images/logo.png" alt="Logo" width={40} height={40} /> {/* 로고 이미지 추가 */}
                <Link href="/" className="text-3xl text-white ml-1">
                    J.A.R.V.I.S
                </Link>
            </div>
            <Link href="/add" className="text-white">
                Add
            </Link>
        </div>
    </nav>
);

export default Navbar;