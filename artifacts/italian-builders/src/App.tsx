import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { RouteSeo } from "@/lib/seo";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import BuildersPage from "@/pages/Builders";
import ProjectsPage from "@/pages/Projects";
import OpenSourcePage from "@/pages/OpenSource";
import JoinPage from "@/pages/Join";
import MissionPage from "@/pages/Mission";
import PioneersPage from "@/pages/Pioneers";
import Hp2Page from "@/pages/Hp2";
import {
  Hp2BuilderProfilePage,
  Hp2BuildersPage,
  Hp2CommunityProjectDetailPage,
  Hp2CommunityProjectsPage,
  Hp2JoinPage,
  Hp2MissionPage,
  Hp2PantheonPage,
  Hp2PrivacyPage,
  Hp2ProjectDetailPage,
  Hp2ProjectsPage,
  Hp2TermsPage,
} from "@/pages/Hp2Subpages";
import { PrivacyPolicyPage, TermsOfServicePage } from "@/pages/Legal";
import { TechLabelProvider } from "@/pages/Home";
import {
  AdminCommunityProjectEditorPage,
  AdminCommunityProjectsPage,
  AdminContentEditorPage,
  AdminContentPage,
  AdminInvitesPage,
  AdminMembersPage,
  AdminPage,
  AdminWaitlistPage,
  BuilderProfilePage,
  BuildersDirectoryPage,
  CommunityProjectDetailPage,
  CommunityProjectsDirectoryPage,
  CommunityContentPage,
  DashboardPage,
  DashboardContributionsPage,
  DashboardProfilePage,
  DashboardProjectsPage,
  InvitePage,
  ProjectDetailPage,
  ProjectEditorPage,
  ProjectsDirectoryPage,
  ResetPasswordPage,
} from "@/pages/Platform";

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <RouteSeo />
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
        <Route path="/content" component={CommunityContentPage} />
        <Route path="/os-projects" component={OpenSourcePage} />
        <Route path="/pantheon" component={PioneersPage} />
        <Route path="/mission" component={MissionPage} />
        <Route
          path="/hp-2/builders/:username"
          component={Hp2BuilderProfilePage}
        />
        <Route path="/hp-2/builders" component={Hp2BuildersPage} />
        <Route path="/hp-2/projects/:slug" component={Hp2ProjectDetailPage} />
        <Route path="/hp-2/projects" component={Hp2ProjectsPage} />
        <Route
          path="/hp-2/community-projects/:slug"
          component={Hp2CommunityProjectDetailPage}
        />
        <Route
          path="/hp-2/community-projects"
          component={Hp2CommunityProjectsPage}
        />
        <Route path="/hp-2/content" component={CommunityContentPage} />
        <Route path="/hp-2/pantheon" component={Hp2PantheonPage} />
        <Route path="/hp-2/mission" component={Hp2MissionPage} />
        <Route path="/hp-2/join" component={Hp2JoinPage} />
        <Route path="/hp-2/privacy" component={Hp2PrivacyPage} />
        <Route path="/hp-2/terms" component={Hp2TermsPage} />
        <Route path="/hp-2/login" component={DashboardPage} />
        <Route path="/hp-2/reset-password" component={ResetPasswordPage} />
        <Route path="/hp-2/invite/:token" component={InvitePage} />
        <Route path="/hp-2/dashboard" component={DashboardPage} />
        <Route
          path="/hp-2/dashboard/contributions"
          component={DashboardContributionsPage}
        />
        <Route
          path="/hp-2/dashboard/profile"
          component={DashboardProfilePage}
        />
        <Route
          path="/hp-2/dashboard/projects"
          component={DashboardProjectsPage}
        />
        <Route
          path="/hp-2/dashboard/projects/new"
          component={ProjectEditorPage}
        />
        <Route
          path="/hp-2/dashboard/projects/:id"
          component={ProjectEditorPage}
        />
        <Route path="/hp-2/admin" component={AdminPage} />
        <Route path="/hp-2/admin/waitlist" component={AdminWaitlistPage} />
        <Route path="/hp-2/admin/invites" component={AdminInvitesPage} />
        <Route path="/hp-2/admin/members" component={AdminMembersPage} />
        <Route path="/hp-2/admin/content" component={AdminContentPage} />
        <Route
          path="/hp-2/admin/content/new"
          component={AdminContentEditorPage}
        />
        <Route
          path="/hp-2/admin/content/:id"
          component={AdminContentEditorPage}
        />
        <Route
          path="/hp-2/admin/community-projects"
          component={AdminCommunityProjectsPage}
        />
        <Route
          path="/hp-2/admin/community-projects/new"
          component={AdminCommunityProjectEditorPage}
        />
        <Route
          path="/hp-2/admin/community-projects/:id"
          component={AdminCommunityProjectEditorPage}
        />
        <Route path="/hp-2" component={Hp2Page} />
        <Route path="/privacy" component={PrivacyPolicyPage} />
        <Route path="/terms" component={TermsOfServicePage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
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
        <Route path="/admin/content" component={AdminContentPage} />
        <Route path="/admin/content/new" component={AdminContentEditorPage} />
        <Route path="/admin/content/:id" component={AdminContentEditorPage} />
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
    </>
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
