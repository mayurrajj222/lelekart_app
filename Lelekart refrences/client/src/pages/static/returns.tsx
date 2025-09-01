import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  PackageOpen,
  Phone,
  Mail,
} from "lucide-react";
import { useLocation } from "wouter";

export default function ReturnsPage() {
  const [pincode, setPincode] = useState("");
  const [isPincodeChecking, setIsPincodeChecking] = useState(false);
  const [pincodeResponse, setPincodeResponse] = useState<any>(null);
  const [showContact, setShowContact] = useState(false);

  // Pincode check logic (reuse from shipping)
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
      const response = await fetch(
        `/api/shipping/check-pincode?pincode=${pincode}`
      );
      const data = await response.json();
      setPincodeResponse(data);
      localStorage.setItem("last_used_pincode", pincode);
    } catch (error) {
      setPincodeResponse({
        isDeliverable: false,
        message: "Unable to check pickup availability. Please try again later.",
        pincode: pincode,
      });
    } finally {
      setIsPincodeChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Cancellations & Returns
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                Learn about our return, refund, and cancellation policies and
                how to initiate a return or cancellation.
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Intro */}
              <div className="mb-6 md:mb-8 text-gray-700">
                <p className="text-sm md:text-base lg:text-lg">
                  At Lelekart, we want you to be completely satisfied with your
                  purchase. If you're not happy with your order for any reason,
                  we offer easy returns, refunds, and cancellations as part of
                  our customer satisfaction commitment.
                </p>
              </div>

              {/* Pincode Checker for Return Pickup */}
              <div className="mb-8 md:mb-10">
                <Card className="border-[#efefef]">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-grow">
                        <h3 className="text-base md:text-lg font-semibold mb-2">
                          Check Return Pickup Availability
                        </h3>
                        <p className="text-sm md:text-base text-gray-600 mb-4">
                          Enter your PIN code to check if return pickup is
                          available in your area.
                        </p>
                        <div className="flex flex-col sm:flex-row">
                          <Input
                            placeholder="Enter PIN code"
                            className="max-w-xs rounded-r-none sm:rounded-r-none mb-2 sm:mb-0 text-sm md:text-base"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            maxLength={6}
                          />
                          <Button
                            className="rounded-l-none sm:rounded-l-none text-sm md:text-base"
                            onClick={checkPincodeAvailability}
                            disabled={pincode.length !== 6 || isPincodeChecking}
                          >
                            {isPincodeChecking ? "Checking..." : "Check"}
                          </Button>
                        </div>
                        {pincodeResponse ? (
                          <div
                            className={`text-xs md:text-sm mt-2 p-2 rounded ${pincodeResponse.isDeliverable ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-700 border border-gray-200"}`}
                          >
                            {pincodeResponse.isDeliverable ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-600" />
                                <span className="font-medium">
                                  Return pickup available at{" "}
                                  {pincodeResponse.pincode || "this location"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 text-gray-500" />
                                <span>{pincodeResponse.message}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-600 text-xs md:text-sm mt-1">
                            Enter your pincode to check return pickup
                            availability
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <PackageOpen
                          size={40}
                          className="text-[#2874f0] md:w-12 md:h-12"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Policy Details */}
              <div className="mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Return & Cancellation Policy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Card className="border-[#efefef]">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                        <RefreshCw
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />{" "}
                        Return Policy
                      </h3>
                      <ul className="space-y-2 text-xs md:text-sm">
                        <li className="flex items-start">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          Most products eligible for return within 7-10 days of
                          delivery
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          Items must be unused, unworn, and in original
                          packaging
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          All accessories, freebies, and tags must be included
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          Non-returnable items: personal care, innerwear,
                          perishables, customized products
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          Products marked as non-returnable cannot be returned
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-[#efefef]">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                        <Clock size={16} className="md:w-[18px] md:h-[18px]" />{" "}
                        Cancellation Policy
                      </h3>
                      <ul className="space-y-2 text-xs md:text-sm">
                        <li className="flex items-start">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          Orders can be cancelled before they are shipped
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          Instant refund to original payment method for prepaid
                          orders
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          No cancellation charges before shipping
                        </li>
                        <li className="flex items-start">
                          <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />{" "}
                          Orders cannot be cancelled after they are shipped
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Process Steps */}
              <div className="mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  How to Return or Cancel
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <span className="text-lg md:text-xl font-bold text-[#2874f0]">
                        1
                      </span>
                    </div>
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Initiate Request
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600">
                      Go to "My Orders" and select the item to return or cancel
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <span className="text-lg md:text-xl font-bold text-[#2874f0]">
                        2
                      </span>
                    </div>
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Choose Reason
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600">
                      Select the reason for return or cancellation
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <span className="text-lg md:text-xl font-bold text-[#2874f0]">
                        3
                      </span>
                    </div>
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Pickup/Drop-off
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600">
                      Wait for pickup or drop the item at the nearest center
                      (for returns)
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#2874f0]/10 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                      <span className="text-lg md:text-xl font-bold text-[#2874f0]">
                        4
                      </span>
                    </div>
                    <h4 className="font-medium mb-1 text-sm md:text-base">
                      Refund/Confirmation
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600">
                      Get refund or confirmation after verification
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQs */}
              <div className="mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0]">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3 md:space-y-4">
                  <Card className="border-[#efefef]">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                        <HelpCircle
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />{" "}
                        How do I initiate a return?
                      </h3>
                      <p className="text-gray-700 text-xs md:text-sm">
                        Log in to your account, go to "My Orders", select the
                        item, and click on "Return". Follow the instructions to
                        complete your request.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#efefef]">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                        <HelpCircle
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />{" "}
                        How long does it take to get a refund?
                      </h3>
                      <p className="text-gray-700 text-xs md:text-sm">
                        Refunds are processed within 5-7 business days after the
                        returned item is received and verified.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#efefef]">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                        <HelpCircle
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />{" "}
                        Can I cancel my order after it is shipped?
                      </h3>
                      <p className="text-gray-700 text-xs md:text-sm">
                        No, orders cannot be cancelled once they are shipped.
                        You may initiate a return after delivery if eligible.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-[#F8F5E4] rounded-lg p-4 md:p-6 text-center mt-8 md:mt-10">
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                  Need Help With Returns or Cancellations?
                </h3>
                <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto mb-4 md:mb-6">
                  Our customer service team is available to assist you with any
                  questions about returns, refunds, or cancellations.
                </p>
                <Button
                  onClick={() => setShowContact(true)}
                  className="text-sm md:text-base"
                >
                  Contact Support
                </Button>
              </div>
              {showContact && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 p-4">
                  <div className="bg-[#F8F5E4] rounded-lg shadow-lg p-6 md:p-8 max-w-sm w-full text-center">
                    <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
                      Customer Service
                    </h2>
                    <p className="mb-2 flex items-center justify-center gap-2 text-sm md:text-base">
                      <Mail className="h-4 w-4 text-blue-700" />{" "}
                      <a
                        href="mailto:support@lelekart.com"
                        className="text-blue-700 underline"
                      >
                        support@lelekart.com
                      </a>
                    </p>
                    <p className="mb-4 flex items-center justify-center gap-2 text-sm md:text-base">
                      <Phone className="h-4 w-4 text-blue-700" />{" "}
                      <a
                        href="tel:+911234567890"
                        className="text-blue-700 underline"
                      >
                        +91 12345 67890
                      </a>
                    </p>
                    <Button
                      onClick={() => setShowContact(false)}
                      className="mt-2 text-sm md:text-base"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
