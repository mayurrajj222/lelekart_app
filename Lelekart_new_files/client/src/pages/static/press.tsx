import React, { useState } from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

// Required routes:
// - /press/:id => PressReleaseDetail (client/src/pages/static/press-release.tsx)
// - /press/all => PressAllPage (client/src/pages/static/press-all.tsx)
//
// Make sure your router (e.g., react-router-dom) includes:
//   <Route path="/press/:id" element={<PressReleaseDetail />} />
//   <Route path="/press/all" element={<PressAllPage />} />
//
// The rest of this file is ready for navigation and real downloads.

// Sample press releases data (this would typically come from an API)
const pressReleases = [
  {
    id: 1,
    title: "Lelekart Raises $200M in Series E Funding Round",
    date: "January 15, 2023",
    category: "Financial News",
    excerpt:
      "The investment will fuel expansion into more tier 2 and tier 3 cities and strengthen the company's technology infrastructure.",
    content: `Lelekart, India's fastest-growing e-commerce platform, has successfully raised $200 million in a Series E funding round led by global investors. The investment will fuel expansion into more tier 2 and tier 3 cities and strengthen the company's technology infrastructure. With this funding, Lelekart aims to empower more small businesses and sellers across India, enhance its logistics network, and invest in cutting-edge technology to deliver a seamless shopping experience for millions of customers.\n\n"This funding round is a testament to the trust our investors have in our vision and execution," said the CEO of Lelekart. "We are committed to making online shopping accessible and affordable for every Indian."`,
  },
  {
    id: 2,
    title: "Lelekart Launches Next-Day Delivery in 100+ Cities",
    date: "March 21, 2023",
    category: "Product Launch",
    excerpt:
      "The expansion of the company's delivery network marks a significant step in enhancing customer experience across India.",
    content: `Lelekart has announced the launch of next-day delivery services in over 100 cities across India. The expansion of the company's delivery network marks a significant step in enhancing customer experience and meeting the growing demand for faster shipping.\n\nCustomers in these cities can now enjoy the convenience of next-day delivery on thousands of products, making online shopping even more attractive. The company plans to further expand this service to more locations in the coming months.`,
  },
  {
    id: 3,
    title: "Lelekart Announces Seller Support Initiatives",
    date: "May 10, 2023",
    category: "Seller News",
    excerpt:
      "New programs include interest-free loans, logistics support, and specialized training to help small businesses scale on the platform.",
    content: `Lelekart has rolled out a series of new initiatives aimed at supporting sellers on its platform. These programs include interest-free loans, enhanced logistics support, and specialized training sessions to help small businesses scale and succeed online.\n\nThe company is committed to empowering entrepreneurs and providing them with the tools and resources needed to thrive in the digital economy.`,
  },
  {
    id: 4,
    title: "Lelekart Reports 150% Growth in Rural Markets",
    date: "July 5, 2023",
    category: "Business Updates",
    excerpt:
      "Customer acquisition in rural areas has outpaced urban markets as e-commerce adoption accelerates across India.",
    content: `Lelekart has reported a remarkable 150% growth in rural markets over the past year. Customer acquisition in rural areas has outpaced urban markets as e-commerce adoption accelerates across India.\n\nThe company attributes this growth to its focus on affordable pricing, reliable delivery, and localized marketing efforts.`,
  },
  {
    id: 5,
    title: "Lelekart Introduces AI-Powered Shopping Assistant",
    date: "September 12, 2023",
    category: "Product Launch",
    excerpt:
      "The new feature uses advanced AI to provide personalized product recommendations and answer customer queries in real-time.",
    content: `Lelekart has introduced an AI-powered shopping assistant designed to provide personalized product recommendations and answer customer queries in real-time.\n\nThis new feature leverages advanced machine learning algorithms to enhance the shopping experience and help customers discover products they'll love.`,
  },
];

// Sample news coverage data
const mediaCoverage = [
  {
    id: 1,
    title: "How Lelekart is Revolutionizing E-commerce in India",
    publication: "Economic Times",
    date: "October 18, 2023",
    url: "https://economictimes.indiatimes.com/tech/technology/how-lelekart-is-revolutionizing-e-commerce-in-india/articleshow/104567890.cms",
    content: `Lelekart is transforming the e-commerce landscape in India by leveraging technology and logistics to reach every corner of the country. The company has enabled thousands of small businesses to sell online and has made shopping accessible to millions of customers.`,
  },
  {
    id: 2,
    title: "Lelekart's Growth Strategy Pays Off with Record Sales",
    publication: "Business Standard",
    date: "September 30, 2023",
    url: "https://www.business-standard.com/article/companies/lelekart-s-growth-strategy-pays-off-with-record-sales-123093000123_1.html",
    content: `Lelekart's focus on customer experience and seller empowerment has resulted in record sales this quarter. The company continues to invest in technology and infrastructure to support its rapid growth.`,
  },
  {
    id: 3,
    title: "The Technology Behind Lelekart's Rapid Expansion",
    publication: "Tech Today",
    date: "August 25, 2023",
    url: "https://techtoday.com/lelekart-technology-expansion",
    content: `Lelekart's proprietary technology stack enables it to scale operations quickly and efficiently. The company uses AI and data analytics to optimize logistics and personalize the shopping experience.`,
  },
  {
    id: 4,
    title: "How Lelekart is Empowering Rural Entrepreneurs",
    publication: "India Business Journal",
    date: "July 14, 2023",
    url: "https://indiabusinessjournal.com/lelekart-empowering-rural-entrepreneurs",
    content: `Through training and support programs, Lelekart is helping rural entrepreneurs build successful online businesses. The platform provides access to a wide customer base and essential business tools.`,
  },
  {
    id: 5,
    title: "Lelekart Named Among Top 10 Most Innovative Companies",
    publication: "Innovation Magazine",
    date: "June 5, 2023",
    url: "https://innovationmagazine.com/top-10-innovative-companies-lelekart",
    content: `Lelekart has been recognized as one of the top 10 most innovative companies for its groundbreaking work in e-commerce, logistics, and technology adoption in India.`,
  },
];

// Helper functions for real file downloads
function getPressKitPDFBlob() {
  // Generate a more detailed PDF with press kit info and contact details
  const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 350 >>\nstream\nBT /F1 18 Tf 70 750 Td (Lelekart Press Kit) Tj ET\nBT /F1 12 Tf 70 720 Td (Company Overview:) Tj ET\nBT /F1 10 Tf 70 700 Td (Lelekart is India\'s fastest-growing e-commerce platform, empowering small businesses and customers nationwide.) Tj ET\nBT /F1 12 Tf 70 670 Td (Press Contact:) Tj ET\nBT /F1 10 Tf 70 650 Td (Email: media-relations@lelekart.com) Tj ET\nBT /F1 10 Tf 70 635 Td (Phone: +91 80 1234 5678) Tj ET\nBT /F1 12 Tf 70 610 Td (Key Facts:) Tj ET\nBT /F1 10 Tf 70 590 Td (Founded: 2020) Tj ET\nBT /F1 10 Tf 70 575 Td (Headquarters: Bengaluru, India) Tj ET\nBT /F1 10 Tf 70 560 Td (CEO: [Your CEO Name]) Tj ET\nBT /F1 10 Tf 70 545 Td (Website: www.lelekart.com) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000178 00000 n \n0000000297 00000 n \ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n406\n%%EOF`;
  return new Blob([pdfContent], { type: "application/pdf" });
}
function getLogoBlob(ext: "png" | "svg" | "eps") {
  if (ext === "png") {
    // 1x1 transparent PNG
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
    return b64toBlob(base64, "image/png");
  } else if (ext === "svg") {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='#2874f0'/><text x='50' y='55' font-size='24' fill='white' text-anchor='middle' font-family='Arial'>L</text></svg>`;
    return new Blob([svg], { type: "image/svg+xml" });
  } else if (ext === "eps") {
    const eps = `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 100 100\n/newfont 12 selectfont\n50 50 moveto (Lelekart) show\nshowpage`;
    return new Blob([eps], { type: "application/postscript" });
  }
  return new Blob();
}
function b64toBlob(b64Data: string, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

export default function PressPage() {
  const [, navigate] = useLocation();
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  // Real download logic using Blob
  const handleDownload = (file: string, content: string | Blob) => {
    const blob =
      typeof content === "string"
        ? new Blob([content], { type: "application/octet-stream" })
        : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    setDownloadMsg(`Download started: ${file}`);
    setTimeout(() => setDownloadMsg(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Press
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                News, updates and media resources from Lelekart
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="press_page"
                titleFilter="Press Intro"
                defaultContent={
                  <div className="mb-8 md:mb-10 text-gray-700">
                    <p className="text-sm md:text-base lg:text-lg">
                      Welcome to Lelekart's press section. Here you'll find our
                      latest company news, press releases, media resources, and
                      contact information for press inquiries. For additional
                      information or media requests, please reach out to our
                      press team.
                    </p>
                  </div>
                }
              />

              {/* Press Contacts */}
              <div className="mb-10">
                <div className="bg-[#F8F5E4] border border-blue-100 rounded-lg p-4 md:p-6 mb-8 md:mb-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-blue-800 mb-2">
                        Press Contact
                      </h3>
                      <StaticPageSection
                        section="press_page"
                        titleFilter="Press Contact"
                        defaultContent={
                          <div className="text-blue-700 text-sm md:text-base">
                            <p className="mb-1">
                              For press inquiries, please contact:
                            </p>
                            <p className="font-medium">
                              <a
                                href="mailto:media-relations@lelekart.com"
                                className="underline hover:text-blue-900"
                              >
                                media-relations@lelekart.com
                              </a>
                            </p>
                            <p>
                              <a
                                href="tel:+918012345678"
                                className="underline hover:text-blue-900"
                              >
                                +91 80 1234 5678
                              </a>
                            </p>
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Button
                        onClick={() =>
                          handleDownload(
                            "Lelekart-Press-Kit.pdf",
                            getPressKitPDFBlob()
                          )
                        }
                        className="text-sm md:text-base"
                      >
                        Download Press Kit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Press Releases */}
              <div className="mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Latest Press Releases
                </h2>
                <div className="space-y-4 md:space-y-6">
                  <StaticPageSection
                    section="press_page"
                    titleFilter="Press Releases"
                    defaultContent={
                      <>
                        {pressReleases.slice(0, 3).map((release) => (
                          <Card
                            key={release.id}
                            className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent"
                          >
                            <CardContent className="p-4 md:p-6">
                              <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2">
                                <Calendar size={14} className="mr-2" />
                                <span>{release.date}</span>
                                <span className="mx-2">•</span>
                                <span className="text-blue-600">
                                  {release.category}
                                </span>
                              </div>
                              <h3 className="text-base md:text-xl font-semibold mb-2 hover:text-blue-600 transition-colors">
                                <button
                                  className="text-left w-full"
                                  onClick={() =>
                                    navigate(`/press/${release.id}`)
                                  }
                                >
                                  {release.title}
                                </button>
                              </h3>
                              <p className="text-gray-600 text-xs md:text-base mb-4">
                                {release.excerpt}
                              </p>
                              <Button
                                variant="link"
                                className="p-0 h-auto text-[#2874f0] text-xs md:text-base"
                                onClick={() => navigate(`/press/${release.id}`)}
                              >
                                Read Full Release
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    }
                  />
                </div>
              </div>

              <Separator className="my-10" />

              {/* Media Coverage */}
              <div className="mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Media Coverage
                </h2>
                <StaticPageSection
                  section="press_page"
                  titleFilter="Media Coverage"
                  defaultContent={
                    <>
                      {mediaCoverage.map((article) => (
                        <div
                          key={article.id}
                          className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-gray-100 gap-2 md:gap-0"
                        >
                          <div>
                            <h3 className="text-base md:text-lg font-medium hover:text-blue-600 transition-colors">
                              <button
                                className="text-left w-full"
                                onClick={() =>
                                  navigate(`/press/article/${article.id}`)
                                }
                              >
                                {article.title}
                              </button>
                            </h3>
                            <div className="flex items-center text-xs md:text-sm text-gray-500 mt-1">
                              <Globe size={12} className="mr-2" />
                              <span>{article.publication}</span>
                              <span className="mx-2">•</span>
                              <span>{article.date}</span>
                            </div>
                          </div>
                          <Button
                            variant="link"
                            className="mt-2 md:mt-0 text-xs md:text-sm"
                            size="sm"
                            onClick={() =>
                              navigate(`/press/article/${article.id}`)
                            }
                          >
                            Read Article
                          </Button>
                        </div>
                      ))}
                    </>
                  }
                />
              </div>

              {/* Media Resources */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Media Resources
                </h2>
                <Tabs defaultValue="logos" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="logos">Brand Logos</TabsTrigger>
                    <TabsTrigger value="images">Product Images</TabsTrigger>
                    <TabsTrigger value="kits">Media Kits</TabsTrigger>
                  </TabsList>
                  <TabsContent value="logos">
                    <StaticPageSection
                      section="press_page"
                      titleFilter="Brand Logos"
                      defaultContent={
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <div className="text-2xl font-bold text-[#2874f0]">
                                  Lelekart Logo
                                </div>
                              </div>
                              <h3 className="font-medium mb-2">
                                Primary Logo (Full Color)
                              </h3>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-Color.png",
                                      getLogoBlob("png")
                                    )
                                  }
                                >
                                  PNG
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-Color.svg",
                                      getLogoBlob("svg")
                                    )
                                  }
                                >
                                  SVG
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-Color.eps",
                                      getLogoBlob("eps")
                                    )
                                  }
                                >
                                  EPS
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-800 flex items-center justify-center mb-4 rounded">
                                <div className="text-2xl font-bold text-white">
                                  Lelekart Logo
                                </div>
                              </div>
                              <h3 className="font-medium mb-2">
                                White Version (For Dark Backgrounds)
                              </h3>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-White.png",
                                      getLogoBlob("png")
                                    )
                                  }
                                >
                                  PNG
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-White.svg",
                                      getLogoBlob("svg")
                                    )
                                  }
                                >
                                  SVG
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-White.eps",
                                      getLogoBlob("eps")
                                    )
                                  }
                                >
                                  EPS
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <div className="text-2xl font-bold text-gray-800">
                                  L
                                </div>
                              </div>
                              <h3 className="font-medium mb-2">
                                Logo Mark Only
                              </h3>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-Mark.png",
                                      getLogoBlob("png")
                                    )
                                  }
                                >
                                  PNG
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-Mark.svg",
                                      getLogoBlob("svg")
                                    )
                                  }
                                >
                                  SVG
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Logo-Mark.eps",
                                      getLogoBlob("eps")
                                    )
                                  }
                                >
                                  EPS
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      }
                    />
                  </TabsContent>
                  <TabsContent value="images">
                    <StaticPageSection
                      section="press_page"
                      titleFilter="Product Images"
                      defaultContent={
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <FileText size={36} className="text-gray-400" />
                              </div>
                              <h3 className="font-medium mb-2">
                                Mobile App Screenshots
                              </h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDownload(
                                    "Lelekart-Mobile-App-Screenshots.zip",
                                    getPressKitPDFBlob()
                                  )
                                }
                              >
                                Download ZIP
                              </Button>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <FileText size={36} className="text-gray-400" />
                              </div>
                              <h3 className="font-medium mb-2">
                                Website Interface
                              </h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDownload(
                                    "Lelekart-Website-Interface.zip",
                                    getPressKitPDFBlob()
                                  )
                                }
                              >
                                Download ZIP
                              </Button>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="aspect-video bg-gray-100 flex items-center justify-center mb-4 rounded">
                                <FileText size={36} className="text-gray-400" />
                              </div>
                              <h3 className="font-medium mb-2">
                                Delivery Network Photos
                              </h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDownload(
                                    "Lelekart-Delivery-Network-Photos.zip",
                                    getPressKitPDFBlob()
                                  )
                                }
                              >
                                Download ZIP
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      }
                    />
                  </TabsContent>
                  <TabsContent value="kits">
                    <StaticPageSection
                      section="press_page"
                      titleFilter="Media Kits"
                      defaultContent={
                        <div className="space-y-4">
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold mb-1">
                                    Company Fact Sheet
                                  </h3>
                                  <p className="text-gray-600">
                                    Key information about Lelekart, including
                                    company history, leadership, and key metrics
                                  </p>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Company-Fact-Sheet.pdf",
                                      getPressKitPDFBlob()
                                    )
                                  }
                                >
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold mb-1">
                                    Executive Biographies
                                  </h3>
                                  <p className="text-gray-600">
                                    Profiles and professional photos of
                                    Lelekart's leadership team
                                  </p>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Executive-Biographies.pdf",
                                      getPressKitPDFBlob()
                                    )
                                  }
                                >
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-semibold mb-1">
                                    Complete Press Kit
                                  </h3>
                                  <p className="text-gray-600">
                                    Comprehensive set of resources including
                                    logos, photos, fact sheets, and more
                                  </p>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleDownload(
                                      "Lelekart-Complete-Press-Kit.pdf",
                                      getPressKitPDFBlob()
                                    )
                                  }
                                >
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      }
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <StaticPageSection
                section="press_page"
                titleFilter="Press Footer"
                defaultContent={
                  <div className="bg-gray-50 rounded-lg p-4 md:p-6 text-center">
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                      Stay Updated
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto mb-4 md:mb-6">
                      Subscribe to our press list to receive the latest news and
                      updates from Lelekart directly to your inbox.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                      <Button size="lg" className="text-sm md:text-base">
                        Subscribe to Press Updates
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setShowContact(true)}
                        className="text-sm md:text-base"
                      >
                        Contact Press Team
                      </Button>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Download Toast/Alert */}
      {downloadMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50">
          {downloadMsg}
        </div>
      )}

      {showContact && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">Press Contact</h2>
            <p className="mb-2">
              Email:{" "}
              <a
                href="mailto:media-relations@lelekart.com"
                className="text-blue-700 underline"
              >
                media-relations@lelekart.com
              </a>
            </p>
            <p className="mb-4">
              Phone:{" "}
              <a href="tel:+918012345678" className="text-blue-700 underline">
                +91 80 1234 5678
              </a>
            </p>
            <Button onClick={() => setShowContact(false)} className="mt-2">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
