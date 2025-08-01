import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  Users,
  ShoppingBag,
  TrendingUp,
  Globe,
  Truck,
  Smile,
  BadgeIndianRupee,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Helper component to render content from footer management
const AboutPageSection = ({
  titleFilter,
  defaultContent,
  renderContent,
}: {
  titleFilter: string;
  defaultContent: React.ReactNode;
  renderContent?: (content: string) => React.ReactNode;
}) => {
  const { data: footerContents = [] } = useQuery({
    queryKey: ["/api/footer-content"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/footer-content");
      const data = await res.json();
      return data;
    },
  });

  // Find content with the specified section and title
  const contentItem = footerContents.find(
    (item: any) =>
      item.section === "about_page" &&
      item.title === titleFilter &&
      item.isActive
  );

  if (!contentItem) {
    return defaultContent;
  }

  // Render custom content if a renderer is provided, otherwise return the content as is
  return renderContent ? (
    renderContent(contentItem.content)
  ) : (
    <div dangerouslySetInnerHTML={{ __html: contentItem.content }} />
  );
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <AboutPageSection
                titleFilter="Hero Title"
                defaultContent={
                  <>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                      About Us
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                      Empowering India to shop from the comfort of their homes
                    </p>
                    <p className="text-sm md:text-base lg:text-lg opacity-90">
                      LeleKart is India's leading e-commerce marketplace with
                      millions of products across 80+ categories from thousands
                      of regional, national, and international brands and
                      sellers.
                    </p>
                  </>
                }
              />
            </div>
          </div>

          {/* Company Intro */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-2/3 lg:pr-8 mb-6 lg:mb-0">
                  <AboutPageSection
                    titleFilter="Company Intro"
                    defaultContent={
                      <>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 text-[#2874f0]">
                          The LeleKart Group
                        </h2>
                        <p className="mb-3 md:mb-4 text-sm md:text-base text-gray-700">
                          LeleKart was founded in 2023 by a team of young
                          entrepreneurs passionate about making online shopping
                          accessible to all Indians. With a commitment to
                          technological innovation and customer satisfaction,
                          we've grown into one of India's largest e-commerce
                          platforms.
                        </p>
                        <p className="mb-3 md:mb-4 text-sm md:text-base text-gray-700">
                          Our journey began with a simple mission: to transform
                          how India shops by providing a reliable, seamless
                          platform that connects buyers directly to a vast
                          network of sellers. Today, we offer millions of
                          products across diverse categories including
                          Electronics, Mobile Phones, Fashion, Home & Furniture,
                          Groceries, and more.
                        </p>
                        <p className="text-sm md:text-base text-gray-700">
                          LeleKart is more than just an online marketplace -
                          it's a revolution in how India shops, empowering both
                          consumers and sellers through technology while driving
                          economic growth across the nation.
                        </p>
                      </>
                    }
                  />
                </div>
                <div className="lg:w-1/3">
                  <div className="bg-[#F8F5E4] rounded-lg p-4">
                    <AboutPageSection
                      titleFilter="At a Glance"
                      defaultContent={
                        <>
                          <h3 className="text-base md:text-lg font-semibold mb-3 text-[#2874f0]">
                            LeleKart at a Glance
                          </h3>
                          <ul className="space-y-3 md:space-y-4">
                            <li className="flex items-start">
                              <span className="flex-shrink-0 bg-[#2874f0] rounded-full p-1 mr-3 mt-1">
                                <ShoppingBag
                                  size={14}
                                  className="text-white md:w-4 md:h-4"
                                />
                              </span>
                              <div>
                                <span className="block font-semibold text-sm md:text-base">
                                  100 Million+ Products
                                </span>
                                <span className="text-xs md:text-sm text-gray-600">
                                  across 80+ categories
                                </span>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <span className="flex-shrink-0 bg-[#2874f0] rounded-full p-1 mr-3 mt-1">
                                <Users
                                  size={14}
                                  className="text-white md:w-4 md:h-4"
                                />
                              </span>
                              <div>
                                <span className="block font-semibold text-sm md:text-base">
                                  400 Million+ Customers
                                </span>
                                <span className="text-xs md:text-sm text-gray-600">
                                  across India
                                </span>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <span className="flex-shrink-0 bg-[#2874f0] rounded-full p-1 mr-3 mt-1">
                                <Globe
                                  size={14}
                                  className="text-white md:w-4 md:h-4"
                                />
                              </span>
                              <div>
                                <span className="block font-semibold text-sm md:text-base">
                                  5000+ Cities
                                </span>
                                <span className="text-xs md:text-sm text-gray-600">
                                  with delivery service
                                </span>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <span className="flex-shrink-0 bg-[#2874f0] rounded-full p-1 mr-3 mt-1">
                                <Truck
                                  size={14}
                                  className="text-white md:w-4 md:h-4"
                                />
                              </span>
                              <div>
                                <span className="block font-semibold text-sm md:text-base">
                                  Next-Day Delivery
                                </span>
                                <span className="text-xs md:text-sm text-gray-600">
                                  to most metro areas
                                </span>
                              </div>
                            </li>
                          </ul>
                        </>
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Core Values Section */}
              <div className="mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Our Core Values
                </h2>
                <AboutPageSection
                  titleFilter="Core Values"
                  defaultContent={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                        <CardContent className="p-4 md:p-5">
                          <div className="bg-[#2874f0]/10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mb-3 md:mb-4">
                            <ShieldCheck
                              size={20}
                              className="text-[#2874f0] md:w-6 md:h-6"
                            />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold mb-2">
                            Customer First
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">
                            We exist to serve our customers, and every decision
                            we make is guided by what's best for them.
                            Delivering delight is not just our goal—it's our
                            passion.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                        <CardContent className="p-4 md:p-5">
                          <div className="bg-[#2874f0]/10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mb-3 md:mb-4">
                            <TrendingUp
                              size={20}
                              className="text-[#2874f0] md:w-6 md:h-6"
                            />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold mb-2">
                            Innovation
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">
                            We constantly challenge the status quo to find
                            better solutions. By embracing change and taking
                            calculated risks, we push the boundaries of what's
                            possible.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1 bg-transparent">
                        <CardContent className="p-4 md:p-5">
                          <div className="bg-[#2874f0]/10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mb-3 md:mb-4">
                            <BadgeIndianRupee
                              size={20}
                              className="text-[#2874f0] md:w-6 md:h-6"
                            />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold mb-2">
                            Value
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">
                            We believe everyone deserves access to quality
                            products at affordable prices. Our commitment to
                            value drives every aspect of our business.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  }
                />
              </div>

              {/* Leadership Section */}
              <div className="mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Leadership
                </h2>
                <AboutPageSection
                  titleFilter="Leadership Team"
                  defaultContent={
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 mx-auto mb-3 md:mb-4 overflow-hidden">
                          <img
                            src="https://rukminim1.flixcart.com/image/300/300/cms-rpd-images/74efeabc23cd4f2486d7c04264454cef_187ac5ccc94_image.jpeg?q=90"
                            alt="CEO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-sm md:text-base">
                          Rahul Sharma
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">CEO</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 mx-auto mb-3 md:mb-4 overflow-hidden">
                          <img
                            src="https://rukminim1.flixcart.com/image/300/300/cms-rpd-images/74efeabc23cd4f2486d7c04264454cef_187ac5ccc94_image.jpeg?q=90"
                            alt="CTO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-sm md:text-base">
                          Priya Patel
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">CTO</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 mx-auto mb-3 md:mb-4 overflow-hidden">
                          <img
                            src="https://rukminim1.flixcart.com/image/300/300/cms-rpd-images/74efeabc23cd4f2486d7c04264454cef_187ac5ccc94_image.jpeg?q=90"
                            alt="COO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-sm md:text-base">
                          Amit Kumar
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">COO</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 mx-auto mb-3 md:mb-4 overflow-hidden">
                          <img
                            src="https://rukminim1.flixcart.com/image/300/300/cms-rpd-images/74efeabc23cd4f2486d7c04264454cef_187ac5ccc94_image.jpeg?q=90"
                            alt="CFO"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-sm md:text-base">
                          Deepa Agarwal
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">CFO</p>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Milestones */}
              <div className="mt-8 md:mt-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Our Journey
                </h2>
                <AboutPageSection
                  titleFilter="Our Journey"
                  defaultContent={
                    <div className="relative">
                      {/* Line - Hidden on mobile, shown on desktop */}
                      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2"></div>

                      {/* Milestone Items */}
                      <div className="space-y-6 md:space-y-12">
                        {/* Milestone 1 */}
                        <div className="relative flex flex-col lg:flex-row">
                          <div className="lg:w-1/2 lg:pr-8 lg:text-right mb-4 lg:mb-0">
                            <div className="bg-[#F8F5E4] p-4 shadow-sm border border-gray-100 rounded-lg">
                              <h3 className="font-semibold text-base md:text-lg mb-1">
                                Founded in Bengaluru
                              </h3>
                              <p className="text-xs md:text-sm text-gray-700 mb-1">
                                2023
                              </p>
                              <p className="text-sm md:text-base text-gray-600">
                                LeleKart was launched as a digital marketplace
                                with a mission to transform how India shops
                                online.
                              </p>
                            </div>
                          </div>
                          <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#2874f0] border-4 border-white"></div>
                          </div>
                          <div className="lg:w-1/2 lg:pl-8"></div>
                        </div>

                        {/* Milestone 2 */}
                        <div className="relative flex flex-col lg:flex-row">
                          <div className="lg:w-1/2 lg:pr-8"></div>
                          <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#2874f0] border-4 border-white"></div>
                          </div>
                          <div className="lg:w-1/2 lg:pl-8 mb-4 lg:mb-0">
                            <div className="bg-[#F8F5E4] p-4 shadow-sm border border-gray-100 rounded-lg">
                              <h3 className="font-semibold text-base md:text-lg mb-1">
                                Expanded Product Categories
                              </h3>
                              <p className="text-xs md:text-sm text-gray-700 mb-1">
                                2023
                              </p>
                              <p className="text-sm md:text-base text-gray-600">
                                Introduced diverse product categories from
                                electronics to fashion, serving every shopping
                                need.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Milestone 3 */}
                        <div className="relative flex flex-col lg:flex-row">
                          <div className="lg:w-1/2 lg:pr-8 lg:text-right mb-4 lg:mb-0">
                            <div className="bg-[#F8F5E4] p-4 shadow-sm border border-gray-100 rounded-lg">
                              <h3 className="font-semibold text-base md:text-lg mb-1">
                                Nationwide Presence
                              </h3>
                              <p className="text-xs md:text-sm text-gray-700 mb-1">
                                2024
                              </p>
                              <p className="text-sm md:text-base text-gray-600">
                                Expanded our delivery network to reach every
                                corner of India with fast and reliable delivery.
                              </p>
                            </div>
                          </div>
                          <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#2874f0] border-4 border-white"></div>
                          </div>
                          <div className="lg:w-1/2 lg:pl-8"></div>
                        </div>

                        {/* Milestone 4 */}
                        <div className="relative flex flex-col lg:flex-row">
                          <div className="lg:w-1/2 lg:pr-8"></div>
                          <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#2874f0] border-4 border-white"></div>
                          </div>
                          <div className="lg:w-1/2 lg:pl-8">
                            <div className="bg-[#F8F5E4] p-4 shadow-sm border border-gray-100 rounded-lg">
                              <h3 className="font-semibold text-base md:text-lg mb-1">
                                Looking to the Future
                              </h3>
                              <p className="text-xs md:text-sm text-gray-700 mb-1">
                                2025
                              </p>
                              <p className="text-sm md:text-base text-gray-600">
                                Continuing to innovate and enhance the online
                                shopping experience for all Indians.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Join Us CTA */}
              <div className="mt-8 md:mt-12 bg-[#F8F5E4] p-6 md:p-8 rounded-lg text-center">
                <AboutPageSection
                  titleFilter="Join Us CTA"
                  defaultContent={
                    <>
                      <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#2874f0]">
                        Join the LeleKart Family
                      </h2>
                      <p className="text-sm md:text-base text-gray-700 mb-4 md:mb-6 max-w-2xl mx-auto">
                        Whether you're a customer, seller, or looking to build
                        your career with us, LeleKart offers opportunities for
                        everyone to grow and succeed.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                        <a
                          href="/careers"
                          className="bg-[#2874f0] text-white px-4 md:px-6 py-2 md:py-3 rounded-sm hover:bg-[#2363cc] transition-colors text-sm md:text-base"
                        >
                          Explore Careers
                        </a>
                        <a
                          href="/seller"
                          className="bg-[#F8F5E4] text-[#2874f0] border border-[#2874f0] px-4 md:px-6 py-2 md:py-3 rounded-sm hover:bg-[#f5f9ff] transition-colors text-sm md:text-base"
                        >
                          Become a Seller
                        </a>
                      </div>
                    </>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
              Frequently Asked Questions
            </h2>
            <AboutPageSection
              titleFilter="FAQs"
              defaultContent={
                <div className="space-y-3 md:space-y-4">
                  <div className="border border-gray-200 rounded-md">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-3 md:p-4">
                        <h3 className="font-medium text-sm md:text-base">
                          What is LeleKart?
                        </h3>
                        <span className="text-[#2874f0] font-bold group-open:rotate-180 transition-transform text-lg md:text-xl">
                          +
                        </span>
                      </summary>
                      <div className="p-3 md:p-4 pt-0 text-sm md:text-base text-gray-700">
                        LeleKart is India's leading e-commerce marketplace
                        offering millions of products across multiple
                        categories. We connect buyers with sellers across the
                        country, providing a seamless shopping experience.
                      </div>
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-md">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-3 md:p-4">
                        <h3 className="font-medium text-sm md:text-base">
                          How can I become a seller on LeleKart?
                        </h3>
                        <span className="text-[#2874f0] font-bold group-open:rotate-180 transition-transform text-lg md:text-xl">
                          +
                        </span>
                      </summary>
                      <div className="p-3 md:p-4 pt-0 text-sm md:text-base text-gray-700">
                        To become a seller on LeleKart, visit our Seller Hub and
                        follow the registration process. You'll need to provide
                        business details, bank account information, and tax
                        documents. Our team will guide you through the entire
                        process.
                      </div>
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-md">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-3 md:p-4">
                        <h3 className="font-medium text-sm md:text-base">
                          Does LeleKart ship internationally?
                        </h3>
                        <span className="text-[#2874f0] font-bold group-open:rotate-180 transition-transform text-lg md:text-xl">
                          +
                        </span>
                      </summary>
                      <div className="p-3 md:p-4 pt-0 text-sm md:text-base text-gray-700">
                        Currently, LeleKart focuses on serving customers within
                        India. We deliver to almost all pin codes across the
                        country, including remote areas. International shipping
                        options may be available in the future.
                      </div>
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-md">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-3 md:p-4">
                        <h3 className="font-medium text-sm md:text-base">
                          What payment methods are accepted on LeleKart?
                        </h3>
                        <span className="text-[#2874f0] font-bold group-open:rotate-180 transition-transform text-lg md:text-xl">
                          +
                        </span>
                      </summary>
                      <div className="p-3 md:p-4 pt-0 text-sm md:text-base text-gray-700">
                        LeleKart accepts multiple payment methods including
                        credit/debit cards, net banking, UPI, wallet payments,
                        and cash on delivery. We ensure secure payment
                        processing for all transactions.
                      </div>
                    </details>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
