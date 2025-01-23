"use client";
import React, { useState } from 'react';
import Add from '../../components/custom/Add';

const AddPage = () => {
    const [urls, setUrls] = useState<string[]>(['https://example1.com', 'https://example2.com', 'https://example3.com']);

    const addUrl = (url: string) => {
        setUrls([...urls, url]);
    };

    return <Add addUrl={addUrl} />;
};

export default AddPage;