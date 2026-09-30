
import { lazy, Suspense, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/admin/ProtectedRoute";

// ============================================================
// PUBLIC SHARED COMPONENTS
// These stay eager because they are part of the common site shell.
// ============================================================

import Header from "./components/Header";
import FloatingContact from "./components/FloatingContact";
import ScrollToTop from "./components/ScrollToTop";
import TopInfoBar from "./components/TopInfoBar";

// ============================================================
// PUBLIC PAGES — LAZY LOADED
// ============================================================

const PublicSite = lazy(() => import("./pages/PublicSite"));

const HappyMoments = lazy(() => import("./pages/HappyMoments"));

const MostVisited = lazy(() => import("./pages/MostVisited"));

const PackagesPage = lazy(() => import("./pages/PackagesPage"));

const TestimonialsPage = lazy(
  () => import("./pages/TestimonialsPage")
);

const BlogList = lazy(() => import("./pages/BlogList"));

const Contacts = lazy(() => import("./pages/Contacts"));

const BatchesPage = lazy(() => import("./pages/BatchesPage"));

const TermsAndConditions = lazy(
  () => import("./pages/TermsAndConditions")
);

const Cancellation = lazy(
  () => import("./pages/Cancellation")
);

const Booking = lazy(() => import("./pages/Booking"));

const EnquiryForm = lazy(
  () => import("./pages/EnquiryForm")
);

// ============================================================
// PUBLIC ABOUT PAGES — LAZY LOADED
// ============================================================

const AboutPage = lazy(
  () => import("./pages/about/AboutPage")
);

const Leadership = lazy(
  () => import("./pages/about/Leader")
);

const Team = lazy(
  () => import("./pages/about/Team")
);

// ============================================================
// DETAIL PAGES — LAZY LOADED
// ============================================================

const PackageDetail = lazy(
  () => import("./pages/details/PackageDetail")
);

const DestinationDetail = lazy(
  () => import("./pages/details/DestinationDetail")
);

const BlogDetail = lazy(
  () => import("./pages/details/BlogDetail")
);

const HappyMomentDetail = lazy(
  () => import("./pages/details/HappyMomentsDetails")
);

const LeadershipDetail = lazy(
  () => import("./pages/details/LeadershipDetails")
);

const TeamMemberDetail = lazy(
  () => import("./pages/details/TeamMemberDetail")
);

const BatchDetails = lazy(
  () => import("./pages/details/BatchDetails")
);

const ReviewDetail = lazy(
  () => import("./pages/details/ReviewDetail")
);

// ============================================================
// ADMIN AUTH — LAZY LOADED
// ============================================================

const Login = lazy(
  () => import("./pages/admin/Login")
);

const ForgotPassword = lazy(
  () => import("./pages/admin/ForgotPassword")
);

// ============================================================
// ADMIN DASHBOARD — LAZY LOADED
// ============================================================

const DashboardLayout = lazy(
  () => import("./pages/admin/DashboardLayout")
);

// ============================================================
// ADMIN CONTENT MANAGEMENT — LAZY LOADED
// ============================================================

const PackagesManage = lazy(
  () => import("./pages/admin/PackagesManage")
);

const TestimonialsManage = lazy(
  () => import("./pages/admin/TestimonialsManage")
);

const FAQsManage = lazy(
  () => import("./pages/admin/FAQsManage")
);

const MostVisitedManage = lazy(
  () => import("./pages/admin/MostVisitedManage")
);

const HappyMomentsManage = lazy(
  () => import("./pages/admin/HappyMomentsManage")
);

const BlogsManage = lazy(
  () => import("./pages/admin/BlogsManage")
);

const EnquiriesManage = lazy(
  () => import("./pages/admin/EnquiriesManage")
);

const BatchManage = lazy(
  () => import("./pages/admin/BatchManage")
);

const PolicyManage = lazy(
  () => import("./pages/admin/PolicyManage")
);

// ============================================================
// ADMIN ACCOUNT MANAGEMENT — LAZY LOADED
// ============================================================

const CreatorsManage = lazy(
  () => import("./pages/admin/CreatorsManage")
);

const SettingsManage = lazy(
  () => import("./pages/admin/SettingsManage")
);

// ============================================================
// ADMIN ABOUT CMS — LAZY LOADED
// ============================================================

const AboutManagement = lazy(
  () => import("./pages/admin/AboutManage")
);

const LeadershipAdmin = lazy(
  () => import("./pages/admin/LeadershipAdmin")
);

const TeamAdmin = lazy(
  () => import("./pages/admin/TeamAdmin")
);

const MilestoneAdmin = lazy(
  () => import("./pages/admin/MilestoneAdmin")
);

const ValuesAdmin = lazy(
  () => import("./pages/admin/ValuesAdmin")
);

// ============================================================
// LAZY PAGE LOADING FALLBACK
// ============================================================

function PageLoader() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div
        className="
          h-8
          w-8
          animate-spin
          rounded-full
          border-2
          border-gray-300
          border-t-gray-900
        "
        aria-label="Loading"
      />
    </div>
  );
}

// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {
  const [showEnquiry, setShowEnquiry] = useState(false);

  const location = useLocation();

  // ----------------------------------------------------------
  // Detect admin routes
  // ----------------------------------------------------------

  const isAdminRoute =
    location.pathname.startsWith("/admin");

  // ----------------------------------------------------------
  // Enquiry handlers
  // ----------------------------------------------------------

  const handlePlanTrip = () => {
    setShowEnquiry(true);
  };

  const handleCloseEnquiry = () => {
    setShowEnquiry(false);
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <>
      {/* ======================================================
          PUBLIC HEADER
      ======================================================= */}

      {!isAdminRoute && (
        <>
          <TopInfoBar />

          <Header
            onPlanTrip={handlePlanTrip}
          />
        </>
      )}

      {/* ======================================================
          APPLICATION CONTENT
      ======================================================= */}

      <div
        className="w-full min-w-0"
        style={
          !isAdminRoute
            ? {
                paddingTop:
                  "calc(var(--top-info-height, 0px) + var(--header-height, 58px))",
              }
            : undefined
        }
      >
        {/* ====================================================
            ROUTE-LEVEL CODE SPLITTING
        ===================================================== */}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ==================================================
                PUBLIC WEBSITE
            ================================================== */}

            {/* HOME */}

            <Route
              path="/"
              element={
                <PublicSite
                  onPlanTrip={handlePlanTrip}
                />
              }
            />

            {/* ==================================================
                PACKAGES
            ================================================== */}

            <Route
              path="/packages"
              element={<PackagesPage />}
            />

            <Route
              path="/packages/:slug"
              element={<PackageDetail />}
            />

            {/* ==================================================
                BATCHES
            ================================================== */}

            <Route
              path="/batches"
              element={<BatchesPage />}
            />

            <Route
              path="/batches/:slug"
              element={<BatchDetails />}
            />

            {/* ==================================================
                DESTINATIONS
            ================================================== */}

            <Route
              path="/destinations"
              element={<MostVisited />}
            />

            <Route
              path="/destinations/:slug"
              element={<DestinationDetail />}
            />

            {/* ==================================================
                HAPPY MOMENTS
            ================================================== */}

            <Route
              path="/happy-moments"
              element={<HappyMoments />}
            />

            <Route
              path="/happy-moments/:slug"
              element={<HappyMomentDetail />}
            />

            {/* ==================================================
                TESTIMONIALS / REVIEWS
            ================================================== */}

            <Route
              path="/reviews"
              element={<TestimonialsPage />}
            />

            <Route
              path="/reviews/:slug"
              element={<ReviewDetail />}
            />

            {/* ==================================================
                BLOG
            ================================================== */}

            <Route
              path="/blog"
              element={<BlogList />}
            />

            <Route
              path="/blog/:slug"
              element={<BlogDetail />}
            />

            {/* ==================================================
                CONTACT
            ================================================== */}

            <Route
              path="/contact"
              element={<Contacts />}
            />

            {/* ==================================================
                POLICIES
            ================================================== */}

            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />

            <Route
              path="/cancellation"
              element={<Cancellation />}
            />

            {/* ==================================================
                BOOKINGS
            ================================================== */}

            <Route
              path="/bookings"
              element={<Booking />}
            />

            {/* ==================================================
                PUBLIC ABOUT
            ================================================== */}

            {/* Main About */}

            <Route
              path="/about"
              element={
                <AboutPage
                  onPlanTrip={handlePlanTrip}
                />
              }
            />

            {/* Leadership */}

            <Route
              path="/about/leadership"
              element={<Leadership />}
            />

            {/* Leadership Details */}

            <Route
              path="/about/leadership/:slug"
              element={<LeadershipDetail />}
            />

            {/* Team */}

            <Route
              path="/about/team"
              element={<Team />}
            />

            {/* Team Member Details */}

            <Route
              path="/about/team/:slug"
              element={<TeamMemberDetail />}
            />

            {/* ==================================================
                ADMIN AUTHENTICATION
            ================================================== */}

            {/* Login */}

            <Route
              path="/admin/login"
              element={<Login />}
            />

            {/* Forgot Password */}

            <Route
              path="/admin/forgot-password"
              element={<ForgotPassword />}
            />

            {/* ==================================================
                PROTECTED ADMIN DASHBOARD
            ================================================== */}

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* ==================================================
                  CONTENT MANAGEMENT
              ================================================== */}

              {/* Blogs */}

              <Route
                path="blogs"
                element={<BlogsManage />}
              />

              {/* Packages */}

              <Route
                path="packages"
                element={<PackagesManage />}
              />

              {/* Batches */}

              <Route
                path="batches"
                element={<BatchManage />}
              />

              {/* Most Visited */}

              <Route
                path="most-visited"
                element={<MostVisitedManage />}
              />

              {/* Testimonials */}

              <Route
                path="testimonials"
                element={<TestimonialsManage />}
              />

              {/* FAQs */}

              <Route
                path="faqs"
                element={<FAQsManage />}
              />

              {/* Happy Moments */}

              <Route
                path="happy-moments"
                element={<HappyMomentsManage />}
              />

              {/* Enquiries */}

              <Route
                path="enquiries"
                element={<EnquiriesManage />}
              />

              {/* Policies */}

              <Route
                path="policies"
                element={<PolicyManage />}
              />

              {/* ==================================================
                  ABOUT CMS
              ================================================== */}

              {/* Main About Management */}

              <Route
                path="about"
                element={<AboutManagement />}
              />

              {/* Leadership Management */}

              <Route
                path="about/leadership"
                element={<LeadershipAdmin />}
              />

              {/* Team Management */}

              <Route
                path="about/team"
                element={<TeamAdmin />}
              />

              {/* Milestones Management */}

              <Route
                path="about/milestones"
                element={<MilestoneAdmin />}
              />

              {/* Values Management */}

              <Route
                path="about/values"
                element={<ValuesAdmin />}
              />

              {/* ==================================================
                  ADMIN ONLY
              ================================================== */}

              {/* Settings */}

              <Route
                path="settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <SettingsManage />
                  </ProtectedRoute>
                }
              />

              {/* Creators */}

              <Route
                path="creators"
                element={
                  <ProtectedRoute requireAdmin>
                    <CreatorsManage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ==================================================
                FALLBACK
            ================================================== */}

            <Route
              path="*"
              element={<PublicSite />}
            />
          </Routes>
        </Suspense>
      </div>

      {/* ======================================================
          GLOBAL ENQUIRY FORM
          Only visible on public pages
      ======================================================= */}

      {!isAdminRoute && showEnquiry && (
        <Suspense fallback={null}>
          <EnquiryForm
            onClose={handleCloseEnquiry}
          />
        </Suspense>
      )}

      {/* ======================================================
          FLOATING CONTACT
          Only visible on public pages
      ======================================================= */}

      {!isAdminRoute && <FloatingContact />}
    </>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}































































// import { useState ,lazy, Suspense} from "react";

// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   useLocation,
// } from "react-router-dom";

// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/admin/ProtectedRoute";

// import TermsAndConditions from "./pages/TermsAndConditions";
// import Cancellation from "./pages/Cancellation";
// import Booking from "./pages/Booking";
// // ============================================================
// // PUBLIC COMPONENTS
// // ============================================================

// import Header from "./components/Header";
// import FloatingContact from "./components/FloatingContact";
// import ScrollToTop from "./components/ScrollToTop";
// import EnquiryForm from "./pages/EnquiryForm";

// // ============================================================
// // PUBLIC PAGES
// // ============================================================

// import PublicSite from "./pages/PublicSite";
// import HappyMoments from "./pages/HappyMoments";
// import MostVisited from "./pages/MostVisited";

// import PackagesPage from "./pages/PackagesPage";
// import TestimonialsPage from "./pages/TestimonialsPage";
// import BlogList from "./pages/BlogList";
// import Contacts from "./pages/Contacts";
// import BatchesPage from "./pages/BatchesPage";
// // ============================================================
// // PUBLIC ABOUT PAGES
// // ============================================================

// import AboutPage from "./pages/about/AboutPage";
// import Leadership from "./pages/about/Leader";
// import Team from "./pages/about/Team";

// // ============================================================
// // DETAIL PAGES
// // ============================================================

// import PackageDetail from "./pages/details/PackageDetail";
// import DestinationDetail from "./pages/details/DestinationDetail";
// import BlogDetail from "./pages/details/BlogDetail";
// import HappyMomentDetail from "./pages/details/HappyMomentsDetails";
// import LeadershipDetail from "./pages/details/LeadershipDetails";
// import TeamMemberDetail from "./pages/details/TeamMemberDetail";
// import BatchDetails from "./pages/details/BatchDetails";
// import ReviewDetail from "./pages/details/ReviewDetail";
// // ============================================================
// // ADMIN AUTH
// // ============================================================

// import Login from "./pages/admin/Login";
// import ForgotPassword from "./pages/admin/ForgotPassword";

// // ============================================================
// // ADMIN DASHBOARD
// // ============================================================

// import DashboardLayout from "./pages/admin/DashboardLayout";

// // ============================================================
// // ADMIN CONTENT MANAGEMENT
// // ============================================================

// import PackagesManage from "./pages/admin/PackagesManage";
// import TestimonialsManage from "./pages/admin/TestimonialsManage";
// import FAQsManage from "./pages/admin/FAQsManage";
// import MostVisitedManage from "./pages/admin/MostVisitedManage";
// import HappyMomentsManage from "./pages/admin/HappyMomentsManage";
// import BlogsManage from "./pages/admin/BlogsManage";
// import EnquiriesManage from "./pages/admin/EnquiriesManage";
// import BatchManage from "./pages/admin/BatchManage";
// // ============================================================
// // ADMIN ACCOUNT MANAGEMENT
// // ============================================================

// import CreatorsManage from "./pages/admin/CreatorsManage";
// import SettingsManage from "./pages/admin/SettingsManage";

// // ============================================================
// // ADMIN ABOUT CMS
// // ============================================================

// import AboutManagement from "./pages/admin/AboutManage";
// import LeadershipAdmin from "./pages/admin/LeadershipAdmin";
// import TeamAdmin from "./pages/admin/TeamAdmin";
// import MilestoneAdmin from "./pages/admin/MilestoneAdmin";
// import ValuesAdmin from "./pages/admin/ValuesAdmin";

// import TopInfoBar from "./components/TopInfoBar";
// import PolicyManage from "./pages/admin/PolicyManage";

// // ============================================================
// // APP CONTENT
// // ============================================================

// function AppContent() {
//   const [showEnquiry, setShowEnquiry] = useState(false);

//   const location = useLocation();

//   // ----------------------------------------------------------
//   // Detect admin routes
//   // ----------------------------------------------------------

//   const isAdminRoute = location.pathname.startsWith("/admin");

//   // ----------------------------------------------------------
//   // Enquiry handlers
//   // ----------------------------------------------------------

//   const handlePlanTrip = () => {
//     setShowEnquiry(true);
//   };

//   const handleCloseEnquiry = () => {
//     setShowEnquiry(false);
//   };

//   return (
//     <>
//       {/* ======================================================
//           PUBLIC HEADER
//       ======================================================= */}

//       {!isAdminRoute && (
//         <>
//         <TopInfoBar />
//         <Header onPlanTrip={handlePlanTrip} />
//         </>
//       )}

//       {/* ======================================================
//           APPLICATION ROUTES
//       ======================================================= */}
//  <div
//   className="w-full min-w-0"
//   style={
//     !isAdminRoute
//       ? {
//           paddingTop:
//             "calc(var(--top-info-height, 0px) + var(--header-height, 58px))",
//         }
//       : undefined
//   }
// >    <Routes>

//         {/* ====================================================
//             PUBLIC WEBSITE
//         ===================================================== */}

//         {/* HOME */}
//         <Route
//           path="/"
//           element={
//             <PublicSite onPlanTrip={handlePlanTrip} />
//           }
//         />

//         {/* ====================================================
//             PACKAGES
//         ===================================================== */}

//         <Route
//           path="/packages"
//           element={<PackagesPage />}
//         />

//         <Route
//           path="/packages/:slug"
//           element={<PackageDetail />}
//         />

//         {/* ====================================================
//             BATCHES
//         ===================================================== */}

//         <Route
//           path="/batches"
//           element={<BatchesPage />}
//         />

//         <Route
//           path="/batches/:slug"
//           element={<BatchDetails />}
//         />

//         {/* ====================================================
//             DESTINATION DETAILS
//         ===================================================== */}

//         <Route path="/destinations" element={<MostVisited />} />

//         <Route
//           path="/destinations/:slug"
//           element={<DestinationDetail />}
//         />

//         {/* ====================================================
//             HAPPY MOMENTS DETAILS
//         ===================================================== */}
//         <Route path="/happy-moments" element={<HappyMoments />} />
        
//         <Route
//           path="/happy-moments/:slug"
//           element={<HappyMomentDetail />}
//         />

//         {/* ====================================================
//             TESTIMONIALS
//         ===================================================== */}

//         <Route
//           path="/reviews"
//           element={<TestimonialsPage />}
//         />

//         <Route 
//         path="/reviews/:slug"
//         element={<ReviewDetail />}
//         />

//         {/* ====================================================
//             BLOG
//         ===================================================== */}

//         <Route
//           path="/blog"
//           element={<BlogList />}
//         />

//         <Route
//           path="/blog/:slug"
//           element={<BlogDetail />}
//         />

//         {/* ====================================================
//     CONTACT
// ===================================================== */}

//         <Route
//           path="/contact"
//           element={<Contacts />}
//         />


//         <Route path="/terms-and-conditions"
//         element={<TermsAndConditions />}
//         />

//         <Route path="/cancellation"
//         element={<Cancellation />} />

//         <Route path="/bookings"
//         element={<Booking />}
//         />

        

//         {/* ====================================================
//             PUBLIC ABOUT
//         ===================================================== */}

//         {/* Main About */}
//         <Route
//           path="/about"
//           element={
//             <AboutPage onPlanTrip={handlePlanTrip} />
//           }
//         />

//         {/* Leadership */}
//         <Route
//           path="/about/leadership"
//           element={<Leadership />}
//         />

//         {/* Leadership Details */}
//         <Route
//           path="/about/leadership/:slug"
//           element={<LeadershipDetail />}
//         />

//         {/* Team */}
//         <Route
//           path="/about/team"
//           element={<Team />}
//         />

//         {/* Team Member Details */}
//         <Route
//           path="/about/team/:slug"
//           element={<TeamMemberDetail />}
//         />
        

//         {/* ====================================================
//             ADMIN AUTHENTICATION
//         ===================================================== */}

//         {/* Login */}
//         <Route
//           path="/admin/login"
//           element={<Login />}
//         />

//         {/* Forgot Password */}
//         <Route
//           path="/admin/forgot-password"
//           element={<ForgotPassword />}
//         />

//         {/* ====================================================
//             PROTECTED ADMIN DASHBOARD
//         ===================================================== */}

//         <Route
//           path="/admin/dashboard"
//           element={
//             <ProtectedRoute>
//               <DashboardLayout />
//             </ProtectedRoute>
//           }
//         >

//           {/* ==================================================
//               CONTENT MANAGEMENT
//           ================================================== */}

//           {/* Blogs */}
//           <Route
//             path="blogs"
//             element={<BlogsManage />}
//           />

//           {/* Packages */}
//           <Route
//             path="packages"
//             element={<PackagesManage />}
//           />

//           {/* Batch manage */}
//           <Route 
//             path="batches"
//             element={<BatchManage />}
//             />

//           {/* Most Visited */}
//           <Route
//             path="most-visited"
//             element={<MostVisitedManage />}
//           />

//           {/* Testimonials */}
//           <Route
//             path="testimonials"
//             element={<TestimonialsManage />}
//           />

//           {/* FAQs */}
//           <Route
//             path="faqs"
//             element={<FAQsManage />}
//           />

//           {/* Happy Moments */}
//           <Route
//             path="happy-moments"
//             element={<HappyMomentsManage />}
//           />

//           {/* Enquiries */}
//           <Route
//             path="enquiries"
//             element={<EnquiriesManage />}
//           />

//           <Route 
//           path="policies"
//           element={<PolicyManage />}
//           />

//           {/* ==================================================
//               ABOUT CMS
//           ================================================== */}

//           {/* Main About Management */}
//           <Route
//             path="about"
//             element={<AboutManagement />}
//           />

//           {/* Leadership Management */}
//           <Route
//             path="about/leadership"
//             element={<LeadershipAdmin />}
//           />

//           {/* Team Management */}
//           <Route
//             path="about/team"
//             element={<TeamAdmin />}
//           />

//           {/* Milestones Management */}
//           <Route
//             path="about/milestones"
//             element={<MilestoneAdmin />}
//           />

//           {/* Values Management */}
//           <Route
//             path="about/values"
//             element={<ValuesAdmin />}
//           />

//           {/* ==================================================
//               ADMIN ONLY
//           ================================================== */}

//           {/* Settings */}
//           <Route
//             path="settings"
//             element={
//               <ProtectedRoute requireAdmin>
//                 <SettingsManage />
//               </ProtectedRoute>
//             }
//           />

//           {/* Creators */}
//           <Route
//             path="creators"
//             element={
//               <ProtectedRoute requireAdmin>
//                 <CreatorsManage />
//               </ProtectedRoute>
//             }
//           />

//         </Route>

//         {/* ====================================================
//             FALLBACK
//         ===================================================== */}

//         <Route
//           path="*"
//           element={<PublicSite />}
//         />

     
//       </Routes>
//       </div>

//       {/* ======================================================
//           GLOBAL ENQUIRY FORM
//           Only visible on public pages
//       ======================================================= */}

//       {!isAdminRoute && showEnquiry && (
//         <EnquiryForm
//           onClose={handleCloseEnquiry}
//         />
//       )}

//       {/* ======================================================
//           FLOATING CONTACT
//           Only visible on public pages
//       ======================================================= */}

//       {!isAdminRoute && (
//         <FloatingContact />
//       )}
//     </>
//   );
// }


// // ============================================================
// // ROOT APP
// // ============================================================

// export default function App() {
//   return (
//     <BrowserRouter>
//       <ScrollToTop />

//       <AuthProvider>
//         <AppContent />
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }




