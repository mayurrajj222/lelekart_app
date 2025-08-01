import React, { useState } from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User } from "lucide-react";

// Sample stories data (this would typically come from an API)
const successStories = [
  {
    id: 1,
    title: "From Local Artisan to National Brand",
    category: "Seller Success",
    image:
      "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/fashion-img.png",
    date: "April 5, 2023",
    author: "Team Lelekart",
    excerpt:
      "How a small handicraft business from Rajasthan grew to serve customers nationwide through Lelekart's platform.",
    content:
      "How a small handicraft business from Rajasthan grew to serve customers nationwide through Lelekart's platform. This is the full story content. The business started in a small village and, with the help of Lelekart, expanded its reach to customers all over India. The journey was filled with challenges, but the support from the platform made it possible to scale and succeed.",
    featured: true,
  },
  {
    id: 2,
    title: "Building the Future of E-commerce Logistics",
    category: "Innovation",
    image:
      "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/grocery-img.png",
    date: "March 12, 2023",
    author: "Tech Team",
    excerpt:
      "Inside Lelekart's revolutionary approach to solving India's complex delivery challenges.",
    content:
      "Inside Lelekart's revolutionary approach to solving India's complex delivery challenges. This is the full story content. Our logistics network leverages AI and real-time data to optimize delivery routes, reduce costs, and ensure timely deliveries even in remote areas.",
    featured: true,
  },
  {
    id: 3,
    title: "Empowering Women Entrepreneurs",
    category: "Seller Success",
    image:
      "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/beauty-img.png",
    date: "February 28, 2023",
    author: "Seller Relations",
    excerpt:
      "How our dedicated programs are helping women business owners thrive in the digital marketplace.",
    content:
      "How our dedicated programs are helping women business owners thrive in the digital marketplace. This is the full story content. Through mentorship, funding, and training, Lelekart has enabled thousands of women to start and grow their businesses online.",
    featured: false,
  },
  {
    id: 4,
    title: "AI-Powered Shopping Recommendations",
    category: "Innovation",
    image:
      "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/mobile-img.png",
    date: "January 17, 2023",
    author: "AI Team",
    excerpt:
      "The technology behind our personalized shopping experience that helps customers discover products they'll love.",
    content:
      "The technology behind our personalized shopping experience that helps customers discover products they'll love. This is the full story content. Our AI engine analyzes user preferences and shopping patterns to recommend the best products for each customer.",
    featured: false,
  },
  {
    id: 5,
    title: "Bringing the Internet to Rural India",
    category: "Social Impact",
    image:
      "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/home-img.png",
    date: "December 15, 2022",
    author: "CSR Team",
    excerpt:
      "Our initiatives to bridge the digital divide and make e-commerce accessible to everyone in India.",
    content:
      "Our initiatives to bridge the digital divide and make e-commerce accessible to everyone in India. This is the full story content. We have set up digital literacy camps and provided affordable internet access in hundreds of villages.",
    featured: false,
  },
  {
    id: 6,
    title: "Sustainable Packaging Revolution",
    category: "Social Impact",
    image:
      "https://static-assets-web.flixcart.com/fk-sp-static/images/industry_landing_images/electronics-img.png",
    date: "November 6, 2022",
    author: "Sustainability Team",
    excerpt:
      "How we're reducing our environmental footprint with innovative packaging solutions.",
    content:
      "How we're reducing our environmental footprint with innovative packaging solutions. This is the full story content. Our new packaging uses recycled materials and is 100% biodegradable, helping us move towards a greener future.",
    featured: false,
  },
];

export default function StoriesPage() {
  const [expandedStoryId, setExpandedStoryId] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    content: "",
  });

  const handleToggleExpand = (storyId: number) => {
    setExpandedStoryId((prev) => (prev === storyId ? null : storyId));
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(true);
    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmitSuccess(false);
      setForm({ name: "", email: "", title: "", content: "" });
    }, 2000);
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
                Lelekart Stories
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                Discover innovations, seller success stories, and social impact
                initiatives
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="stories_page"
                titleFilter="Stories Intro"
                defaultContent={
                  <div className="mb-8 md:mb-10 text-gray-700">
                    <p className="text-sm md:text-base lg:text-lg">
                      At Lelekart, we're building more than just an e-commerce
                      platform - we're creating opportunities, driving
                      innovation, and making a positive impact across India.
                      Through Lelekart Stories, we share the journeys of sellers
                      who've transformed their businesses, the technologies
                      reshaping online shopping, and the initiatives that are
                      making a difference in communities.
                    </p>
                  </div>
                }
              />

              {/* Featured Stories */}
              <div className="mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Featured Stories
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <StaticPageSection
                    section="stories_page"
                    titleFilter="Featured Stories"
                    defaultContent={
                      <>
                        {successStories
                          .filter((story) => story.featured)
                          .map((story) => (
                            <Card
                              key={story.id}
                              className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow bg-transparent"
                            >
                              <div className="relative h-40 md:h-48 w-full bg-gray-100">
                                <img
                                  src={story.image}
                                  alt={story.title}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute top-2 md:top-3 left-2 md:left-3">
                                  <span className="bg-[#2874f0] text-white text-xs font-semibold px-2 md:px-3 py-1 rounded-full">
                                    {story.category}
                                  </span>
                                </div>
                              </div>
                              <CardContent className="p-4 md:p-5">
                                <h3 className="text-lg md:text-xl font-semibold mb-2">
                                  {story.title}
                                </h3>
                                <p className="text-sm md:text-base text-gray-600 mb-3">
                                  {expandedStoryId === story.id
                                    ? story.content
                                    : story.excerpt}
                                </p>
                                <div className="flex items-center text-xs md:text-sm text-gray-500">
                                  <div className="flex items-center mr-3 md:mr-4">
                                    <Clock
                                      size={12}
                                      className="mr-1 md:w-[14px] md:h-[14px]"
                                    />
                                    <span>{story.date}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <User
                                      size={12}
                                      className="mr-1 md:w-[14px] md:h-[14px]"
                                    />
                                    <span>{story.author}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-[#2874f0] text-sm md:text-base"
                                  onClick={() => handleToggleExpand(story.id)}
                                >
                                  {expandedStoryId === story.id
                                    ? "Show Less"
                                    : "Read More"}
                                </Button>
                              </CardContent>
                              <CardFooter className="p-4 md:p-5 pt-0">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto text-[#2874f0] text-sm md:text-base"
                                >
                                  Read Full Story
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                      </>
                    }
                  />
                </div>
              </div>

              {/* All Stories */}
              <div className="mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Explore All Stories
                </h2>
                <Tabs defaultValue="all" className="w-full">
                  <div className="overflow-x-auto">
                    <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-6 min-w-max">
                      <TabsTrigger value="all" className="text-xs md:text-sm">
                        All
                      </TabsTrigger>
                      <TabsTrigger
                        value="seller"
                        className="text-xs md:text-sm"
                      >
                        Seller Success
                      </TabsTrigger>
                      <TabsTrigger
                        value="innovation"
                        className="text-xs md:text-sm"
                      >
                        Innovation
                      </TabsTrigger>
                      <TabsTrigger
                        value="impact"
                        className="text-xs md:text-sm"
                      >
                        Social Impact
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="all">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <StaticPageSection
                        section="stories_page"
                        titleFilter="All Stories"
                        defaultContent={
                          <>
                            {successStories.map((story) => (
                              <Card
                                key={story.id}
                                className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow bg-transparent"
                              >
                                <div className="relative h-32 md:h-40 w-full bg-gray-100">
                                  <img
                                    src={story.image}
                                    alt={story.title}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute top-2 md:top-3 left-2 md:left-3">
                                    <span className="bg-[#2874f0] text-white text-xs font-semibold px-2 md:px-3 py-1 rounded-full">
                                      {story.category}
                                    </span>
                                  </div>
                                </div>
                                <CardContent className="p-3 md:p-4">
                                  <h3 className="text-base md:text-lg font-semibold mb-2">
                                    {story.title}
                                  </h3>
                                  <p className="text-xs md:text-sm text-gray-600 mb-3">
                                    {expandedStoryId === story.id
                                      ? story.content
                                      : story.excerpt}
                                  </p>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <div className="flex items-center mr-2 md:mr-3">
                                      <Clock
                                        size={10}
                                        className="mr-1 md:w-3 md:h-3"
                                      />
                                      <span>{story.date}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <User
                                        size={10}
                                        className="mr-1 md:w-3 md:h-3"
                                      />
                                      <span>{story.author}</span>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="p-3 md:p-4 pt-0">
                                  <Button
                                    variant="link"
                                    className="p-0 h-auto text-xs md:text-sm text-[#2874f0]"
                                    onClick={() => handleToggleExpand(story.id)}
                                  >
                                    {expandedStoryId === story.id
                                      ? "Show Less"
                                      : "Read More"}
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                          </>
                        }
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="seller">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <StaticPageSection
                        section="stories_page"
                        titleFilter="Seller Stories"
                        defaultContent={
                          <>
                            {successStories
                              .filter(
                                (story) => story.category === "Seller Success"
                              )
                              .map((story) => (
                                <Card
                                  key={story.id}
                                  className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow bg-transparent"
                                >
                                  <div className="relative h-32 md:h-40 w-full bg-gray-100">
                                    <img
                                      src={story.image}
                                      alt={story.title}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <CardContent className="p-3 md:p-4">
                                    <h3 className="text-base md:text-lg font-semibold mb-2">
                                      {story.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                                      {expandedStoryId === story.id
                                        ? story.content
                                        : story.excerpt}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <div className="flex items-center mr-2 md:mr-3">
                                        <Clock
                                          size={10}
                                          className="mr-1 md:w-3 md:h-3"
                                        />
                                        <span>{story.date}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <User
                                          size={10}
                                          className="mr-1 md:w-3 md:h-3"
                                        />
                                        <span>{story.author}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                  <CardFooter className="p-3 md:p-4 pt-0">
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto text-xs md:text-sm text-[#2874f0]"
                                      onClick={() =>
                                        handleToggleExpand(story.id)
                                      }
                                    >
                                      {expandedStoryId === story.id
                                        ? "Show Less"
                                        : "Read More"}
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                          </>
                        }
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="innovation">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <StaticPageSection
                        section="stories_page"
                        titleFilter="Innovation Stories"
                        defaultContent={
                          <>
                            {successStories
                              .filter(
                                (story) => story.category === "Innovation"
                              )
                              .map((story) => (
                                <Card
                                  key={story.id}
                                  className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow bg-transparent"
                                >
                                  <div className="relative h-32 md:h-40 w-full bg-gray-100">
                                    <img
                                      src={story.image}
                                      alt={story.title}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <CardContent className="p-3 md:p-4">
                                    <h3 className="text-base md:text-lg font-semibold mb-2">
                                      {story.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                                      {expandedStoryId === story.id
                                        ? story.content
                                        : story.excerpt}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <div className="flex items-center mr-2 md:mr-3">
                                        <Clock
                                          size={10}
                                          className="mr-1 md:w-3 md:h-3"
                                        />
                                        <span>{story.date}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <User
                                          size={10}
                                          className="mr-1 md:w-3 md:h-3"
                                        />
                                        <span>{story.author}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                  <CardFooter className="p-3 md:p-4 pt-0">
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto text-xs md:text-sm text-[#2874f0]"
                                      onClick={() =>
                                        handleToggleExpand(story.id)
                                      }
                                    >
                                      {expandedStoryId === story.id
                                        ? "Show Less"
                                        : "Read More"}
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                          </>
                        }
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="impact">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <StaticPageSection
                        section="stories_page"
                        titleFilter="Impact Stories"
                        defaultContent={
                          <>
                            {successStories
                              .filter(
                                (story) => story.category === "Social Impact"
                              )
                              .map((story) => (
                                <Card
                                  key={story.id}
                                  className="overflow-hidden h-full border-[#efefef] hover:shadow-md transition-shadow bg-transparent"
                                >
                                  <div className="relative h-32 md:h-40 w-full bg-gray-100">
                                    <img
                                      src={story.image}
                                      alt={story.title}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <CardContent className="p-3 md:p-4">
                                    <h3 className="text-base md:text-lg font-semibold mb-2">
                                      {story.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-600 mb-3">
                                      {expandedStoryId === story.id
                                        ? story.content
                                        : story.excerpt}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <div className="flex items-center mr-2 md:mr-3">
                                        <Clock
                                          size={10}
                                          className="mr-1 md:w-3 md:h-3"
                                        />
                                        <span>{story.date}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <User
                                          size={10}
                                          className="mr-1 md:w-3 md:h-3"
                                        />
                                        <span>{story.author}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                  <CardFooter className="p-3 md:p-4 pt-0">
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto text-xs md:text-sm text-[#2874f0]"
                                      onClick={() =>
                                        handleToggleExpand(story.id)
                                      }
                                    >
                                      {expandedStoryId === story.id
                                        ? "Show Less"
                                        : "Read More"}
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                          </>
                        }
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <StaticPageSection
                section="stories_page"
                titleFilter="Stories Footer"
                defaultContent={
                  <div className="text-center mt-8 md:mt-10">
                    <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                      Share Your Story
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto mb-4 md:mb-6">
                      Are you a seller with a success story? Or have you
                      experienced something remarkable as a Lelekart customer?
                      We'd love to hear from you!
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setShowSubmitModal(true)}
                      className="text-sm md:text-base"
                    >
                      Submit Your Story
                    </Button>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Your Story Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-[#F8F5E4] rounded-lg shadow-lg w-full max-w-md p-4 md:p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
              onClick={() => setShowSubmitModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-[#2874f0]">
              Submit Your Story
            </h2>
            {submitSuccess ? (
              <div className="text-green-600 text-center font-semibold py-6 md:py-8 text-sm md:text-base">
                Thank you for sharing your story!
                <br />
                Our team will review it soon.
              </div>
            ) : (
              <form
                onSubmit={handleFormSubmit}
                className="space-y-3 md:space-y-4"
              >
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    className="w-full border rounded px-3 py-2 text-sm md:text-base"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    required
                    className="w-full border rounded px-3 py-2 text-sm md:text-base"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">
                    Story Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    required
                    className="w-full border rounded px-3 py-2 text-sm md:text-base"
                    placeholder="Give your story a title"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">
                    Your Story
                  </label>
                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleFormChange}
                    required
                    className="w-full border rounded px-3 py-2 min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                    placeholder="Share your experience..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#2874f0] text-white font-semibold py-2 rounded hover:bg-[#1851a3] transition text-sm md:text-base"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
