import React from "react";
import { useLocation } from "wouter";

const pressReleases = [
  {
    id: 1,
    title: "Lelekart Raises $200M in Series E Funding Round",
    date: "January 15, 2023",
    category: "Financial News",
    excerpt:
      "The investment will fuel expansion into more tier 2 and tier 3 cities and strengthen the company's technology infrastructure.",
  },
  {
    id: 2,
    title: "Lelekart Launches Next-Day Delivery in 100+ Cities",
    date: "March 21, 2023",
    category: "Product Launch",
    excerpt:
      "The expansion of the company's delivery network marks a significant step in enhancing customer experience across India.",
  },
  {
    id: 3,
    title: "Lelekart Announces Seller Support Initiatives",
    date: "May 10, 2023",
    category: "Seller News",
    excerpt:
      "New programs include interest-free loans, logistics support, and specialized training to help small businesses scale on the platform.",
  },
  {
    id: 4,
    title: "Lelekart Reports 150% Growth in Rural Markets",
    date: "July 5, 2023",
    category: "Business Updates",
    excerpt:
      "Customer acquisition in rural areas has outpaced urban markets as e-commerce adoption accelerates across India.",
  },
  {
    id: 5,
    title: "Lelekart Introduces AI-Powered Shopping Assistant",
    date: "September 12, 2023",
    category: "Product Launch",
    excerpt:
      "The new feature uses advanced AI to provide personalized product recommendations and answer customer queries in real-time.",
  },
];

export default function PressAllPage() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-8 px-4 flex flex-col items-center">
      <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <button
          className="mb-6 text-[#2874f0] hover:underline font-medium"
          onClick={() => navigate('/press')}
        >
          ← Back to Press
        </button>
        <h1 className="text-3xl font-bold mb-6 text-gray-900">All Press Releases</h1>
        <ul className="divide-y divide-gray-200">
          {pressReleases.map((release) => (
            <li key={release.id} className="py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <h2
                  className="text-xl font-semibold text-blue-800 hover:underline cursor-pointer mb-1 md:mb-0"
                  onClick={() => navigate(`/press/${release.id}`)}
                >
                  {release.title}
                </h2>
                <div className="text-sm text-gray-500">
                  {release.date} • <span className="text-blue-600">{release.category}</span>
                </div>
              </div>
              <div className="text-gray-700 mb-2">{release.excerpt}</div>
              <button
                className="text-[#2874f0] font-medium hover:underline text-sm"
                onClick={() => navigate(`/press/${release.id}`)}
              >
                Read Full Release
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 