import React, { lazy, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMetaPixelPageView } from "./hooks/useMetaPixelPageView";
import { injectMetaPixel } from "./lib/metaPixel";

// Redirector component for client-side navigation without using window.location
// This helps prevent double-forward-slash issues in URLs
function Redirector({ to }: { to: string }) {
  const [_, navigate] = useLocation();

  useEffect(() => {
    navigate(to);
  }, [navigate, to]);

  return null;
}
import HomePage from "./pages/home-page";
import AuthPage from "./pages/auth-page";
import SearchResultsPage from "./pages/search-results-page";
import ProductDetailsPage from "./pages/product-details";
import CartPage from "./pages/cart-page";
import CheckoutPage from "./pages/checkout-page";
import OrdersPage from "./pages/orders-page";
import OrderDetailsPage from "./pages/order-details-page";
import OrderConfirmationPage from "./pages/order-confirmation-page";
import CategoryPage from "./pages/category-page";
import SubcategoryListingPage from "./pages/subcategory-listing-page";
import AllProductsPage from "./pages/all-products-page";
import NotFound from "./pages/not-found";

// Static Pages
import AboutUsPage from "./pages/static/about-us";
import ContactPage from "./pages/static/contact";
import CareersPage from "./pages/static/careers";
import StoriesPage from "./pages/static/stories";
import PressPage from "./pages/static/press";
import CorporateInfoPage from "./pages/static/corporate";
import FaqPage from "./pages/static/faq";
import ShippingPage from "./pages/static/shipping";
import ReturnsPage from "./pages/static/returns";
import PrivacyPolicyPage from "./pages/static/privacy";
import PaymentsPage from "./pages/static/payments";
import { Layout } from "./components/layout/layout";
import { SimpleHeader } from "./components/layout/simple-header";
import { Footer } from "./components/layout/footer";
import { CategoryMegaMenu } from "./components/layout/category-mega-menu";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./context/cart-context";
import { WalletProvider } from "./context/wallet-context";
import { WishlistProvider } from "./context/wishlist-context";
import { NotificationProvider } from "./contexts/notification-context";
import { ImpersonationBanner } from "./components/ui/impersonation-banner";

// Admin pages
import AdminDashboard from "./pages/admin/dashboard";
import AdminProducts from "./pages/admin/products";
import AdminUsers from "./pages/admin/users";
import AdminOrders from "./pages/admin/orders";
import AdminCategories from "./pages/admin/categories";
import CategoryManagement from "./pages/admin/category-management";
import DocumentTemplatesPage from "./pages/admin/document-templates";
import AdminSubcategories from "./pages/admin/subcategories";
import SellerApproval from "./pages/admin/seller-approval";
import ProductApproval from "./pages/admin/product-approval";
import BannerManagement from "./pages/admin/banner-management-new";
import DesignHero from "./pages/admin/design-hero";
import FooterManagement from "./pages/admin/footer-management";
import ManageAdmins from "./pages/admin/manage-admins";
import CreateUser from "./pages/admin/create-user";
import AdminShippingManagement from "./pages/admin/shipping-management";
import RewardsManagement from "./pages/admin/rewards-management";
import GiftCardsManagement from "./pages/admin/gift-cards-management";
import WalletManagementPage from "./pages/admin/wallet-management";
import ProductDisplaySettingsPage from "./pages/admin/product-display-settings";
import AgreementManagementPage from "./pages/admin/agreements-page";
import GSTManagementPage from "./pages/admin/gst-management";
import MediaLibraryPage from "./pages/admin/media-library";
import AdminBackupsPage from "./pages/admin/backups";
import AdminNotificationsPage from "./pages/admin/notifications";
import TicketManagementPage from "./pages/admin/ticket-management";
import AffiliateMarketingPage from "./pages/admin/affilate-marketing";
// Import shared components
import { SuspenseWrapper } from "./components/shared/suspense-wrapper";
import PressReleaseDetail from "./pages/static/press-release";
import PressAllPage from "./pages/static/press-all";
import PressArticleDetail from "./pages/static/press-article";

// Import shipping pages dynamically
const ShippingDashboard = lazy(
  () => import("./pages/admin/shipping-dashboard")
);
const PendingShipments = lazy(() => import("./pages/admin/pending-shipments"));
const ShippingRates = lazy(() => import("./pages/admin/shipping-rates"));
const TrackingManagement = lazy(
  () => import("./pages/admin/tracking-management")
);
const ShippingSettings = lazy(() => import("./pages/admin/shipping-settings"));
const ShiprocketDashboard = lazy(
  () => import("./pages/admin/shiprocket-dashboard")
);
const ShiprocketPendingShipments = lazy(
  () => import("./pages/admin/shiprocket-pending-shipments")
);

// Seller pages
import SellerDashboardPage from "./pages/seller/dashboard";
import SellerProductsPage from "./pages/seller-products";
import AddProductPage from "./pages/seller/add-product";
import EditProductPage from "./pages/seller/edit-product";
import AdminAddProductPage from "./pages/admin/add-product";
import AdminEditProductPage from "./pages/admin/edit-product";
import ProductPreviewPage from "./pages/seller/product-preview";
import PublicSellerProfilePage from "./pages/seller/public-profile";
import SellerOrdersPage from "./pages/seller/orders";
import BulkImportPage from "./pages/seller/bulk-import";
import SmartInventoryPage from "./pages/seller/smart-inventory";
import InventoryPage from "./pages/seller/inventory";
import SellerProfilePage from "./pages/seller/profile";
import SellerReturnsPage from "./pages/seller/returns";
import SellerAnalyticsPage from "./pages/seller/analytics";
import SellerPaymentsPage from "./pages/seller/payments";
import SellerSettingsPage from "./pages/seller/settings";
import SellerHelpPage from "./pages/seller/help";
import PublicSellerProfileWrapper from "./pages/seller/public-profile-wrapper";
import SellerNotificationsPage from "./pages/seller/notifications";
import SellerGettingStartedGuide from "./pages/seller/getting-started";
import SellerBestPracticesGuide from "./pages/seller/best-practices";
import SellerSuccessStories from "./pages/seller/success-stories";
import SellerWebinarsPage from "./pages/seller/webinars";
import SellerProductsListingPage from "./pages/seller-products-listing";

// Buyer pages
import BuyerDashboardPage from "./pages/buyer/dashboard";
import BuyerWishlistPage from "./pages/buyer/wishlist";
import BuyerSettingsPage from "./pages/buyer/settings";
import BuyerReviewsPage from "./pages/buyer/reviews";
import AddressManagementPage from "./pages/buyer/address-management";
import BuyerRewardsPage from "./pages/buyer/rewards";
import BuyerGiftCardsPage from "./pages/buyer/gift-cards";
import BuyerWalletPage from "./pages/buyer/wallet";
import ProductViewPage from "./pages/product-view";
// Buyer return management
import BuyerReturnsList from "./pages/buyer/returns/index";
import BuyerReturnDetails from "./pages/buyer/returns/[id]";
import BuyerCreateReturn from "./pages/buyer/returns/create";
import BuyerNotificationsPage from "./pages/buyer/notifications";

// Seller return management
import SellerReturnsList from "./pages/seller/returns/index";
import SellerReturnDetails from "./pages/seller/returns/[id]";

// Admin return management
import AdminReturnManagement from "./pages/admin/returns/index";
import AdminReturnDetails from "./pages/admin/returns/[id]";

// Import the Track Order Page
import TrackOrderPage from "./pages/track-order-page";
import RecentlyViewedPage from "./pages/buyer/recently-viewed";
import UnderPriceProductsPage from './pages/under-price-products';

function App() {
  useEffect(() => {
    injectMetaPixel();
  }, []);
  useMetaPixelPageView();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <div className="app">
                    <ImpersonationBanner />
                    <Switch>
                      {/* Public seller profile route */}
                      <Route path="/seller/public-profile/:id">
                        {(params) => <PublicSellerProfileWrapper />}
                      </Route>

                      {/* Home page */}
                      <Route path="/">
                        {() => (
                          <Layout>
                            <HomePage />
                          </Layout>
                        )}
                      </Route>

                      {/* Auth page */}
                      <Route path="/auth">
                        {() => (
                          <Layout>
                            <AuthPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Product details page */}
                      <Route path="/product/:id">
                        {(params) => (
                          <Layout>
                            <ProductDetailsPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Product view page (used for variant selection) */}
                      <Route path="/product-view/:id">
                        {(params) => (
                          <Layout>
                            <ProductViewPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Search Results Page - Support both /search and /search?q=query formats */}
                      <Route path="/search">
                        {() => (
                          <Layout>
                            <SearchResultsPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Search Results Page with legacy path format support */}
                      <Route path="/search/q=:query">
                        {(params) => {
                          const searchQuery = params?.query || "";
                          return (
                            <Layout>
                              <SearchResultsPage />
                            </Layout>
                          );
                        }}
                      </Route>

                      {/* All Products Page with pagination */}
                      <Route path="/products">
                        {() => (
                          <Layout>
                            <AllProductsPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Redirect for singular product using plural path */}
                      <Route path="/products/:id">
                        {(params) => {
                          // Only redirect if it's a numeric ID, not a path like /products/page/2
                          if (params?.id && !isNaN(Number(params.id))) {
                            return <Redirector to={`/product/${params.id}`} />;
                          }
                          return (
                            <Layout>
                              <NotFound />
                            </Layout>
                          );
                        }}
                      </Route>

                      <Route path="/products/page/:page">
                        {() => (
                          <Layout>
                            <AllProductsPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Subcategory listing page with custom layout (no duplicate category menu) */}
                      <Route path="/subcategories/:category">
                        {(params) => {
                          const category = params?.category;

                          if (!category) {
                            return (
                              <Layout>
                                <NotFound />
                              </Layout>
                            );
                          }

                          // Use unique key that includes route path to force complete remounting
                          const componentKey = `subcategory-listing-${category}-${Date.now()}`;
                          return (
                            <div className="min-h-screen flex flex-col">
                              {/* Custom layout for subcategory pages - not using Layout component */}
                              <SimpleHeader />
                              {/* Add a spacer when SimpleHeader is shown to prevent content overlap */}
                              <div className="h-14 md:h-14"></div>
                              {/* Add extra height for mobile search bar */}
                              <div className="h-10 md:hidden"></div>
                              {/* Only show CategoryMegaMenu once here */}
                              <CategoryMegaMenu />

                              <main className="flex-grow">
                                <div
                                  className="subcategory-page-container"
                                  key={componentKey}
                                >
                                  <SubcategoryListingPage />
                                </div>
                              </main>
                              <Footer />
                            </div>
                          );
                        }}
                      </Route>

                      {/* New dedicated subcategory page route */}
                      <Route path="/subcategory/:category/:subcategory">
                        {(params) => {
                          const category = params?.category;
                          const subcategory = params?.subcategory;

                          if (!category || !subcategory) {
                            return (
                              <Layout>
                                <NotFound />
                              </Layout>
                            );
                          }

                          // Use unique key that includes route path to force complete remounting
                          const componentKey = `subcategory-${category}-${subcategory}-${Date.now()}`;
                          return (
                            <div className="min-h-screen flex flex-col">
                              {/* Custom layout for subcategory pages - not using Layout component */}
                              <SimpleHeader />
                              {/* Add a spacer when SimpleHeader is shown to prevent content overlap */}
                              <div className="h-14 md:h-14"></div>
                              {/* Add extra height for mobile search bar */}
                              <div className="h-10 md:hidden"></div>
                              {/* Only show CategoryMegaMenu once here */}
                              <CategoryMegaMenu />

                              <main className="flex-grow">
                                <div
                                  className="subcategory-page-container"
                                  key={componentKey}
                                >
                                  <SubcategoryListingPage />
                                </div>
                              </main>
                              <Footer />
                            </div>
                          );
                        }}
                      </Route>

                      {/* Category page with custom layout (no category menu) */}
                      <Route path="/category/:category">
                        {(params) => {
                          const category = params?.category;

                          if (!category) {
                            return (
                              <Layout>
                                <NotFound />
                              </Layout>
                            );
                          }

                          // Use unique key that includes route path to force complete remounting
                          const componentKey = `category-${category}-${Date.now()}`;
                          return (
                            <div className="min-h-screen flex flex-col">
                              {/* Custom layout for category pages - not using Layout component */}
                              <SimpleHeader />
                              {/* Add a spacer when SimpleHeader is shown to prevent content overlap */}
                              <div className="h-14 md:h-14"></div>
                              {/* Add extra height for mobile search bar */}
                              <div className="h-10 md:hidden"></div>
                              {/* Only show CategoryMegaMenu once here */}
                              <CategoryMegaMenu />

                              <main className="flex-grow">
                                <div
                                  className="category-page-container"
                                  key={componentKey}
                                >
                                  <CategoryPage />
                                </div>
                              </main>
                              <Footer />
                            </div>
                          );
                        }}
                      </Route>

                      {/* Cart, Checkout, and Order routes - restricted to buyers */}
                      <Route path="/cart">
                        {() => (
                          <Layout>
                            <CartPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/checkout">
                        {() => (
                          <Layout>
                            <ProtectedRoute
                              path="/checkout"
                              role="buyer"
                              component={() => <CheckoutPage />}
                            />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/order-confirmation/:id">
                        {() => (
                          <Layout>
                            <ProtectedRoute
                              path="/order-confirmation/:id"
                              role="buyer"
                              component={() => <OrderConfirmationPage />}
                            />
                          </Layout>
                        )}
                      </Route>

                      {/* Track Order Page */}
                      <Route path="/track-order/:id">
                        {() => <TrackOrderPage />}
                      </Route>

                      {/* Orders Page */}
                      <Route path="/orders">
                        {() => (
                          <Layout>
                            <ProtectedRoute
                              path="/orders"
                              role="buyer"
                              component={() => <OrdersPage />}
                            />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/order/:id">
                        {() => (
                          <Layout>
                            <ProtectedRoute
                              path="/order/:id"
                              component={() => <OrderDetailsPage />}
                            />
                          </Layout>
                        )}
                      </Route>

                      {/* Add support for plural route format /orders/:id */}
                      <Route path="/orders/:id">
                        {() => (
                          <Layout>
                            <ProtectedRoute
                              path="/orders/:id"
                              component={() => <OrderDetailsPage />}
                            />
                          </Layout>
                        )}
                      </Route>

                      {/* Static Pages - Public */}
                      <Route path="/about-us">
                        {() => (
                          <Layout>
                            <AboutUsPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/contact">
                        {() => (
                          <Layout>
                            <ContactPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/careers">
                        {() => (
                          <Layout>
                            <CareersPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/stories">
                        {() => (
                          <Layout>
                            <StoriesPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/press">
                        {() => (
                          <Layout>
                            <PressPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/press/:id">
                        {() => (
                          <Layout>
                            <PressReleaseDetail />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/press/all">
                        {() => (
                          <Layout>
                            <PressAllPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/press/article/:id">
                        {() => (
                          <Layout>
                            <PressArticleDetail />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/corporate">
                        {() => (
                          <Layout>
                            <CorporateInfoPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/faq">
                        {() => (
                          <Layout>
                            <FaqPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/shipping">
                        {() => (
                          <Layout>
                            <ShippingPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/returns">
                        {() => (
                          <Layout>
                            <ReturnsPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/privacy">
                        {() => (
                          <Layout>
                            <PrivacyPolicyPage />
                          </Layout>
                        )}
                      </Route>

                      <Route path="/payments">
                        {() => (
                          <Layout>
                            <PaymentsPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Return Management Routes - moved to /buyer/returns path */}

                      {/* Admin Routes */}
                      <Route path="/admin">
                        {() => (
                          <ProtectedRoute
                            path="/admin"
                            role="admin"
                            component={AdminDashboard}
                          />
                        )}
                      </Route>

                      {/* Redirect for old dashboard URL to new URL */}
                      <Route path="/admin/dashboard">
                        {() => (
                          <ProtectedRoute
                            path="/admin/dashboard"
                            role="admin"
                            component={() => <Redirector to="/admin" />}
                          />
                        )}
                      </Route>

                      {/* Route for adding product in admin panel */}
                      <Route path="/admin/products/add">
                        {() => (
                          <ProtectedRoute
                            path="/admin/products/add"
                            role="admin"
                            component={AdminAddProductPage}
                          />
                        )}
                      </Route>

                      {/* Route for editing product in admin panel */}
                      <Route path="/admin/products/edit/:id">
                        {() => (
                          <ProtectedRoute
                            path="/admin/products/edit/:id"
                            role="admin"
                            component={AdminEditProductPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/products">
                        {() => (
                          <ProtectedRoute
                            path="/admin/products"
                            role="admin"
                            component={AdminProducts}
                          />
                        )}
                      </Route>

                      {/* Route for viewing individual product in admin panel */}
                      <Route path="/admin/products/:id">
                        {() => (
                          <ProtectedRoute
                            path="/admin/products/:id"
                            role="admin"
                            component={AdminProducts}
                          />
                        )}
                      </Route>

                      <Route path="/admin/users">
                        {() => (
                          <ProtectedRoute
                            path="/admin/users"
                            role="admin"
                            component={AdminUsers}
                          />
                        )}
                      </Route>

                      <Route path="/admin/orders">
                        {() => (
                          <ProtectedRoute
                            path="/admin/orders"
                            role="admin"
                            component={AdminOrders}
                          />
                        )}
                      </Route>

                      <Route path="/admin/categories">
                        {() => (
                          <ProtectedRoute
                            path="/admin/categories"
                            role="admin"
                            component={AdminCategories}
                          />
                        )}
                      </Route>

                      <Route path="/admin/subcategories">
                        {() => (
                          <ProtectedRoute
                            path="/admin/subcategories"
                            role="admin"
                            component={AdminSubcategories}
                          />
                        )}
                      </Route>

                      <Route path="/admin/category-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/category-management"
                            role="admin"
                            component={CategoryManagement}
                          />
                        )}
                      </Route>

                      <Route path="/admin/seller-approval">
                        {() => (
                          <ProtectedRoute
                            path="/admin/seller-approval"
                            role="admin"
                            component={SellerApproval}
                          />
                        )}
                      </Route>

                      <Route path="/admin/product-approval">
                        {() => (
                          <ProtectedRoute
                            path="/admin/product-approval"
                            role="admin"
                            component={ProductApproval}
                          />
                        )}
                      </Route>

                      <Route path="/admin/banner-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/banner-management"
                            role="admin"
                            component={BannerManagement}
                          />
                        )}
                      </Route>

                      <Route path="/admin/design-hero">
                        {() => (
                          <ProtectedRoute
                            path="/admin/design-hero"
                            role="admin"
                            component={DesignHero}
                          />
                        )}
                      </Route>

                      <Route path="/admin/footer-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/footer-management"
                            role="admin"
                            component={FooterManagement}
                          />
                        )}
                      </Route>

                      <Route path="/admin/document-templates">
                        {() => (
                          <ProtectedRoute
                            path="/admin/document-templates"
                            role="admin"
                            component={DocumentTemplatesPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shipping-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/shipping-management"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <AdminShippingManagement />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shipping-settings">
                        {() => (
                          <ProtectedRoute
                            path="/admin/shipping-settings"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <ShippingSettings />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shipping-dashboard">
                        {() => (
                          <ProtectedRoute
                            path="/admin/shipping-dashboard"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <ShippingDashboard />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shiprocket-dashboard">
                        {() => (
                          <ProtectedRoute
                            path="/admin/shiprocket-dashboard"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <ShiprocketDashboard />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shiprocket-pending-shipments">
                        {() => (
                          <ProtectedRoute
                            path="/admin/shiprocket-pending-shipments"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <ShiprocketPendingShipments />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/pending-shipments">
                        {() => (
                          <ProtectedRoute
                            path="/admin/pending-shipments"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <PendingShipments />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/shipping-rates">
                        {() => (
                          <ProtectedRoute
                            path="/admin/shipping-rates"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <ShippingRates />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/tracking-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/tracking-management"
                            role="admin"
                            component={() => (
                              <SuspenseWrapper>
                                <TrackingManagement />
                              </SuspenseWrapper>
                            )}
                          />
                        )}
                      </Route>

                      <Route path="/admin/manage-admins">
                        {() => (
                          <ProtectedRoute
                            path="/admin/manage-admins"
                            role="admin"
                            component={ManageAdmins}
                          />
                        )}
                      </Route>

                      <Route path="/admin/create-user">
                        {() => (
                          <ProtectedRoute
                            path="/admin/create-user"
                            role="admin"
                            component={CreateUser}
                          />
                        )}
                      </Route>

                      <Route path="/admin/rewards-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/rewards-management"
                            role="admin"
                            component={RewardsManagement}
                          />
                        )}
                      </Route>

                      <Route path="/admin/gift-cards-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/gift-cards-management"
                            role="admin"
                            component={GiftCardsManagement}
                          />
                        )}
                      </Route>

                      <Route path="/admin/wallet-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/wallet-management"
                            role="admin"
                            component={WalletManagementPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/product-display-settings">
                        {() => (
                          <ProtectedRoute
                            path="/admin/product-display-settings"
                            role="admin"
                            component={ProductDisplaySettingsPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/gst-management">
                        {() => (
                          <ProtectedRoute
                            path="/admin/gst-management"
                            role="admin"
                            component={GSTManagementPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/affilate-marketing">
                        {() => (
                          <ProtectedRoute
                            path="/admin/affilate-marketing"
                            role="admin"
                            component={AffiliateMarketingPage}
                          />
                        )}
                      </Route>

                      {/* Admin Return Management Routes */}
                      <Route path="/admin/returns">
                        {() => (
                          <ProtectedRoute
                            path="/admin/returns"
                            role="admin"
                            component={AdminReturnManagement}
                          />
                        )}
                      </Route>

                      <Route path="/admin/returns/:id">
                        {() => (
                          <ProtectedRoute
                            path="/admin/returns/:id"
                            role="admin"
                            component={AdminReturnDetails}
                          />
                        )}
                      </Route>

                      <Route path="/admin/media-library">
                        {() => (
                          <ProtectedRoute
                            path="/admin/media-library"
                            role="admin"
                            component={MediaLibraryPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/agreements">
                        {() => (
                          <ProtectedRoute
                            path="/admin/agreements"
                            role="admin"
                            component={AgreementManagementPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/backups">
                        {() => (
                          <ProtectedRoute
                            path="/admin/backups"
                            role="admin"
                            component={AdminBackupsPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/notifications">
                        {() => (
                          <ProtectedRoute
                            path="/admin/notifications"
                            role="admin"
                            component={AdminNotificationsPage}
                          />
                        )}
                      </Route>

                      <Route path="/admin/tickets">
                        {() => (
                          <ProtectedRoute
                            path="/admin/tickets"
                            role="admin"
                            component={TicketManagementPage}
                          />
                        )}
                      </Route>

                      {/* Seller Routes */}
                      <Route path="/seller/dashboard">
                        {() => (
                          <ProtectedRoute
                            path="/seller/dashboard"
                            role="seller"
                            component={SellerDashboardPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/products">
                        {() => (
                          <ProtectedRoute
                            path="/seller/products"
                            role="seller"
                            component={SellerProductsPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/products/add">
                        {() => (
                          <ProtectedRoute
                            path="/seller/products/add"
                            role="seller"
                            component={AddProductPage}
                          />
                        )}
                      </Route>

                      {/* Additional route for the alternate URL pattern */}
                      <Route path="/seller/add-product">
                        {() => (
                          <ProtectedRoute
                            path="/seller/add-product"
                            role="seller"
                            component={AddProductPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/products/edit/:id">
                        {() => (
                          <ProtectedRoute
                            path="/seller/products/edit/:id"
                            role="seller"
                            component={EditProductPage}
                          />
                        )}
                      </Route>

                      {/* Add new route for editing draft products */}
                      <Route path="/seller/drafts/edit/:id">
                        {() => (
                          <ProtectedRoute
                            path="/seller/drafts/edit/:id"
                            role="seller"
                            component={EditProductPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/products/preview/:id">
                        {() => (
                          <ProtectedRoute
                            path="/seller/products/preview/:id"
                            role="seller"
                            component={ProductPreviewPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/orders">
                        {() => (
                          <ProtectedRoute
                            path="/seller/orders"
                            role="seller"
                            component={SellerOrdersPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/bulk-import">
                        {() => (
                          <ProtectedRoute
                            path="/seller/bulk-import"
                            role="seller"
                            component={BulkImportPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/smart-inventory">
                        {() => (
                          <ProtectedRoute
                            path="/seller/smart-inventory"
                            role="seller"
                            component={SmartInventoryPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/inventory">
                        {() => (
                          <ProtectedRoute
                            path="/seller/inventory"
                            role="seller"
                            component={InventoryPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/profile">
                        {() => (
                          <ProtectedRoute
                            path="/seller/profile"
                            role="seller"
                            component={SellerProfilePage}
                          />
                        )}
                      </Route>

                      {/* Seller Return Management Routes */}
                      <Route path="/seller/returns">
                        {() => (
                          <ProtectedRoute
                            path="/seller/returns"
                            role="seller"
                            component={SellerReturnsList}
                          />
                        )}
                      </Route>

                      <Route path="/seller/returns/:id">
                        {() => (
                          <ProtectedRoute
                            path="/seller/returns/:id"
                            role="seller"
                            component={SellerReturnDetails}
                          />
                        )}
                      </Route>

                      <Route path="/seller/analytics">
                        {() => (
                          <ProtectedRoute
                            path="/seller/analytics"
                            role="seller"
                            component={SellerAnalyticsPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/payments">
                        {() => (
                          <ProtectedRoute
                            path="/seller/payments"
                            role="seller"
                            component={SellerPaymentsPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/settings">
                        {() => (
                          <ProtectedRoute
                            path="/seller/settings"
                            role="seller"
                            component={SellerSettingsPage}
                          />
                        )}
                      </Route>

                      <Route path="/seller/help">
                        {() => (
                          <ProtectedRoute
                            path="/seller/help"
                            role="seller"
                            component={SellerHelpPage}
                          />
                        )}
                      </Route>

                      {/* Seller notifications page */}
                      <Route path="/seller/notifications">
                        {() => <SellerNotificationsPage />}
                      </Route>

                      {/* Buyer Pages */}
                      <Route path="/buyer/dashboard">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/dashboard"
                            role="buyer"
                            component={BuyerDashboardPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/wishlist">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/wishlist"
                            role="buyer"
                            component={BuyerWishlistPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/settings">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/settings"
                            role="buyer"
                            component={BuyerSettingsPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/addresses">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/addresses"
                            role="buyer"
                            component={AddressManagementPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/rewards">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/rewards"
                            role="buyer"
                            component={BuyerRewardsPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/gift-cards">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/gift-cards"
                            role="buyer"
                            component={BuyerGiftCardsPage}
                          />
                        )}
                      </Route>

                      {/* Buyer Return Management Routes */}
                      <Route path="/buyer/returns">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/returns"
                            role="buyer"
                            component={BuyerReturnsList}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/returns/create/:orderId">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/returns/create/:orderId"
                            role="buyer"
                            component={BuyerCreateReturn}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/returns/:id">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/returns/:id"
                            role="buyer"
                            component={BuyerReturnDetails}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/wallet">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/wallet"
                            role="buyer"
                            component={BuyerWalletPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/reviews">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/reviews"
                            role="buyer"
                            component={BuyerReviewsPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/recently-viewed">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/recently-viewed"
                            role="buyer"
                            component={RecentlyViewedPage}
                          />
                        )}
                      </Route>

                      <Route path="/buyer/notifications">
                        {() => (
                          <ProtectedRoute
                            path="/buyer/notifications"
                            role="buyer"
                            component={BuyerNotificationsPage}
                          />
                        )}
                      </Route>

                      {/* Seller's public products page */}
                      <Route path="/seller-products/:sellerId">
                        {(params) => (
                          <Layout>
                            <SellerProductsPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Seller Getting Started Guide */}
                      <Route path="/seller/getting-started">
                        {() => (
                          <ProtectedRoute
                            path="/seller/getting-started"
                            role="seller"
                            component={SellerGettingStartedGuide}
                          />
                        )}
                      </Route>

                      {/* Seller Best Practices Guide */}
                      <Route path="/seller/best-practices">
                        {() => (
                          <ProtectedRoute
                            path="/seller/best-practices"
                            role="seller"
                            component={SellerBestPracticesGuide}
                          />
                        )}
                      </Route>

                      {/* Seller Success Stories */}
                      <Route path="/seller/success-stories">
                        {() => (
                          <ProtectedRoute
                            path="/seller/success-stories"
                            role="seller"
                            component={SellerSuccessStories}
                          />
                        )}
                      </Route>

                      {/* Seller Webinars */}
                      <Route path="/seller/webinars">
                        {() => (
                          <ProtectedRoute
                            path="/seller/webinars"
                            role="seller"
                            component={SellerWebinarsPage}
                          />
                        )}
                      </Route>

                      {/* Seller Products Listing Page */}
                      <Route path="/seller-products-listing/:sellerId">
                        {(params) => (
                          <Layout>
                            <SellerProductsListingPage />
                          </Layout>
                        )}
                      </Route>

                      {/* Under Price Products Page */}
                      <Route path="/under/:price">
                        {(params) => (
                          <Layout>
                            <UnderPriceProductsPage />
                          </Layout>
                        )}
                      </Route>

                      {/* 404 Not Found */}
                      <Route>
                        {() => (
                          <Layout>
                            <NotFound />
                          </Layout>
                        )}
                      </Route>
                    </Switch>
                    <Toaster />
                  </div>
                </TooltipProvider>
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
