import React from 'react';

interface SidebarProps {
    urls: string[];
    onSelect: (url: string) => void;
}

const Sidebar = ({ urls, onSelect }: SidebarProps) => (
    <aside className="bg-black w-64 p-4 border-r border-b border-gray-700">
        <h2 className="text-xl mb-4 text-white">Website List</h2>
        <hr className="border-gray-700 my-4" />
        <ul className="space-y-1"> {/* space-y-1로 각 행 간격 조정 */}
            {urls.map((url, index) => (
                <li key={index} className="truncate">
                    <a
                        href="#"
                        className="text-white hover:bg-gray-700 block px-2 py-1 rounded break-words"
                        style={{
                            lineHeight: '1.2', // 줄 간격 좁히기
                        }}
                        onClick={() => onSelect(url)}
                    >
                        {url}
                    </a>
                </li>
            ))}
        </ul>
    </aside>
);

export default Sidebar;
