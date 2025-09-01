import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Package,
  CreditCard,
  Shield,
  HelpCircle,
  ShoppingBag,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Helper to filter accordion items by search
  function filterAccordionItems(
    items: Array<{ question: string; answer: React.ReactNode }>
  ) {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        (typeof item.answer === "string"
          ? item.answer.toLowerCase().includes(q)
          : false)
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                Find answers to common questions about shopping on Lelekart
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {/* Search Bar */}
              <div className="mb-6 md:mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
                  <Input
                    type="text"
                    placeholder="Search for questions..."
                    className="pl-10 text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* FAQ Categories */}
              <Tabs defaultValue="orders" className="w-full mb-8 md:mb-10">
                <div className="overflow-x-auto">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4 md:mb-6 min-w-max">
                    <TabsTrigger
                      value="orders"
                      className="flex items-center gap-1 text-xs md:text-sm"
                    >
                      <Package size={14} className="md:w-4 md:h-4" />
                      <span>Orders</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="payments"
                      className="flex items-center gap-1 text-xs md:text-sm"
                    >
                      <CreditCard size={14} className="md:w-4 md:h-4" />
                      <span>Payments</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="returns"
                      className="flex items-center gap-1 text-xs md:text-sm"
                    >
                      <Package size={14} className="md:w-4 md:h-4" />
                      <span>Returns</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="account"
                      className="flex items-center gap-1 text-xs md:text-sm"
                    >
                      <User size={14} className="md:w-4 md:h-4" />
                      <span>Account</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="shopping"
                      className="flex items-center gap-1 text-xs md:text-sm"
                    >
                      <ShoppingBag size={14} className="md:w-4 md:h-4" />
                      <span>Shopping</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="flex items-center gap-1 text-xs md:text-sm"
                    >
                      <Shield size={14} className="md:w-4 md:h-4" />
                      <span>Security</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Orders Tab with search filter */}
                <TabsContent value="orders">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0] flex items-center gap-2">
                    <Package size={18} className="md:w-5 md:h-5" />
                    Orders & Shipping
                  </h2>
                  {(() => {
                    const items = [
                      {
                        question: "How do I track my order?",
                        answer: `You can track your order by following these steps: Log in to your Lelekart account, Go to 'My Orders' section, Find the order you want to track, Click on 'Track' button. You'll be able to see real-time updates on your order status and expected delivery date.`,
                      },
                      {
                        question: "When will I receive my order?",
                        answer: `Delivery times vary depending on your location and the product. Metro cities: 1-3 business days, Tier 2 cities: 2-4 business days, Other areas: 4-7 business days. The estimated delivery date is shown at checkout and in your order confirmation.`,
                      },
                      {
                        question: "Can I modify or cancel my order?",
                        answer: `You can modify or cancel your order only if it hasn't been shipped yet. Go to 'My Orders' in your account, Select the order you wish to modify or cancel, Click 'Cancel' or 'Modify' button (if available). If the order has already been shipped, you won't be able to cancel it directly. In that case, you can refuse the delivery or request a return once you receive it.`,
                      },
                      {
                        question: "How do I check my order history?",
                        answer: `To view your order history: Log in to your Lelekart account, Go to 'My Orders' section, You'll see all your past and current orders, Click on any order to view its details. Your order history is available for all orders placed within the last 12 months.`,
                      },
                      {
                        question: "What if I'm not available during delivery?",
                        answer: `If you're not available during delivery: Our delivery partner will attempt delivery up to 3 times, You'll receive notifications before each delivery attempt, You can reschedule delivery through the tracking page, For some areas, you can choose safe drop-off options. If delivery cannot be completed after 3 attempts, the order will be returned to our warehouse and a refund will be processed.`,
                      },
                    ];
                    const filtered = filterAccordionItems(items);
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center text-muted-foreground py-6 md:py-8 text-sm md:text-base">
                          No matching questions found.
                        </div>
                      );
                    }
                    return (
                      <Accordion type="single" collapsible className="w-full">
                        {filtered.map((item, idx) => (
                          <AccordionItem
                            value={`item-${idx + 1}`}
                            key={item.question}
                          >
                            <AccordionTrigger className="text-sm md:text-base">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm md:text-base">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  })()}
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0] flex items-center gap-2">
                    <CreditCard size={18} className="md:w-5 md:h-5" />
                    Payments & Pricing
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Payments FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm md:text-base">
                            What payment methods are accepted?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>We accept multiple payment methods including:</p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>
                                Credit cards (Visa, MasterCard, American
                                Express)
                              </li>
                              <li>Debit cards</li>
                              <li>Net Banking</li>
                              <li>UPI (Google Pay, PhonePe, BHIM, etc.)</li>
                              <li>Wallets (Paytm, MobiKwik, etc.)</li>
                              <li>EMI (select banks)</li>
                              <li>Cash on Delivery (restrictions may apply)</li>
                              <li>Lelekart Pay Later</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger className="text-sm md:text-base">
                            When is my credit/debit card charged?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Your card is charged immediately when you place
                              the order. If for any reason your order is
                              canceled or unavailable, a full refund will be
                              processed to your original payment method.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger className="text-sm md:text-base">
                            Is it safe to save my card information?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Yes, it's safe to save your card information on
                              Lelekart. We use industry-standard encryption and
                              security measures to protect your payment
                              information. We do not store your CVV number.
                            </p>
                            <p className="mt-2">
                              Your saved cards are secured with tokenization
                              technology as per RBI guidelines. You'll need to
                              enter your CVV each time you make a payment, even
                              with saved cards.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do EMI payments work?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              EMI (Equated Monthly Installment) allows you to
                              split your payment into equal monthly
                              installments:
                            </p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Available for orders above ₹3,000</li>
                              <li>Supported by most major banks</li>
                              <li>
                                Choose from 3, 6, 9, 12, 18, or 24 month options
                              </li>
                              <li>
                                Interest rates vary by bank (0% EMI available on
                                select products)
                              </li>
                            </ul>
                            <p className="mt-2">
                              To use EMI, select "EMI" as your payment method
                              during checkout and choose your bank and tenure.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I get an invoice for my purchase?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Your invoice is automatically generated and
                              available in your account:
                            </p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Log in to your Lelekart account</li>
                              <li>Go to "My Orders"</li>
                              <li>
                                Select the order for which you need the invoice
                              </li>
                              <li>Click on "Download Invoice"</li>
                            </ol>
                            <p className="mt-2">
                              The invoice is also sent to your registered email
                              address once your order is shipped.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Returns Tab */}
                <TabsContent value="returns">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0] flex items-center gap-2">
                    <Package size={18} className="md:w-5 md:h-5" />
                    Returns & Refunds
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Returns FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm md:text-base">
                            What is the return policy?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Our return policy allows you to return most items
                              within 7-10 days of delivery (varies by category):
                            </p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Electronics: 7 days</li>
                              <li>Clothing and accessories: 10 days</li>
                              <li>Home and kitchen: 7 days</li>
                              <li>Books: 7 days</li>
                            </ul>
                            <p className="mt-2">
                              The item must be unused, unworn, unwashed, and
                              with all original tags/packaging intact. Some
                              products like innerwear, personal care items, and
                              customized products are not eligible for returns.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I return a product?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>To return a product:</p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Log in to your Lelekart account</li>
                              <li>
                                Go to "My Orders" and find the item you want to
                                return
                              </li>
                              <li>Click on "Return" button</li>
                              <li>Select the reason for return</li>
                              <li>Choose pickup address and available slots</li>
                              <li>Print the return label (if provided)</li>
                              <li>Pack the item in its original packaging</li>
                              <li>Hand it over to our pickup agent</li>
                            </ol>
                            <p className="mt-2">
                              Once we receive and inspect the returned item,
                              we'll process your refund.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger className="text-sm md:text-base">
                            When will I get my refund?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Refund timelines depend on your payment method:
                            </p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>
                                Lelekart Wallet: 24 hours after return approval
                              </li>
                              <li>UPI/Net Banking: 3-5 business days</li>
                              <li>Credit/Debit Card: 5-7 business days</li>
                              <li>EMI: 7-10 business days</li>
                              <li>Pay Later: 7-10 business days</li>
                              <li>
                                Cash on Delivery: 7-10 business days (refunded
                                to your bank account)
                              </li>
                            </ul>
                            <p className="mt-2">
                              You'll receive an email notification once your
                              refund is processed.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger className="text-sm md:text-base">
                            What if I received a damaged or defective item?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>If you receive a damaged or defective item:</p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>
                                Initiate a return request within 48 hours of
                                delivery
                              </li>
                              <li>
                                Select "Damaged" or "Defective" as the reason
                              </li>
                              <li>
                                Provide photos of the damage/defect if prompted
                              </li>
                              <li>Choose between replacement or refund</li>
                            </ol>
                            <p className="mt-2">
                              For damaged or defective products, we offer free
                              pickup and either a replacement or a full refund.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                          <AccordionTrigger className="text-sm md:text-base">
                            Can I exchange an item instead of returning it?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Currently, we don't offer direct exchanges. If you
                              want a different size, color, or variant, you'll
                              need to:
                            </p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Return the current item</li>
                              <li>Place a new order for the desired item</li>
                            </ol>
                            <p className="mt-2">
                              This ensures you get the exact product you want
                              and maintains our quality control process.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0] flex items-center gap-2">
                    <User size={18} className="md:w-5 md:h-5" />
                    Account & Profile
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Account FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I create a Lelekart account?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>Creating a Lelekart account is easy:</p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Click on "Sign Up" at the top of the page</li>
                              <li>Enter your mobile number or email address</li>
                              <li>Verify your contact information</li>
                              <li>Set a password</li>
                              <li>Add your basic details (name, address)</li>
                            </ol>
                            <p className="mt-2">
                              You can also sign up using your Google or Facebook
                              account for faster registration.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I reset my password?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>To reset your password:</p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>
                                Click on "Forgot Password" on the login page
                              </li>
                              <li>
                                Enter your registered email or mobile number
                              </li>
                              <li>Click "Send OTP"</li>
                              <li>Enter the OTP received</li>
                              <li>Set a new password</li>
                            </ol>
                            <p className="mt-2">
                              Make sure to use a strong password with a mix of
                              letters, numbers, and special characters.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I update my profile information?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>To update your profile:</p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Log in to your account</li>
                              <li>Go to "My Account" or "Profile"</li>
                              <li>Click on "Edit Profile"</li>
                              <li>Update the information you want to change</li>
                              <li>Click "Save Changes"</li>
                            </ol>
                            <p className="mt-2">
                              You can update your name, email, mobile number,
                              and address information from your profile page.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I delete my account?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              To delete your account, please contact our
                              customer service team. They will guide you through
                              the process and ensure all your data is properly
                              removed.
                            </p>
                            <p className="mt-2">
                              Note: You cannot delete your account if you have
                              pending orders or active returns.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Shopping Tab */}
                <TabsContent value="shopping">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0] flex items-center gap-2">
                    <ShoppingBag size={18} className="md:w-5 md:h-5" />
                    Shopping & Products
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Shopping FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I find products on Lelekart?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>You can find products in several ways:</p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Use the search bar at the top of the page</li>
                              <li>Browse categories from the main menu</li>
                              <li>
                                Check out deals and offers on the homepage
                              </li>
                              <li>Use filters to narrow down your search</li>
                              <li>Sort by price, rating, or popularity</li>
                            </ul>
                            <p className="mt-2">
                              You can also save items to your wishlist for later
                              purchase.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I know if a product is genuine?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              All products sold on Lelekart are genuine and
                              sourced directly from authorized sellers and
                              brands. We have strict quality control measures in
                              place.
                            </p>
                            <p className="mt-2">
                              Look for the "Genuine Product" badge on product
                              pages, and check seller ratings and reviews for
                              additional assurance.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger className="text-sm md:text-base">
                            Can I compare products?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Yes, you can compare products by adding them to
                              your wishlist and then viewing them side by side.
                              You can compare up to 4 products at a time.
                            </p>
                            <p className="mt-2">
                              The comparison will show you key features,
                              specifications, prices, and ratings to help you
                              make an informed decision.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do I save money while shopping?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>Here are some ways to save money:</p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Use Lelekart coupons and discount codes</li>
                              <li>Shop during sales and festivals</li>
                              <li>Use cashback offers and rewards</li>
                              <li>Compare prices across sellers</li>
                              <li>Use EMI options for expensive items</li>
                              <li>Subscribe to price drop alerts</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-[#2874f0] flex items-center gap-2">
                    <Shield size={18} className="md:w-5 md:h-5" />
                    Security & Privacy
                  </h2>
                  <StaticPageSection
                    section="faq_page"
                    titleFilter="Security FAQs"
                    defaultContent={
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-sm md:text-base">
                            Is it safe to shop on Lelekart?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>
                              Yes, Lelekart is completely safe to shop on. We
                              use industry-standard security measures including:
                            </p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>SSL encryption for all transactions</li>
                              <li>PCI DSS compliance for payment security</li>
                              <li>Secure payment gateways</li>
                              <li>Two-factor authentication options</li>
                              <li>Regular security audits</li>
                            </ul>
                            <p className="mt-2">
                              Your personal and payment information is always
                              protected.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger className="text-sm md:text-base">
                            How do you protect my personal information?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>We protect your personal information through:</p>
                            <ul className="list-disc pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Data encryption at rest and in transit</li>
                              <li>Strict access controls</li>
                              <li>Regular security updates</li>
                              <li>Compliance with data protection laws</li>
                              <li>Limited data sharing with third parties</li>
                            </ul>
                            <p className="mt-2">
                              We never sell your personal information to third
                              parties for marketing purposes.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                          <AccordionTrigger className="text-sm md:text-base">
                            What should I do if I notice suspicious activity?
                          </AccordionTrigger>
                          <AccordionContent className="text-sm md:text-base">
                            <p>If you notice suspicious activity:</p>
                            <ol className="list-decimal pl-4 md:pl-5 space-y-1 mt-2 text-sm md:text-base">
                              <li>Change your password immediately</li>
                              <li>Enable two-factor authentication</li>
                              <li>
                                Check your order history for unauthorized
                                purchases
                              </li>
                              <li>Contact our customer service team</li>
                              <li>
                                Report any unauthorized transactions to your
                                bank
                              </li>
                            </ol>
                            <p className="mt-2">
                              We have a dedicated team to handle security
                              concerns and will investigate any suspicious
                              activity.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                  />
                </TabsContent>
              </Tabs>

              {/* Contact Support Section */}
              <div className="mt-8 md:mt-10 bg-[#F8F5E4] p-6 md:p-8 rounded-lg">
                <div className="text-center">
                  <HelpCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto text-[#2874f0] mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold mb-2">
                    Still have questions?
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Can't find the answer you're looking for? Our customer
                    service team is here to help.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                    <Button
                      variant="outline"
                      className="text-sm md:text-base"
                      onClick={() => (window.location.href = "/contact")}
                    >
                      Contact Support
                    </Button>
                    <Button
                      className="text-sm md:text-base"
                      onClick={() => (window.location.href = "/chat")}
                    >
                      Live Chat
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
