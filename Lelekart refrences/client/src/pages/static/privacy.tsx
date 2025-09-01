import React from "react";
import { StaticPageSection } from "@/components/static-page-template";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Eye,
  Lock,
  FileText,
  UserCheck,
  Cookie,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        {/* Main Content Area */}
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Privacy Policy
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                How we collect, use, and protect your personal information
              </p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <StaticPageSection
                section="privacy_page"
                titleFilter="Privacy Intro"
                defaultContent={
                  <div className="mb-6 md:mb-8 text-gray-700">
                    <p className="text-sm md:text-base lg:text-lg">
                      At Lelekart, we take your privacy seriously. This Privacy
                      Policy explains how we collect, use, disclose, and
                      safeguard your information when you visit our website or
                      use our services.
                    </p>
                  </div>
                }
              />

              <div className="space-y-6 md:space-y-8 mb-8 md:mb-10">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#2874f0]">
                    OUR PRIVACY PILLARS
                  </h2>
                  <StaticPageSection
                    section="privacy_page"
                    titleFilter="Privacy Pillars"
                    defaultContent={
                      <div className="prose prose-blue max-w-none text-sm md:text-base">
                        <p>
                          <strong>Transparency:</strong> We want you to
                          understand what and how we collect information when
                          you interact with us via our website, mobile website,
                          and application (www.lelekart.com) (hereinafter
                          referred to as the "Platform").
                        </p>
                        <p>
                          <strong>Choice:</strong> We will present you with
                          options for how our trusted business partners and we
                          may use your information.
                        </p>
                        <p>
                          <strong>Data Integrity:</strong> In accordance with
                          applicable law, we will take reasonable precautions to
                          protect the information we collect about you through
                          our platform by using secure technologies.
                        </p>
                      </div>
                    }
                  />
                </div>

                <Separator />

                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#2874f0]">
                    DEFINITIONS OF TERMS USED IN PRIVACY POLICY
                  </h2>
                  <StaticPageSection
                    section="privacy_page"
                    titleFilter="Privacy Definitions"
                    defaultContent={
                      <div className="prose prose-blue max-w-none text-sm md:text-base">
                        <p>
                          <strong>Browsing Information:</strong> We use cookies
                          and web beacons to track the products you viewed and
                          purchased online, the areas or pages you viewed on our
                          platform, and other information related to your
                          browser and browsing behaviour.
                        </p>

                        <h3 className="text-lg md:text-xl font-semibold mt-4 md:mt-6 mb-2 md:mb-3">
                          Cookies
                        </h3>
                        <p>
                          A "cookie" is a text file that websites send to a
                          visitor's computer or other Internet-connected device
                          to uniquely identify the visitor's browser. When you
                          browse through our platform, unique cookies are placed
                          on your browser. The cookie's purpose is to
                          differentiate your browser from all other browsers
                          that visit our sites.
                        </p>
                        <p>
                          We can better serve you if we recognize your browser.
                          For instance, the cookies allow us to hold the
                          selections in your shopping cart when you maneuver
                          from the order page on our platform and then return to
                          finish the order; cookies prevent you from starting
                          over with your shopping.
                        </p>
                        <p>
                          We can also track which pages of our platform your
                          browser visited and whether or not you purchased a
                          product. That way, we can track things like the
                          effectiveness of our advertising campaigns.
                        </p>
                        <p>
                          Working with third-party advertising companies, using
                          cookies allow us to provide you with customized banner
                          ads on various websites, applications, customized
                          content on our platform, and customized emails that we
                          believe will be more practical than randomly-generated
                          advertisements and content because they are based on
                          your previous purchases and page visits to our
                          platform.
                        </p>

                        <h3 className="text-lg md:text-xl font-semibold mt-4 md:mt-6 mb-2 md:mb-3">
                          Interest-Based Advertising
                        </h3>
                        <p>
                          Third-party advertising companies are allowed to
                          collect your browsing information in order to provide
                          ads tailored to your interests on our behalf. For
                          further information on interest-based ads and your
                          options regarding your data, see the "Interest-Based
                          Advertising Section" below.
                        </p>

                        <h3 className="text-lg md:text-xl font-semibold mt-4 md:mt-6 mb-2 md:mb-3">
                          Personally Identifiable Information ("PII")
                        </h3>
                        <p>
                          Personally identifiable information, or PII, is any
                          information that either directly or indirectly
                          identifies you. Your name, email, gender, date of
                          birth, phone number, shipping address, credit card
                          information, purchase history, and voice from our
                          recorded call sessions are examples of PII that we may
                          collect.
                        </p>

                        <h3 className="text-lg md:text-xl font-semibold mt-4 md:mt-6 mb-2 md:mb-3">
                          Third-Party Advertising Companies
                        </h3>
                        <p>
                          Certain companies are allowed to collect information
                          from our platform's browsers in order to serve
                          interest-based ads. These businesses are typically
                          third-party ad servers, ad agencies, technology
                          vendors, or providers of sponsored content. These
                          companies collect data from a specific browser about
                          web viewing behaviours over time and across unrelated
                          websites using cookies and web beacons. They then use
                          that data to predict user preferences and deliver
                          advertisements to that browser that are calculated to
                          target the indicated preferences of that browser.
                        </p>

                        <h3 className="text-lg md:text-xl font-semibold mt-4 md:mt-6 mb-2 md:mb-3">
                          Web Beacons
                        </h3>
                        <p>
                          Web beacons will be recognizing specific cookies that
                          have been placed on your browser when you visit our
                          platform. Web beacons can communicate information that
                          a browser with a recognized cookie has accessed a page
                          or a specific part of a page on our platform,
                          depending on the location of the web beacon on the
                          platform.
                        </p>
                        <p>
                          A web beacon on our purchase confirmation page, for
                          example, will record that a browser with a recognized
                          cookie accessed that page, implying that the browser
                          was used to purchase a product. The web beacon, on the
                          other hand, does not tell us that you specifically
                          (via PII) purchased any product because the cookie
                          only identifies the browser and not you personally.
                        </p>
                        <p>
                          Web beacons are used to suggest content and products
                          that we believe may be of interest to you, to assess
                          the efficacy of our advertising campaigns, and to
                          improve our platform by recognizing the pages that are
                          visited and whether those visits result in purchases.
                          Web beacons also enable the third-party advertising
                          companies with whom we collaborate to select and serve
                          banner advertisements to your browser that you are
                          likely to be interested in.
                        </p>
                      </div>
                    }
                  />
                </div>

                <Separator />

                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#2874f0]">
                    INFORMATION COLLECTED AND USED
                  </h2>
                  <StaticPageSection
                    section="privacy_page"
                    titleFilter="Information Collection"
                    defaultContent={
                      <div className="prose prose-blue max-w-none text-sm md:text-base">
                        <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">
                          What Information Do We Collect?
                        </h3>
                        <p>
                          We collect PII at various touch points, such as when
                          you register with our platform, make a purchase on one
                          of our platforms, or use any of our services in any
                          other way. We combine PII collected from you on the
                          platform with PII obtained from third parties, which
                          include our credible business partners and social
                          media platforms.
                        </p>
                        <p>
                          Your browsing information automatically gets collected
                          when you visit our platform. This type of browsing
                          data is associated with an anonymous IP identifier and
                          is not associated with you personally. If this
                          browsing information is linked to information that can
                          be used to personally identify you, we will treat it
                          as PII.
                        </p>
                        <p>
                          Every so often, you may provide us with, and we may
                          collect from you, third-party PII (for instance, for
                          delivery purposes). It is your duty to ensure that any
                          third-party PII you provide us with is aware of: a)
                          this Privacy Policy; and b) the fact that you are
                          sharing their PII with us.
                        </p>
                        <p>
                          While you have the option of using a pseudonym or
                          remaining anonymous when dealing with us, doing so may
                          thwart us from providing you with products and
                          services or for other purposes described in this
                          Privacy Policy. This is especially applicable when you
                          buy goods online or need them delivered to your
                          registered postal address.
                        </p>
                        <p>
                          You are not required to provide any PII to us;
                          however, if you do not, we will not be in a situation
                          to provide you with the products, or services, or
                          benefits requested by you.
                        </p>
                        <p>
                          For the purposes of this Policy, any information you
                          share about yourself, whether PII or not, in an open
                          public forum – in user-generated content elements of
                          our platform, on a social network – will be considered
                          public information. Although we value and sometimes
                          request your feedback, it is best not to post it if
                          you are not comfortable with the feedback getting
                          public.
                        </p>

                        <h3 className="text-lg md:text-xl font-semibold mt-4 md:mt-6 mb-2 md:mb-3">
                          Who Collects Information?
                        </h3>
                        <p>
                          When you interact with us via our platform, call
                          centres, associated entities, service providers,
                          applications, our website, or mobile website, we
                          collect information from you. We may also obtain
                          information about you from third parties, such as
                          social media platforms or our trusted business
                          partners, who gather information from you on our
                          behalf in order to assist us in operating our platform
                          and providing services of interest to you.
                        </p>
                        <p>
                          We may obtain your PII from third parties who choose
                          to share it with us. Third-party advertising companies
                          are also allowed to collect your browsing information
                          in order to provide ads tailored to your interests on
                          our behalf.
                        </p>
                        <p>
                          When you interact with us through our platform, we may
                          collect information in a variety of ways. It may be
                          gathered in obvious, active ways, such as when you
                          make a purchase when you provide your details, such as
                          name and address or other information when using the
                          customer service chat feature, when entering a contest
                          or sweepstakes, or when uploading a photo or product
                          review to our platform.
                        </p>
                        <p>
                          It may also be collected in a passive manner or
                          automatically when you visit and navigate our platform
                          via cookies and web beacons, which capture your
                          browsing information and allow us and third-party
                          advertising companies to better customize content and
                          advertising to you.
                        </p>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 md:p-6 rounded-lg">
                <StaticPageSection
                  section="privacy_page"
                  titleFilter="Privacy Footer"
                  defaultContent={
                    <div className="text-center">
                      <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                        Questions About Our Privacy Policy?
                      </h3>
                      <p className="text-sm md:text-base text-gray-700 max-w-3xl mx-auto">
                        If you have any questions or concerns about our privacy
                        practices or would like to exercise your rights
                        regarding your personal information, please contact our
                        Data Protection Officer at privacy@lelekart.com.
                      </p>
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
