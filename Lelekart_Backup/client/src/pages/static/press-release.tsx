import React from "react";
import { useRoute, useLocation } from "wouter";

// For demo, redefine the pressReleases array (should be imported/shared in real app)
const pressReleases = [
  {
    id: 1,
    title: "Lelekart Raises $200M in Series E Funding Round",
    date: "January 15, 2023",
    category: "Financial News",
    excerpt:
      "The investment will fuel expansion into more tier 2 and tier 3 cities and strengthen the company's technology infrastructure.",
    content:
      `Lelekart, India's fastest-growing e-commerce platform, has successfully raised $200 million in a Series E funding round led by global investors. The investment will fuel expansion into more tier 2 and tier 3 cities and strengthen the company's technology infrastructure. With this funding, Lelekart aims to empower more small businesses and sellers across India, enhance its logistics network, and invest in cutting-edge technology to deliver a seamless shopping experience for millions of customers.\n\n"This funding round is a testament to the trust our investors have in our vision and execution," said the CEO of Lelekart. "We are committed to making online shopping accessible and affordable for every Indian."\n\nThe Series E round saw participation from both existing and new investors, reflecting strong confidence in Lelekart's business model and growth trajectory. The company plans to utilize the funds to further develop its AI-driven recommendation engine, expand its seller support programs, and launch new initiatives aimed at digital inclusion in rural India.\n\nIndustry analysts believe this investment will position Lelekart as a formidable player in the Indian e-commerce space, enabling it to compete with established giants while maintaining its focus on customer-centric innovation.`,
  },
  {
    id: 2,
    title: "Lelekart Launches Next-Day Delivery in 100+ Cities",
    date: "March 21, 2023",
    category: "Product Launch",
    excerpt:
      "The expansion of the company's delivery network marks a significant step in enhancing customer experience across India.",
    content:
      `Lelekart has announced the launch of next-day delivery services in over 100 cities across India. The expansion of the company's delivery network marks a significant step in enhancing customer experience and meeting the growing demand for faster shipping.\n\nCustomers in these cities can now enjoy the convenience of next-day delivery on thousands of products, making online shopping even more attractive. The company plans to further expand this service to more locations in the coming months.\n\nThe logistics team at Lelekart has worked tirelessly to optimize routes, partner with local delivery agencies, and implement advanced tracking systems. This initiative is expected to boost customer satisfaction and drive higher order volumes, especially in emerging markets.\n\nLelekart's leadership emphasized that this move aligns with the company's mission to make quality products accessible to every Indian, regardless of location.`,
  },
  {
    id: 3,
    title: "Lelekart Announces Seller Support Initiatives",
    date: "May 10, 2023",
    category: "Seller News",
    excerpt:
      "New programs include interest-free loans, logistics support, and specialized training to help small businesses scale on the platform.",
    content:
      `Lelekart has rolled out a series of new initiatives aimed at supporting sellers on its platform. These programs include interest-free loans, enhanced logistics support, and specialized training sessions to help small businesses scale and succeed online.\n\nThe company is committed to empowering entrepreneurs and providing them with the tools and resources needed to thrive in the digital economy.\n\nIn addition to financial assistance, Lelekart is launching a mentorship program where experienced sellers can guide newcomers. The company will also host regular webinars and workshops on best practices in e-commerce, digital marketing, and customer service.\n\nThese efforts are part of Lelekart's broader vision to create a vibrant and inclusive online marketplace that benefits both buyers and sellers.`,
  },
  {
    id: 4,
    title: "Lelekart Reports 150% Growth in Rural Markets",
    date: "July 5, 2023",
    category: "Business Updates",
    excerpt:
      "Customer acquisition in rural areas has outpaced urban markets as e-commerce adoption accelerates across India.",
    content:
      `Lelekart has reported a remarkable 150% growth in rural markets over the past year. Customer acquisition in rural areas has outpaced urban markets as e-commerce adoption accelerates across India.\n\nThe company attributes this growth to its focus on affordable pricing, reliable delivery, and localized marketing efforts.\n\nLelekart's rural outreach programs have included partnerships with local businesses, community events, and targeted advertising campaigns. The company is also investing in infrastructure to ensure timely deliveries and high service quality in remote areas.\n\nLooking ahead, Lelekart plans to introduce new features tailored to the needs of rural customers, further strengthening its presence in these markets.`,
  },
  {
    id: 5,
    title: "Lelekart Introduces AI-Powered Shopping Assistant",
    date: "September 12, 2023",
    category: "Product Launch",
    excerpt:
      "The new feature uses advanced AI to provide personalized product recommendations and answer customer queries in real-time.",
    content:
      `Lelekart has introduced an AI-powered shopping assistant designed to provide personalized product recommendations and answer customer queries in real-time.\n\nThis new feature leverages advanced machine learning algorithms to enhance the shopping experience and help customers discover products they'll love.\n\nThe AI assistant is available 24/7 and can assist with product searches, order tracking, and returns. Early feedback from users has been overwhelmingly positive, with many praising the assistant's accuracy and helpfulness.\n\nLelekart plans to continue refining the AI assistant based on user feedback and expand its capabilities to cover more aspects of the shopping journey.`,
  },
];

export default function PressReleaseDetail() {
  const [match, params] = useRoute("/press/:id");
  const [, navigate] = useLocation();
  const release = pressReleases.find((r) => String(r.id) === String(params?.id));

  React.useEffect(() => {
    if (release) {
      document.title = `${release.title} | Lelekart Press Release`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', release.excerpt);
      else {
        const m = document.createElement('meta');
        m.name = 'description';
        m.content = release.excerpt;
        document.head.appendChild(m);
      }
    }
  }, [release]);

  if (!release) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f3f6] p-8">
        <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Press Release Not Found</h1>
          <p className="mb-6">Sorry, the press release you are looking for does not exist.</p>
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
        <h1 className="text-3xl font-bold mb-2 text-gray-900">{release.title}</h1>
        <div className="text-sm text-gray-500 mb-4">{release.date} • <span className="text-blue-600">{release.category}</span></div>
        <div className="prose prose-lg max-w-none mb-8 whitespace-pre-line text-gray-800">{release.content}</div>
      </div>
    </div>
  );
}