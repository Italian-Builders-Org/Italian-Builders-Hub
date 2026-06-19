import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import BuildersPage from "@/pages/Builders";
import ProjectsPage from "@/pages/Projects";
import OpenSourcePage from "@/pages/OpenSource";
import JoinPage from "@/pages/Join";
import MissionPage from "@/pages/Mission";
import { PrivacyPolicyPage, TermsOfServicePage } from "@/pages/Legal";
import { TechLabelProvider } from "@/pages/Home";
import {
  AdminCommunityProjectEditorPage,
  AdminCommunityProjectsPage,
  AdminInvitesPage,
  AdminMembersPage,
  AdminPage,
  AdminWaitlistPage,
  BuilderProfilePage,
  BuildersDirectoryPage,
  CommunityProjectDetailPage,
  CommunityProjectsDirectoryPage,
  DashboardPage,
  DashboardContributionsPage,
  DashboardProfilePage,
  DashboardProjectsPage,
  InvitePage,
  ProjectDetailPage,
  ProjectEditorPage,
  ProjectsDirectoryPage,
} from "@/pages/Platform";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/builders" component={BuildersDirectoryPage} />
      <Route path="/builders/:username" component={BuilderProfilePage} />
      <Route path="/projects" component={ProjectsDirectoryPage} />
      <Route path="/projects/:slug" component={ProjectDetailPage} />
      <Route
        path="/community-projects"
        component={CommunityProjectsDirectoryPage}
      />
      <Route
        path="/community-projects/:slug"
        component={CommunityProjectDetailPage}
      />
      <Route path="/os-projects" component={OpenSourcePage} />
      <Route path="/mission" component={MissionPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfServicePage} />
      <Route path="/invite/:token" component={InvitePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route
        path="/dashboard/contributions"
        component={DashboardContributionsPage}
      />
      <Route path="/dashboard/profile" component={DashboardProfilePage} />
      <Route path="/dashboard/projects" component={DashboardProjectsPage} />
      <Route path="/dashboard/projects/new" component={ProjectEditorPage} />
      <Route path="/dashboard/projects/:id" component={ProjectEditorPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/waitlist" component={AdminWaitlistPage} />
      <Route path="/admin/invites" component={AdminInvitesPage} />
      <Route path="/admin/members" component={AdminMembersPage} />
      <Route
        path="/admin/community-projects"
        component={AdminCommunityProjectsPage}
      />
      <Route
        path="/admin/community-projects/new"
        component={AdminCommunityProjectEditorPage}
      />
      <Route
        path="/admin/community-projects/:id"
        component={AdminCommunityProjectEditorPage}
      />
      <Route path="/join" component={JoinPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TechLabelProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </TechLabelProvider>
        <Toaster />
        <CookieConsentBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
