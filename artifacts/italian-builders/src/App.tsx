import { Switch, Route, Router as WouterRouter } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { RouteSeo } from "@/lib/seo";
import NotFound from "@/pages/not-found";
import Hp2Page from "@/pages/Hp2";
import {
  Hp2BuilderProfilePage,
  Hp2BuildersPage,
  Hp2CommunityProjectDetailPage,
  Hp2CommunityProjectsPage,
  Hp2JoinPage,
  Hp2MissionPage,
  Hp2OpenSourcePage,
  Hp2PantheonPage,
  Hp2PrivacyPage,
  Hp2ProjectDetailPage,
  Hp2ProjectsPage,
  Hp2TermsPage,
} from "@/pages/Hp2Subpages";
import { TechLabelProvider } from "@/lib/label-mode";
import {
  AdminCommunityProjectEditorPage,
  AdminCommunityProjectsPage,
  AdminContentEditorPage,
  AdminContentPage,
  AdminInvitesPage,
  AdminMembersPage,
  AdminPage,
  AdminWaitlistPage,
  CommunityContentPage,
  DashboardPage,
  DashboardContributionsPage,
  DashboardDigestsPage,
  DashboardProfilePage,
  DashboardProjectsPage,
  InvitePage,
  LoginCodePage,
  ProjectEditorPage,
  ResetPasswordPage,
} from "@/pages/Platform";

const queryClient = new QueryClient();

function ArchivedV2PreviewRedirect() {
  const target = `${window.location.pathname.replace(/^\/hp-2(?=\/|$)/, "") || "/"}${window.location.search}${window.location.hash}`;
  useEffect(() => {
    window.location.replace(target);
  }, [target]);
  return null;
}

function Router() {
  return (
    <>
      <RouteSeo />
      <Switch>
        <Route path="/" component={Hp2Page} />
        <Route path="/builders" component={Hp2BuildersPage} />
        <Route path="/builders/:username" component={Hp2BuilderProfilePage} />
        <Route path="/projects" component={Hp2ProjectsPage} />
        <Route path="/projects/:slug" component={Hp2ProjectDetailPage} />
        <Route
          path="/community-projects"
          component={Hp2CommunityProjectsPage}
        />
        <Route
          path="/community-projects/:slug"
          component={Hp2CommunityProjectDetailPage}
        />
        <Route path="/content" component={CommunityContentPage} />
        <Route path="/os-projects" component={Hp2OpenSourcePage} />
        <Route path="/pantheon" component={Hp2PantheonPage} />
        <Route path="/mission" component={Hp2MissionPage} />
        <Route path="/join" component={Hp2JoinPage} />
        <Route path="/privacy" component={Hp2PrivacyPage} />
        <Route path="/terms" component={Hp2TermsPage} />
        <Route path="/login" component={DashboardPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/login-code" component={LoginCodePage} />
        <Route path="/invite/:token" component={InvitePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route
          path="/dashboard/contributions"
          component={DashboardContributionsPage}
        />
        <Route path="/dashboard/digests" component={DashboardDigestsPage} />
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
        <Route path="/hp-2/*" component={ArchivedV2PreviewRedirect} />
        <Route path="/hp-2" component={ArchivedV2PreviewRedirect} />
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
