import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  DollarSign,
  ShieldCheck,
  Smartphone,
  HelpCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Payments
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                Information about payment methods, options, and policies
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="payments_page"
                titleFilter="Payments Intro"
                defaultContent={
                  <div className="mb-8 text-gray-700">
                    <p className="text-lg">
                      Lelekart offers multiple secure payment options to make
                      your shopping experience convenient and safe. We accept
                      various payment methods including credit/debit cards, net
                      banking, UPI, wallets, and cash on delivery.
                    </p>
                  </div>
                }
              />

              {/* Payment Methods */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Payment Methods
                </h2>
                <StaticPageSection
                  section="payments_page"
                  titleFilter="Payment Methods"
                  defaultContent={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-[#efefef] bg-transparent hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                              <CreditCard className="h-6 w-6 text-[#2874f0]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                Credit & Debit Cards
                              </h3>
                              <p className="text-sm text-gray-500">
                                Visa, MasterCard, Amex, RuPay
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-600">
                            We accept all major credit and debit cards issued in
                            India and 21 other countries. Your card information
                            is secured with 256-bit encryption.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-[#efefef] bg-transparent hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                              <DollarSign className="h-6 w-6 text-[#2874f0]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                Cash on Delivery
                              </h3>
                              <p className="text-sm text-gray-500">
                                Pay when you receive
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-600">
                            Pay in cash at the time of delivery. Maximum order
                            value for C-o-D is ₹50,000. Not available for all
                            products or locations.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-[#efefef] bg-transparent hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                              <Smartphone className="h-6 w-6 text-[#2874f0]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                UPI / Wallets
                              </h3>
                              <p className="text-sm text-gray-500">
                                PhonePe, GPay, Paytm & more
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-600">
                            Make instant payments using UPI apps or digital
                            wallets. Quick, convenient, and secure with no
                            additional charges.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  }
                />
              </div>

              <Separator className="my-10" />

              {/* EMI Options */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  EMI Options
                </h2>
                <StaticPageSection
                  section="payments_page"
                  titleFilter="EMI Options"
                  defaultContent={
                    <div className="mb-6 text-gray-700">
                      <p>
                        Lelekart's EMI options allow you to spread the cost of
                        your purchase over multiple monthly installments.
                        Available on orders above ₹3,000 with select banks and
                        credit cards.
                      </p>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-[#efefef] bg-transparent">
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">
                              Credit Card EMI
                            </h3>
                            <p className="text-gray-600 mb-3">
                              Pay in easy installments of 3, 6, 9, 12, 18*, or
                              24* months with credit cards from these banks:
                            </p>
                            <ul className="grid grid-cols-2 gap-2 text-gray-700">
                              <li>• HDFC Bank</li>
                              <li>• ICICI Bank</li>
                              <li>• SBI Card</li>
                              <li>• Axis Bank</li>
                              <li>• Kotak Bank</li>
                              <li>• Citi Bank</li>
                              <li>• HSBC Bank</li>
                              <li>• And more...</li>
                            </ul>
                            <p className="text-sm text-gray-500 mt-4">
                              *18 and 24 month options available on select
                              products only
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-[#efefef] bg-transparent">
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">
                              No Cost EMI
                            </h3>
                            <p className="text-gray-600 mb-3">
                              On select products, enjoy No Cost EMI where you
                              pay no interest. Available with:
                            </p>
                            <ul className="space-y-2 text-gray-700">
                              <li>• Bajaj Finserv EMI Card</li>
                              <li>
                                • Select bank credit cards (during special
                                promotions)
                              </li>
                              <li>• Cardless EMI options from select banks</li>
                            </ul>
                            <p className="text-sm text-gray-500 mt-4">
                              No Cost EMI available on select products during
                              promotions and sale events
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Payment Security */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Payment Security
                </h2>
                <StaticPageSection
                  section="payments_page"
                  titleFilter="Payment Security"
                  defaultContent={
                    <Card className="border-[#efefef] bg-transparent">
                      <CardContent className="p-6">
                        <div className="flex items-start mb-6">
                          <ShieldCheck className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-lg mb-2">
                              Secure Payments
                            </h3>
                            <p className="text-gray-700">
                              At Lelekart, we take your payment security very
                              seriously. All transactions are processed through
                              secure and trusted payment gateways with the
                              following security measures:
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="w-2 h-2 rounded-full bg-[#2874f0] mt-2 mr-3"></div>
                              <p className="text-gray-700">
                                <span className="font-medium">
                                  256-bit Encryption:
                                </span>{" "}
                                Your payment information is encrypted using
                                industry-standard SSL technology
                              </p>
                            </div>
                            <div className="flex items-start">
                              <div className="w-2 h-2 rounded-full bg-[#2874f0] mt-2 mr-3"></div>
                              <p className="text-gray-700">
                                <span className="font-medium">
                                  PCI DSS Compliance:
                                </span>{" "}
                                We adhere to Payment Card Industry Data Security
                                Standards
                              </p>
                            </div>
                            <div className="flex items-start">
                              <div className="w-2 h-2 rounded-full bg-[#2874f0] mt-2 mr-3"></div>
                              <p className="text-gray-700">
                                <span className="font-medium">
                                  Two-Factor Authentication:
                                </span>{" "}
                                Extra security for card transactions through OTP
                                verification
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="w-2 h-2 rounded-full bg-[#2874f0] mt-2 mr-3"></div>
                              <p className="text-gray-700">
                                <span className="font-medium">
                                  Fraud Detection Systems:
                                </span>{" "}
                                Advanced algorithms to detect and prevent
                                suspicious transactions
                              </p>
                            </div>
                            <div className="flex items-start">
                              <div className="w-2 h-2 rounded-full bg-[#2874f0] mt-2 mr-3"></div>
                              <p className="text-gray-700">
                                <span className="font-medium">
                                  Secure Data Storage:
                                </span>{" "}
                                We don't store your complete credit card
                                information on our servers
                              </p>
                            </div>
                            <div className="flex items-start">
                              <div className="w-2 h-2 rounded-full bg-[#2874f0] mt-2 mr-3"></div>
                              <p className="text-gray-700">
                                <span className="font-medium">
                                  Trusted Payment Partners:
                                </span>{" "}
                                We work with India's leading payment gateways
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  }
                />
              </div>

              {/* FAQs */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 text-[#2874f0]">
                  Frequently Asked Questions
                </h2>
                <StaticPageSection
                  section="payments_page"
                  titleFilter="Payment FAQs"
                  defaultContent={
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                          How do I pay for a Lelekart purchase?
                        </AccordionTrigger>
                        <AccordionContent>
                          <p>
                            Lelekart offers you multiple payment methods.
                            Whatever your online mode of payment, you can rest
                            assured that Lelekart's trusted payment gateway
                            partners use secure encryption technology to keep
                            your transaction details confidential at all times.
                            You may use Internet Banking, UPI, Gift Card, Cash
                            on Delivery, and Wallet to make your purchase.
                            Lelekart also accepts payments made using Visa,
                            MasterCard, Maestro, and American Express
                            credit/debit cards in India and 21 other countries.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-2">
                        <AccordionTrigger>
                          Are there any hidden charges when I make a purchase on
                          Lelekart?
                        </AccordionTrigger>
                        <AccordionContent>
                          <p>
                            There are NO hidden charges when you make a purchase
                            on Lelekart. The prices listed for all items are
                            final and all-inclusive. The price you see on the
                            product page is exactly what you pay. Delivery
                            charges may be extra depending on the seller's
                            policy. Please check the individual seller for the
                            same. In the case of seller WS Retail, the ₹50
                            delivery charge is waived off on orders worth ₹500
                            and over.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-3">
                        <AccordionTrigger>
                          What is Cash on Delivery?
                        </AccordionTrigger>
                        <AccordionContent>
                          <p>
                            If you are not comfortable making an online payment
                            on lelekart.com, you can opt for the Cash on
                            Delivery (C-o-D) payment method instead. With C-o-D,
                            you can pay in cash at the time of the actual
                            delivery of the product at your doorstep, without
                            requiring you to make any advance payment online.
                          </p>
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-amber-800 font-medium">
                                  Note:
                                </p>
                                <ul className="list-disc pl-5 text-sm text-amber-800 mt-1">
                                  <li>
                                    Maximum order value for C-o-D is ₹50,000
                                  </li>
                                  <li>
                                    It is strictly a cash-only payment method
                                  </li>
                                  <li>
                                    Gift Cards or store credit cannot be used
                                    for C-o-D orders
                                  </li>
                                  <li>
                                    Foreign currency cannot be used to make a
                                    C-o-D payment
                                  </li>
                                  <li>Only Indian Rupees accepted</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-4">
                        <AccordionTrigger>
                          Is it safe to use my credit/debit card on Lelekart?
                        </AccordionTrigger>
                        <AccordionContent>
                          <p>
                            Your online transaction on Lelekart is secure with
                            256-bit encryption technology to protect your card
                            information. Lelekart uses trusted payment gateways
                            managed by leading banks. Banks also use 3D Secure
                            password for additional security.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-5">
                        <AccordionTrigger>
                          What is Lelekart's credit card EMI option?
                        </AccordionTrigger>
                        <AccordionContent>
                          <p>
                            Lelekart's credit card EMI option allows you to pay
                            for your purchases in installments of 3, 6, 9, 12,
                            18*, or 24 months* with credit cards from select
                            banks (HDFC, Citi, ICICI, etc.). There is no
                            processing fee, but the bank may charge interest. Be
                            sure to check with your bank for details on how
                            cancellations, refunds, or pre-closure could affect
                            your EMI terms and interest charges.
                          </p>
                          <p className="mt-2">
                            *18 and 24 month options available on select
                            products only
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  }
                />
              </div>

              <div className="bg-[#F8F5E4] p-4 md:p-6 rounded-lg mt-8">
                <StaticPageSection
                  section="payments_page"
                  titleFilter="Payments Footer"
                  defaultContent={
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="md:w-3/4">
                        <h3 className="text-lg md:text-xl font-semibold mb-2">
                          Need Help with Payments?
                        </h3>
                        <p className="text-sm md:text-base text-gray-600">
                          If you have any questions or issues with payments, our
                          customer service team is available 24/7 to assist you.
                        </p>
                      </div>
                      <div className="md:w-1/4 flex flex-col sm:flex-row gap-3 md:justify-end">
                        <a
                          href="/contact"
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm md:text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#2874f0] text-white hover:bg-blue-700 h-10 px-4 py-2"
                        >
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Contact Support
                        </a>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
