import { ModuleWithProviders } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { CustomerPortalComponent } from "app/customer-portal/customer-portal.component";
import { AuthenticationGuard } from "app/providers/auth.guard";
import { MyProjectsComponent } from "app/customer-portal/my-projects/my-projects.component";
import { MyCompaniesComponent } from "app/customer-portal/my-companies/my-companies.component";
import { SystemAnalyticsComponent } from "app/customer-portal/system-analytics/system-analytics.component";
import { NotificationViewerComponent } from "app/customer-portal/notification-viewer/notification-viewer.component";
import { SubmissionsComponent } from "app/customer-portal/submissions/submissions.component";

import { MyCalendarComponent } from "./my-calendar/my-calendar.component";
import { SharedProjectsComponent } from "./shared-projects/shared-projects.component";
import { MySettingsModule } from "./my-settings/my-settings.module";
const routes: Routes = [
  {
    path: "",
    component: CustomerPortalComponent,
    canActivate: [AuthenticationGuard],
    children: [
      {
        path: "my-projects",
        component: MyProjectsComponent,
      },
      {
        path: "my-companies",
        component: MyCompaniesComponent,
      },
      {
        path: "shared-projects",
        component: SharedProjectsComponent,
      },
      {
        path: "my-calendar",
        component: MyCalendarComponent,
      },
      {
        path: "my-settings",
        loadChildren: () =>
        import("./my-settings/my-settings.module").then(
          (m) => m.MySettingsModule
        ),
        
      },
      {
        path: "system-settings",
        loadChildren: () =>
          import("./system-settings/system-settings.module").then(
            (m) => m.SystemSettingsModule
          ),
      },
      {
        path: "all-submissions",
        component: SubmissionsComponent,
      },
      {
        path: "system-analytics",
        component: SystemAnalyticsComponent,
      },
      {
        path: "view-project/:project_id",
        loadChildren: () =>
          import("./view-project/view-project.module").then(
            (m) => m.ViewProjectModule
          ),
      },
      {
        path: "view-employee/:contact_id",
        loadChildren: () =>
          import("./view-employee/view-employee.module").then(
            (m) => m.ViewEmployeeModule
          ),
      },
      {
        path: "view-company/:company_id",
        loadChildren: () =>
          import("./view-company/view-company.module").then(
            (m) => m.ViewCompanyModule
          ),
      },
      {
        path: "notification-viewer",
        component: NotificationViewerComponent,
      },
      {
        path: "",
        redirectTo: "my-projects",
      },
    ],
  },
];
export const customerPortalRouting: ModuleWithProviders = RouterModule.forChild(
  routes
);
