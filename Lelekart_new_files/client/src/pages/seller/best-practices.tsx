import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function SellerBestPracticesGuide() {
  return (
    <SellerDashboardLayout>
      <div className="max-w-3xl mx-auto py-4 sm:py-6 lg:py-10 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">
              Best Practices for Successful Selling
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Proven tips and strategies to help you grow your business on
              Lelekart.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            <section>
              <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">
                Introduction
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Follow these best practices to maximize your sales, delight your
                customers, and build a strong reputation on Lelekart.
              </p>
            </section>
            <section>
              <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">
                1. Optimize Your Listings
              </h2>
              <ul className="list-disc ml-4 sm:ml-6 text-gray-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>Use clear, high-resolution images for all products.</li>
                <li>
                  Write detailed, accurate product descriptions and titles.
                </li>
                <li>Highlight key features and benefits.</li>
                <li>Use relevant keywords to improve search visibility.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">
                2. Provide Excellent Customer Service
              </h2>
              <ul className="list-disc ml-4 sm:ml-6 text-gray-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>Respond promptly to customer inquiries and messages.</li>
                <li>
                  Resolve issues and complaints quickly and professionally.
                </li>
                <li>Encourage positive reviews by delivering great service.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">
                3. Manage Inventory Effectively
              </h2>
              <ul className="list-disc ml-4 sm:ml-6 text-gray-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>Keep your stock levels updated to avoid cancellations.</li>
                <li>Monitor fast-selling items and restock as needed.</li>
                <li>Remove or update listings for out-of-stock products.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">
                4. Fulfill Orders Quickly
              </h2>
              <ul className="list-disc ml-4 sm:ml-6 text-gray-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>Process and ship orders as soon as possible.</li>
                <li>Provide accurate tracking information to buyers.</li>
                <li>Package products securely to prevent damage.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">
                5. Engage with the Platform
              </h2>
              <ul className="list-disc ml-4 sm:ml-6 text-gray-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>Participate in Lelekart promotions and campaigns.</li>
                <li>Stay updated with new features and announcements.</li>
                <li>
                  Join the{" "}
                  <Link
                    href="/seller/help#community"
                    className="text-blue-600 underline"
                  >
                    Seller Community
                  </Link>{" "}
                  to connect with other sellers.
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3">
                More Resources
              </h2>
              <ul className="list-disc ml-4 sm:ml-6 text-gray-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>
                  <Link
                    href="/seller/getting-started"
                    className="text-blue-600 underline"
                  >
                    Getting Started Guide
                  </Link>
                </li>
                <li>
                  <Link href="/seller/help" className="text-blue-600 underline">
                    Help & Support
                  </Link>
                </li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </SellerDashboardLayout>
  );
}
