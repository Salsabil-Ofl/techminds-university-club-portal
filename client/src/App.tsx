import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import AdminLayout from "./admin/AdminLayout";
import EventsPage from "./admin/pages/Events";
import MembersPage from "./admin/pages/Members";
import MessagesPage from "./admin/pages/Messages";
import NewsPage from "./admin/pages/News";
import OverviewPage from "./admin/pages/Overview";
import RegistrationsPage from "./admin/pages/Registrations";
import UsersPage from "./admin/pages/Users";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

/** The public website is plain HTML (home.html); the React app only hosts the dashboard */
function GoHome() {
  useEffect(() => {
    window.location.replace("/home.html");
  }, []);
  return null;
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={OverviewPage} />
        <Route path="/admin/registrations" component={RegistrationsPage} />
        <Route path="/admin/events" component={EventsPage} />
        <Route path="/admin/members" component={MembersPage} />
        <Route path="/admin/news" component={NewsPage} />
        <Route path="/admin/messages" component={MessagesPage} />
        <Route path="/admin/users" component={UsersPage} />
        <Route component={OverviewPage} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GoHome} />
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/*" component={AdminRoutes} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
