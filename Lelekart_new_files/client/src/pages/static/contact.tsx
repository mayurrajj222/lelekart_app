import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Mail, PhoneCall, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

export default function ContactUsPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      // This would be connected to a real API in production
      console.log("Contact form data:", data);

      // Show success message
      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll get back to you soon!",
      });

      // Reset form
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    }
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
                Contact Us
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                We're here to help! Reach out to us through any of these
                channels.
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="contact_page"
                titleFilter="Contact Intro"
                defaultContent={
                  <div className="mb-6 md:mb-8 text-gray-600">
                    <p className="text-sm md:text-base lg:text-lg">
                      Have questions or feedback? Our customer service team is
                      available 24/7 to assist you with any inquiries about your
                      orders, products, or services.
                    </p>
                  </div>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                <Card className="border-gray-200 hover:shadow-md transition-shadow bg-transparent">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 md:mb-4">
                        <PhoneCall className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold mb-2">
                        Call Us
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mb-2">
                        Toll-Free (India)
                      </p>
                      <p className="text-base md:text-lg text-blue-600 font-medium">
                        1800 202 9898
                      </p>
                      <StaticPageSection
                        section="contact_page"
                        titleFilter="Phone Numbers"
                        defaultContent={
                          <p className="text-xs md:text-sm text-gray-500 mt-2">
                            Mon-Sat (9 AM to 9 PM)
                          </p>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-shadow bg-transparent">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 md:mb-4">
                        <Mail className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold mb-2">
                        Email Us
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mb-2">
                        For any queries
                      </p>
                      <p className="text-base md:text-lg text-blue-600 font-medium">
                        support@lelekart.com
                      </p>
                      <StaticPageSection
                        section="contact_page"
                        titleFilter="Email Info"
                        defaultContent={
                          <p className="text-xs md:text-sm text-gray-500 mt-2">
                            We'll respond within 24 hours
                          </p>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-shadow bg-transparent">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 md:mb-4">
                        <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold mb-2">
                        Business Hours
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mb-1">
                        Monday - Saturday
                      </p>
                      <p className="text-base md:text-lg text-blue-600 font-medium">
                        9:00 AM - 9:00 PM
                      </p>
                      <StaticPageSection
                        section="contact_page"
                        titleFilter="Business Hours"
                        defaultContent={
                          <p className="text-xs md:text-sm text-gray-500 mt-2">
                            Closed on National Holidays
                          </p>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="lg:col-span-1">
                  <Card className="border-gray-200 h-full bg-transparent">
                    <CardContent className="p-4 md:p-6">
                      <div className="space-y-3 md:space-y-4">
                        <h3 className="text-lg md:text-xl font-semibold">
                          Corporate Address
                        </h3>
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                          <StaticPageSection
                            section="contact_page"
                            titleFilter="Corporate Address"
                            defaultContent={
                              <p className="text-sm md:text-base text-gray-600">
                                Building no 2072, Chandigarh Royale City
                                <br />
                                Bollywood Gully
                                <br />
                                Banur
                                <br />
                                SAS Nagar
                                <br />
                                Mohali
                                <br />
                                140601
                              </p>
                            }
                          />
                        </div>

                        <h3 className="text-lg md:text-xl font-semibold mt-4 md:mt-6">
                          Registered Office
                        </h3>
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                          <StaticPageSection
                            section="contact_page"
                            titleFilter="Registered Office"
                            defaultContent={
                              <p className="text-sm md:text-base text-gray-600">
                                Lelekart Internet Private Limited,
                                <br />
                                Vaishnavi Summit, Ground Floor,
                                <br />
                                7th Main, 80 Feet Road, 3rd Block,
                                <br />
                                Koramangala,
                                <br />
                                Bengaluru, 560034,
                                <br />
                                Karnataka, India
                              </p>
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="border-gray-200 bg-transparent">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                        Send Us a Message
                      </h3>
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-3 md:space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Full Name
                            </label>
                            <Input
                              id="name"
                              placeholder="Your name"
                              {...register("name", {
                                required: "Name is required",
                              })}
                              className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                              <p className="text-red-500 text-xs md:text-sm mt-1">
                                {errors.name.message as string}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Email Address
                            </label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Your email"
                              {...register("email", {
                                required: "Email is required",
                                pattern: {
                                  value:
                                    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: "Invalid email address",
                                },
                              })}
                              className={errors.email ? "border-red-500" : ""}
                            />
                            {errors.email && (
                              <p className="text-red-500 text-xs md:text-sm mt-1">
                                {errors.email.message as string}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="subject"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Subject
                          </label>
                          <Input
                            id="subject"
                            placeholder="What is this regarding?"
                            {...register("subject", {
                              required: "Subject is required",
                            })}
                            className={errors.subject ? "border-red-500" : ""}
                          />
                          {errors.subject && (
                            <p className="text-red-500 text-xs md:text-sm mt-1">
                              {errors.subject.message as string}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="message"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Message
                          </label>
                          <Textarea
                            id="message"
                            placeholder="Your message here..."
                            rows={4}
                            {...register("message", {
                              required: "Message is required",
                            })}
                            className={errors.message ? "border-red-500" : ""}
                          />
                          {errors.message && (
                            <p className="text-red-500 text-xs md:text-sm mt-1">
                              {errors.message.message as string}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full md:w-auto"
                        >
                          {isSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <StaticPageSection
                section="contact_page"
                titleFilter="Contact Footer"
                defaultContent={
                  <div className="text-center text-gray-600 mt-4 md:mt-6">
                    <p className="text-sm md:text-base">
                      For urgent matters, please call our customer service line
                      directly.
                    </p>
                    <p className="mt-2 text-sm md:text-base">
                      <span className="font-medium">
                        Customer Service Hours:
                      </span>{" "}
                      Monday to Saturday, 9:00 AM to 9:00 PM IST
                    </p>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
