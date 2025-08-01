import React from "react";
import { useRoute, useLocation } from "wouter";

const mediaCoverage = [
  {
    id: 1,
    title: "How Lelekart is Revolutionizing E-commerce in India",
    publication: "Economic Times",
    date: "October 18, 2023",
    url: "https://economictimes.indiatimes.com/tech/technology/how-lelekart-is-revolutionizing-e-commerce-in-india/articleshow/104567890.cms",
    content: `Lelekart is transforming the e-commerce landscape in India by leveraging technology and logistics to reach every corner of the country. The company has enabled thousands of small businesses to sell online and has made shopping accessible to millions of customers.\n\nWith a robust logistics network and a focus on customer satisfaction, Lelekart has managed to reduce delivery times and increase reliability. The platform's AI-powered recommendation engine helps users discover products tailored to their preferences, while sellers benefit from advanced analytics and marketing tools.\n\nLelekart's commitment to digital inclusion is evident in its outreach programs for rural entrepreneurs, providing them with the resources and training needed to succeed online. As the company continues to innovate, it is set to play a pivotal role in shaping the future of Indian e-commerce.`,
  },
  {
    id: 2,
    title: "Lelekart's Growth Strategy Pays Off with Record Sales",
    publication: "Business Standard",
    date: "September 30, 2023",
    url: "https://www.business-standard.com/article/companies/lelekart-s-growth-strategy-pays-off-with-record-sales-123093000123_1.html",
    content: `Lelekart's focus on customer experience and seller empowerment has resulted in record sales this quarter. The company continues to invest in technology and infrastructure to support its rapid growth.\n\nIn the last financial year, Lelekart expanded its operations to over 500 cities, introduced next-day delivery in major metros, and launched a suite of tools for sellers to manage inventory and promotions.\n\nThe leadership team attributes this success to a culture of innovation and a relentless pursuit of excellence. Looking ahead, Lelekart plans to further enhance its platform with new features and expand its reach to underserved markets.`,
  },
  {
    id: 3,
    title: "The Technology Behind Lelekart's Rapid Expansion",
    publication: "Tech Today",
    date: "August 25, 2023",
    url: "https://techtoday.com/lelekart-technology-expansion",
    content: `Lelekart's proprietary technology stack enables it to scale operations quickly and efficiently. The company uses AI and data analytics to optimize logistics and personalize the shopping experience.\n\nThe engineering team has developed custom solutions for order management, real-time tracking, and fraud prevention. These innovations have allowed Lelekart to maintain high service levels even as order volumes surge.\n\nBy fostering a culture of experimentation and continuous improvement, Lelekart remains at the forefront of technological advancement in the e-commerce sector.`,
  },
  {
    id: 4,
    title: "How Lelekart is Empowering Rural Entrepreneurs",
    publication: "India Business Journal",
    date: "July 14, 2023",
    url: "https://indiabusinessjournal.com/lelekart-empowering-rural-entrepreneurs",
    content: `Through training and support programs, Lelekart is helping rural entrepreneurs build successful online businesses. The platform provides access to a wide customer base and essential business tools.\n\nLelekart's rural outreach includes workshops, mentorship, and financial assistance, enabling entrepreneurs to overcome barriers to entry in the digital marketplace.\n\nThe impact of these initiatives is evident in the growing number of rural sellers achieving significant sales milestones and expanding their businesses beyond local markets.`,
  },
  {
    id: 5,
    title: "Lelekart Named Among Top 10 Most Innovative Companies",
    publication: "Innovation Magazine",
    date: "June 5, 2023",
    url: "https://innovationmagazine.com/top-10-innovative-companies-lelekart",
    content: `Lelekart has been recognized as one of the top 10 most innovative companies for its groundbreaking work in e-commerce, logistics, and technology adoption in India.\n\nThe company's innovation strategy includes investments in AI, automation, and customer-centric design. Lelekart's mobile app, with its intuitive interface and personalized features, has set new standards for user experience in the industry.\n\nIndustry experts believe that Lelekart's approach to innovation will continue to drive growth and set benchmarks for others to follow.`,
  },
];

export default function PressArticleDetail() {
  const [match, params] = useRoute("/press/article/:id");
  const [, navigate] = useLocation();
  const article = mediaCoverage.find((a) => String(a.id) === String(params?.id));
  const [expanded, setExpanded] = React.useState(false);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f3f6] p-8">
        <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Article Not Found</h1>
          <p className="mb-6">Sorry, the article you are looking for does not exist.</p>
          <button
            className="bg-[#2874f0] text-white px-6 py-2 rounded font-semibold hover:bg-[#1851a3] transition"
            onClick={() => navigate('/press')}
          >
            Back to Press
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-8 px-4 flex flex-col items-center">
      <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <button
          className="mb-6 text-[#2874f0] hover:underline font-medium"
          onClick={() => navigate('/press')}
        >
          ← Back to Press
        </button>
        <h1 className="text-3xl font-bold mb-2 text-black">{article.title}</h1>
        <div className="text-sm text-gray-500 mb-4">{article.publication} • {article.date}</div>
        <div className="prose prose-lg max-w-none mb-8 whitespace-pre-line text-black">
          {expanded ? article.content : article.content.slice(0, 300) + (article.content.length > 300 ? '...' : '')}
        </div>
        {article.content.length > 300 && (
          <button
            className="bg-[#2874f0] text-white px-6 py-2 rounded font-semibold hover:bg-[#1851a3] transition inline-block"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Read Less' : 'Read More'}
          </button>
        )}
      </div>
    </div>
  );
} 