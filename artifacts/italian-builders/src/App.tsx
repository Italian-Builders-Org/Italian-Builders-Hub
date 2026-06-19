import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import BuildersPage from "@/pages/Builders";
import ProjectsPage from "@/pages/Projects";
import OpenSourcePage from "@/pages/OpenSource";
import JoinPage from "@/pages/Join";
import { TechLabelProvider } from "@/pages/Home";
import {
  AdminCommunityProjectEditorPage,
  AdminCommunityProjectsPage,
  AdminInvitesPage,
  AdminMembersPage,
  AdminPage,
  BuilderProfilePage,
  BuildersDirectoryPage,
  CommunityProjectDetailPage,
  CommunityProjectsDirectoryPage,
  DashboardPage,
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
      <Route path="/community-projects" component={CommunityProjectsDirectoryPage} />
      <Route path="/community-projects/:slug" component={CommunityProjectDetailPage} />
      <Route path="/os-projects" component={OpenSourcePage} />
      <Route path="/invite/:token" component={InvitePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/profile" component={DashboardProfilePage} />
      <Route path="/dashboard/projects" component={DashboardProjectsPage} />
      <Route path="/dashboard/projects/new" component={ProjectEditorPage} />
      <Route path="/dashboard/projects/:id" component={ProjectEditorPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/invites" component={AdminInvitesPage} />
      <Route path="/admin/members" component={AdminMembersPage} />
      <Route path="/admin/community-projects" component={AdminCommunityProjectsPage} />
      <Route path="/admin/community-projects/new" component={AdminCommunityProjectEditorPage} />
      <Route path="/admin/community-projects/:id" component={AdminCommunityProjectEditorPage} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
