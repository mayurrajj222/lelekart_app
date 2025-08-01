import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CalendarCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function ShippingPage() {
  const [, navigate] = useLocation();
  const [pincode, setPincode] = React.useState("");
  const [isPincodeChecking, setIsPincodeChecking] = React.useState(false);
  const [pincodeResponse, setPincodeResponse] = React.useState<any>(null);
  const [showPolicy, setShowPolicy] = React.useState(false);
  const [showContact, setShowContact] = React.useState(false);

  // Pincode check logic (adapted from product-details)
  const checkPincodeAvailability = async () => {
    if (pincode.length !== 6) {
      setPincodeResponse({
        isDeliverable: false,
        message: "Please enter a valid 6-digit PIN code",
        pincode: pincode,
      });
      return;
    }
    try {
      setIsPincodeChecking(true);
      const response = await fetch(`/api/shipping/check-pincode?pincode=${pincode}`);
      const data = await response.json();
      setPincodeResponse(data);
      localStorage.setItem("last_used_pincode", pincode);
    } catch (error) {
      setPincodeResponse({
        isDeliverable: false,
        message: "Unable to check delivery availability. Please try again later.",
        pincode: pincode,
      });
    } finally {
      setIsPincodeChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Shipping & Delivery
              </h1>
              <p className="text-lg md:text-xl mb-6">
                Information about our shipping options, delivery times, and
                policies
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="shipping_page"
                titleFilter="Shipping Intro"
                defaultContent={
                  <div className="mb-8 text-gray-700">
                    <p className="text-lg">
                      At Lelekart, we're committed to delivering your orders
                      quickly, safely, and reliably. We offer various shipping
                      options to meet your needs and partner with trusted
                      logistics providers to ensure your packages reach you in
                      perfect condition.
                    </p>
                  </div>
                }
              />

              {/* Pincode Checker */}
              <div className="mb-10">
                <Card className="border-[#efefef] bg-transparent">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold mb-2">
                          Check Delivery Availability
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Enter your PIN code to check delivery availability,
                          shipping options, and estimated delivery time in your
                          area.
                        </p>
                        <div className="flex">
                          <Input
                            placeholder="Enter PIN code"
                            className="max-w-xs rounded-r-none"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            maxLength={6}
                          />
                          <Button className="rounded-l-none" onClick={checkPincodeAvailability} disabled={pincode.length !== 6 || isPincodeChecking}>
                            {isPincodeChecking ? "Checking..." : "Check"}
                          </Button>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <MapPin size={48} className="text-[#2874f0]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {pincodeResponse ? (
                <div className={`text-sm mt-2 p-2 rounded ${pincodeResponse.isDeliverable ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-700 border border-gray-200"}`}>
                  {pincodeResponse.isDeliverable ? (
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Truck size={16} className="h-4 w-4 mr-1" />
                        <span className="font-medium">Delivery available to {pincodeResponse.pincode || "this location"}</span>
                      </div>
                      <span className="mt-1">{pincodeResponse.etd ? `Delivery in ${pincodeResponse.etd} days` : "Fast delivery available"}{pincodeResponse.cod_available ? " | Cash on delivery available" : ""}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1 text-gray-500" />
                      <span>{pincodeResponse.message}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-600 text-sm mt-1">Enter your pincode to check delivery availability</div>
              )}

              {/* Shipping Options */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Shipping Options
                </h2>
                <StaticPageSection
                  section="shipping_page"
                  titleFilter="Shipping Options"
                  defaultContent={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center mb-4">
                            <div className="bg-[#2874f0]/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                              <Truck size={28} className="text-[#2874f0]" />
                            </div>
                            <h3 className="text-lg font-semibold">
                              Standard Delivery
                            </h3>
                            <p className="text-sm text-gray-500">
                              2-4 business days
                            </p>
                          </div>
                          <p className="text-gray-600 text-center">
                            Our standard shipping option. Available for most
                            areas across India with reliable delivery within 2-4
                            business days.
                          </p>
                          <div className="text-center mt-4">
                            <p className="font-medium text-green-600">
                              FREE for all orders
                            </p>
                            <p className="text-sm text-gray-500">
                              No minimum order value required
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center mb-4">
                            <div className="bg-[#2874f0]/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                              <Clock size={28} className="text-[#2874f0]" />
                            </div>
                            <h3 className="text-lg font-semibold">
                              Express Delivery
                            </h3>
                            <p className="text-sm text-gray-500">
                              Next day delivery
                            </p>
                          </div>
                          <p className="text-gray-600 text-center">
                            Get your order delivered by the next business day.
                            Available for select pincodes in major cities across
                            India.
                          </p>
                          <div className="text-center mt-4">
                            <p className="font-medium text-green-600">
                              FREE for all orders
                            </p>
                            <p className="text-sm text-gray-500">
                              No membership required
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-[#efefef] hover:shadow-md transition-shadow bg-transparent">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center mb-4">
                            <div className="bg-[#2874f0]/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                              <CalendarCheck
                                size={28}
                                className="text-[#2874f0]"
                              />
                            </div>
                            <h3 className="text-lg font-semibold">
                              Scheduled Delivery
                            </h3>
                            <p className="text-sm text-gray-500">
                              Choose your delivery date
                            </p>
                          </div>
                          <p className="text-gray-600 text-center">
                            Select your preferred delivery date and time slot.
                            Ideal for planned purchases or gifts for special
                            occasions.
                          </p>
                          <div className="text-center mt-4">
                            <p className="font-medium text-green-600">
                              FREE for all orders
                            </p>
                            <p className="text-sm text-gray-500">
                              Available in select metro cities
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  }
                />
              </div>

              {/* Shipping Locations */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Shipping Coverage
                </h2>
                <StaticPageSection
                  section="shipping_page"
                  titleFilter="Shipping Coverage"
                  defaultContent={
                    <Tabs defaultValue="domestic" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="domestic">
                          Domestic Shipping
                        </TabsTrigger>
                        <TabsTrigger value="international">
                          International Shipping
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="domestic">
                        <div className="space-y-6">
                          <p className="text-gray-700">
                            We currently deliver to over 19,000 pincodes across
                            India, covering all major cities and most rural
                            areas.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-[#efefef] bg-transparent">
                              <CardContent className="p-4">
                                <h3 className="font-semibold mb-2">
                                  Metro Cities
                                </h3>
                                <ul className="text-gray-600 text-sm space-y-1">
                                  <li>Delhi NCR</li>
                                  <li>Mumbai</li>
                                  <li>Bangalore</li>
                                  <li>Hyderabad</li>
                                  <li>Chennai</li>
                                  <li>Kolkata</li>
                                  <li>Pune</li>
                                  <li>Ahmedabad</li>
                                </ul>
                                <div className="mt-2 text-xs text-gray-500">
                                  <p>Delivery in 1-3 days</p>
                                  <p>All shipping options available</p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="border-[#efefef] bg-transparent">
                              <CardContent className="p-4">
                                <h3 className="font-semibold mb-2">
                                  Tier 2 Cities
                                </h3>
                                <ul className="text-gray-600 text-sm space-y-1">
                                  <li>Jaipur</li>
                                  <li>Lucknow</li>
                                  <li>Chandigarh</li>
                                  <li>Bhubaneswar</li>
                                  <li>Nagpur</li>
                                  <li>Indore</li>
                                  <li>Patna</li>
                                  <li>And many more...</li>
                                </ul>
                                <div className="mt-2 text-xs text-gray-500">
                                  <p>Delivery in 2-4 days</p>
                                  <p>Standard & Express shipping available</p>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="border-[#efefef] bg-transparent">
                              <CardContent className="p-4">
                                <h3 className="font-semibold mb-2">
                                  Other Regions
                                </h3>
                                <ul className="text-gray-600 text-sm space-y-1">
                                  <li>Northeast States</li>
                                  <li>Jammu & Kashmir</li>
                                  <li>Himachal Pradesh</li>
                                  <li>Andaman & Nicobar Islands</li>
                                  <li>Lakshadweep</li>
                                  <li>Rural areas</li>
                                </ul>
                                <div className="mt-2 text-xs text-gray-500">
                                  <p>Delivery in 5-10 days</p>
                                  <p>Standard shipping only</p>
                                  <p>Some restrictions may apply</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800 text-sm">
                            <div className="flex items-start">
                              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium">Note</p>
                                <p>
                                  Some remote locations may have longer delivery
                                  times and limited shipping options. Check
                                  availability for your specific pincode using
                                  the tool above.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="international">
                        <div className="space-y-6">
                          <p className="text-gray-700">
                            We currently don't offer direct international
                            shipping. However, you can use our partners for
                            international delivery.
                          </p>

                          <Card className="border-[#efefef] bg-transparent">
                            <CardContent className="p-6">
                              <h3 className="font-semibold mb-4">
                                International Shipping Partners
                              </h3>
                              <p className="text-gray-600 mb-4">
                                For international shipping, you can use the
                                following shipping forwarders who partner with
                                us:
                              </p>
                              <ul className="space-y-3">
                                <li className="flex items-start">
                                  <div className="bg-[#2874f0]/10 w-8 h-8 flex items-center justify-center rounded-full mr-3 flex-shrink-0">
                                    <Truck
                                      size={16}
                                      className="text-[#2874f0]"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      ShipIndia Global
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Ships to 100+ countries. Register with
                                      them and use their Indian address for
                                      delivery.
                                    </p>
                                  </div>
                                </li>
                                <li className="flex items-start">
                                  <div className="bg-[#2874f0]/10 w-8 h-8 flex items-center justify-center rounded-full mr-3 flex-shrink-0">
                                    <Truck
                                      size={16}
                                      className="text-[#2874f0]"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      IndiaPost International
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Official postal service with international
                                      shipping available to most countries.
                                    </p>
                                  </div>
                                </li>
                                <li className="flex items-start">
                                  <div className="bg-[#2874f0]/10 w-8 h-8 flex items-center justify-center rounded-full mr-3 flex-shrink-0">
                                    <Truck
                                      size={16}
                                      className="text-[#2874f0]"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium">ExportExpress</p>
                                    <p className="text-sm text-gray-600">
                                      Specialized in shipping Indian products
                                      worldwide with customs clearance
                                      assistance.
                                    </p>
                                  </div>
                                </li>
                              </ul>
                              <p className="text-sm text-gray-600 mt-4">
                                Please contact these partners directly for
                                shipping rates, delivery times, and specific
                                country availability.
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  }
                />
              </div>

              <Separator className="my-10" />

              {/* Tracking & Policies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                    Order Tracking
                  </h2>
                  <StaticPageSection
                    section="shipping_page"
                    titleFilter="Order Tracking"
                    defaultContent={
                      <Card className="border-[#efefef] h-full bg-transparent">
                        <CardContent className="p-6">
                          <div className="flex items-start mb-4">
                            <Package className="h-6 w-6 text-[#2874f0] mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">
                                Track Your Order
                              </h3>
                              <p className="text-gray-600 mb-3">
                                You can easily track your order status and
                                shipment location through:
                              </p>
                              <ul className="space-y-2">
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Your Lelekart account under "My Orders"
                                </li>
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Order tracking link in your confirmation email
                                </li>
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  SMS notifications to your registered mobile
                                  number
                                </li>
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Lelekart mobile app notifications
                                </li>
                              </ul>
                              <div className="mt-4">
                                <Button onClick={() => navigate('/orders')}>Track Order</Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                    Shipping Policies
                  </h2>
                  <StaticPageSection
                    section="shipping_page"
                    titleFilter="Shipping Policies"
                    defaultContent={
                      <Card className="border-[#efefef] h-full bg-transparent">
                        <CardContent className="p-6">
                          <div className="flex items-start mb-4">
                            <ShieldCheck className="h-6 w-6 text-[#2874f0] mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold mb-1">
                                Our Policies
                              </h3>
                              <p className="text-gray-600 mb-3">
                                Key points about our shipping policies:
                              </p>
                              <ul className="space-y-2">
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Order processing typically takes 1-2 business
                                  days
                                </li>
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Business days exclude weekends and national
                                  holidays
                                </li>
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Delivery times are estimates and may vary
                                </li>
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Orders may be delivered in multiple shipments
                                </li>
                                <li className="flex items-center text-gray-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#2874f0] mr-2"></div>
                                  Signature may be required for high-value items
                                </li>
                              </ul>
                              <div className="mt-4">
                                <Button variant="outline" onClick={() => setShowPolicy(true)}>
                                  Read Full Policy
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                </div>
              </div>

              <StaticPageSection
                section="shipping_page"
                titleFilter="Shipping Footer"
                defaultContent={
                  <div className="bg-gray-50 rounded-lg p-6 text-center mt-10">
                    <h3 className="text-xl font-semibold mb-4">
                      Need Help With Shipping?
                    </h3>
                    <p className="text-gray-600 max-w-3xl mx-auto mb-6">
                      Our customer service team is available to assist you with
                      any questions about shipping options, delivery times, or
                      tracking your order.
                    </p>
                    <Button onClick={() => setShowContact(true)}>Contact Customer Service</Button>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {showPolicy && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
            <h2 className="text-xl font-bold mb-4">Full Shipping Policy</h2>
            <div className="text-left text-gray-700 max-h-96 overflow-y-auto mb-4">
              <p>1. Order processing typically takes 1-2 business days.</p>
              <p>2. Business days exclude weekends and national holidays.</p>
              <p>3. Delivery times are estimates and may vary by location.</p>
              <p>4. Orders may be delivered in multiple shipments.</p>
              <p>5. Signature may be required for high-value items.</p>
              <p>6. Some remote locations may have longer delivery times and limited shipping options.</p>
              <p>7. For more details, contact our customer service.</p>
            </div>
            <Button onClick={() => setShowPolicy(false)}>Close</Button>
          </div>
        </div>
      )}

      {showContact && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">Customer Service</h2>
            <p className="mb-2">Email: <a href="mailto:support@lelekart.com" className="text-blue-700 underline">support@lelekart.com</a></p>
            <p className="mb-4">Phone: <a href="tel:+911234567890" className="text-blue-700 underline">+91 12345 67890</a></p>
            <Button onClick={() => setShowContact(false)} className="mt-2">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
