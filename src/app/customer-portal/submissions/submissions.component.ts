import { Component, OnInit, ViewChild } from "@angular/core";
import { DataStore } from "app/providers/datastore";
import CustomStore from "devextreme/data/custom_store";
import { NotificationsService } from "angular2-notifications";
import { SubmissionsApi } from "app/customer-portal/submissions/submissions.api.service";
import { ProjectsApi } from "app/customer-portal/my-projects/my-projects.api.service";
import { ViewProjectApi } from "app/customer-portal/view-project/view-project.api.service";
import { CompanyOfficeApi } from "../system-settings/company-office-setup/company-office-setup.api.service";
import {
  DxDataGridComponent,
  DxToolbarComponent,
  DxSelectBoxComponent,
} from "devextreme-angular";

@Component({
  selector: "app-submissions",
  templateUrl: "./submissions.component.html",
  styleUrls: ["./submissions.component.scss"],
  providers: [SubmissionsApi, ProjectsApi, ViewProjectApi, CompanyOfficeApi],
})
export class SubmissionsComponent implements OnInit {
  @ViewChild("submissionGrid", { static: false })
  submissionGrid: DxDataGridComponent;
  @ViewChild("submissionToolbar", { static: false })
  submissionToolbar: DxToolbarComponent;
  @ViewChild("submissionToolbarViewType", { static: false })
  submissionToolbarViewType: DxSelectBoxComponent;

  @ViewChild("submissionDetailModal", { static: false }) submissionDetailModal;
  @ViewChild("transactionLogsModal", { static: false }) transactionLogsModal;
  @ViewChild("removeSubmissionModal", { static: false }) removeSubmissionModal;

  submissionViewMode = "";

  private SUBMISSION_TOOLBAR_INITIAL_VIEW =
    "BidRetriever_Project_Log_Toolbar_Initial_View";

  submissionGridColumns: any[];
  submissionGridDataSource: any;
  submissionGridContent = [];
  submissionGridContentLoaded = false;

  submissionViewTypeSelected = null;
  submissionViewTypes: any[] = [];

  toolbarConfig: any = {};

  searchWord = "";

  filterOptions: any = {};

  currentOffice = null;

  // columnDefs = [];

  rowData = null;

  refreshTimer: number;
  refreshInterval = 5;

  get isBidRetrieverAdmin() {
    const { originUserEmail } = this.dataStore;
    return (
      originUserEmail &&
      originUserEmail.toLowerCase().includes("bidretriever.net")
    );
  }

  constructor(
    public dataStore: DataStore,
    private apiService: SubmissionsApi,
    private projectsApi: ProjectsApi,
    private viewProjectApi: ViewProjectApi,
    private officeApiService: CompanyOfficeApi,
    private notificationService: NotificationsService
  ) {
    this.toolbarConfig = {
      submissionViewType: {
        width: 250,
        showClearButton: true,
        onValueChanged: (e) => {
          this.submissionViewMode = e.value;
          this.onChangeSubmissionViewMode();
        },
      },

      refreshInterval: {
        width: 100,
        options: [
          { value: 1, label: "1 min" },
          { value: 2, label: "2 min" },
          { value: 5, label: "5 min" },
          { value: 10, label: "10 min" },
          { value: 30, label: "30 min" },
          { value: 60, label: "60 min" },
          { value: 0, label: "None" },
        ],
        showClearButton: true,
        onValueChanged: (e) => {
          this.refreshInterval = e.value;
          this.onChangeRefreshInterval();
        },
      },

      search: {
        placeholder: "Search",
        width: 200,
        valueChangeEvent: "keyup",
        onValueChanged: (event) =>
          this.onSearchChange(event.value.toLowerCase()),
      },

      viewProject: {
        type: "normal",
        text: "View Project",
        onClick: () => this.onViewProject(),
      },
      viewSubmission: {
        type: "normal",
        text: "View Submission",
        onClick: () => this.onViewSubmission(),
      },

      others: {
        viewProject: {
          type: "normal",
          text: "View Project",
          onClick: () => this.onViewProject(),
        },
        viewSubmission: {
          type: "normal",
          text: "View Project Submission",
          onClick: () => this.onViewSubmission(),
        },
        viewPublishedSubmission: {
          type: "normal",
          text: "View Published Submission",
          onClick: () => this.onViewPublishedSubmission(),
        },
        downloadSubmission: {
          type: "normal",
          text: "Download Submission",
          onClick: () => this.onDownloadSubmission(),
        },
        viewSubmissionEmail: {
          type: "normal",
          text: "View Submission Email",
          onClick: () => this.onViewSubmissionEmail(),
        },
        deleteSubmission: {
          type: "normal",
          text: "Delete Submission",
          onClick: () => this.onDeleteSubmission(),
        },
        viewTransactionLog: {
          type: "normal",
          text: "View Transaction Log",
          onClick: () => this.onViewTransactionLogs(),
        },
        refreshGrid: {
          type: "normal",
          text: "Refresh Grid",
          onClick: () => this.onRefresh(),
        },
        help: {
          type: "normal",
          text: "Help",
          onClick: () => this.onHelp(),
        },
      },
    };

    this.submissionGridColumns = [
      {
        dataField: "project_name",
        caption: "Project Name",
        width: 400,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "source_sys_name",
        caption: "Source",
        width: 200,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "source_company_name",
        caption: "Source Company",
        width: 200,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "submission_name",
        caption: "Submission Name",
        width: 200,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "submission_type",
        caption: "Submission Type",
        width: 200,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "submitter_email",
        caption: "Submitter Email",
        width: 100,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "submission_date",
        caption: "Submission Date/Time",
        width: 100,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "submission_process_status",
        caption: "Processing Status",
        width: 100,
        visible: this.isBidRetrieverAdmin,
        allowEditing: false,
      },
      {
        dataField: "submission_process_message",
        caption: "Processing Message",
        width: 100,
        visible: this.isBidRetrieverAdmin,
        allowEditing: false,
      },
      {
        dataField: "submission_file_count",
        caption: "# Files",
        width: 100,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "submission_pending_file_count",
        caption: "# Files Pending",
        width: 100,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "submission_plan_count",
        caption: "# Plans",
        width: 100,
        visible: true,
        allowEditing: false,
      },
      {
        dataField: "total_processing_time",
        caption: "Total Processing Time",
        width: 100,
        visible: false,
        allowEditing: false,
      },
      {
        dataField: "submission_id",
        caption: "Submission ID",
        width: 100,
        visible: false,
        allowEditing: false,
      },
    ];

    this.submissionGridDataSource = new CustomStore({
      key: "submission_id",
      load: (loadOptions) => this.gridSubmissionLoadAction(loadOptions),
    });
  }

  gridSubmissionLoadAction(loadOptions: any) {
    return new Promise((resolve, reject) => {
      if (this.submissionGridContentLoaded) {
        const filteredSubmissions = this.getGridSubmissionContentByLoadOption(
          loadOptions
        );
        return resolve({
          data: filteredSubmissions,
          totalCount: filteredSubmissions.length,
        });
      }

      this.rowData = null;

      const params = {};
      const userTimezone = this.dataStore.currentCustomer
        ? this.dataStore.currentCustomer["customer_timezone"] || "eastern"
        : "eastern";

      if (!this.isBidRetrieverAdmin) {
        if (this.submissionViewMode === "my") {
          params["user_id"] = this.dataStore.currentUser["user_id"];
        } else if (this.submissionViewMode === "office") {
          params["office_id"] = this.dataStore.currentUser[
            "customer_office_id"
          ];
        } else if (this.submissionViewMode === "all") {
          params["customer_id"] = this.dataStore.currentUser["customer_id"];
        }
      } else {
        if (
          this.submissionViewMode === "my" ||
          this.submissionViewMode === "my-changes"
        ) {
          params["user_id"] = this.dataStore.currentUser["user_id"];
        }
      }

      this.apiService
        .getSubmissions(params, userTimezone)
        .then((submissions: any) => {
          console.log("Submissions", submissions);

          this.submissionGridContentLoaded = true;

          if (this.isBidRetrieverAdmin) {
            switch (this.submissionViewMode) {
              case "all":
              case "my":
                this.submissionGridContent = submissions as any[];
                break;
              case "changes":
              case "my-changes":
                this.submissionGridContent = submissions.filter(
                  (submission) =>
                    +submission.submission_file_count > 0 ||
                    +submission.submission_plan_count > 0
                );
                break;
              case "pending":
                this.submissionGridContent = submissions.filter(
                  (submission) =>
                    submission.submission_process_status !== "completed"
                );
                break;
              case "non-automated":
                this.submissionGridContent = submissions.filter(
                  (submission) => submission.submission_type !== "automated"
                );
                break;
            }
          } else {
            this.submissionGridContent = submissions.filter(
              ({ submission_file_count }) => Number(submission_file_count) > 0
            ) as any[];
          }

          const filteredSubmissions = this.getGridSubmissionContentByLoadOption(
            loadOptions
          );
          return resolve({
            data: filteredSubmissions,
            totalCount: filteredSubmissions.length,
          });
        })
        .catch((err) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    });
  }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.initialize();
    } else {
      this.dataStore.authenticationState.subscribe((value) => {
        if (value) {
          this.initialize();
        }
      });
    }

    this.startRefreshTimer();
  }

  initialize() {
    const isBidRetrieverAdmin = this.isBidRetrieverAdmin;

    this.submissionViewMode = isBidRetrieverAdmin ? "all" : "my";

    if (this.dataStore.currentUser["customer_office_id"]) {
      this.officeApiService
        .getOffice(this.dataStore.currentUser["customer_office_id"])
        .then((office) => {
          this.currentOffice = office;

          this.submissionViewTypes = (this.isBidRetrieverAdmin
            ? [
                // { value: "all", label: "All Submissions" },
                // { value: "open", label: "Open Submissions" },
                // { value: "queued", label: "Queued Submissions" },
                // { value: "processing", label: "Processing Submissions" },
                // { value: "errored", label: "Error Submissions" },
                // { value: "completed", label: "Completed Submissions" },
                // { value: "deleted", label: "Terminated Submissions" },
                { value: "all", label: "All Submissions" },
                { value: "changes", label: "All Submissions with Changes" },
                { value: "pending", label: "All Pending Submissions" },
                {
                  value: "non-automated",
                  label: "All non-Automated Submissions",
                },
                { value: "my", label: "All My Projects" },
                { value: "my-changes", label: "All My Projects With Changes" },
              ]
            : [
                {
                  value: "my",
                  label: "My Projects",
                },
                this.currentOffice && {
                  value: "office",
                  label: `My ${this.currentOffice.company_office_name} Projects`,
                },
                {
                  value: "all",
                  label: "All Projects",
                },
              ]
          ).filter((v) => !!v);
        })
        .catch((err) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    }
  }

  startRefreshTimer() {
    this.refreshTimer = window.setInterval(() => {
      this.onRefresh();
    }, this.refreshInterval * 60 * 1000);
  }

  onDestroy() {
    window.clearInterval(this.refreshTimer);
  }

  /* Switch refresh interval */
  onChangeRefreshInterval() {
    window.clearInterval(this.refreshTimer);

    if (this.refreshInterval > 0) {
      this.startRefreshTimer();
    }
  }

  /* Switch Submission View Mode */
  onChangeSubmissionViewMode() {
    if (this.submissionViewTypeSelected !== this.submissionViewMode) {
      this.submissionViewTypeSelected = this.submissionViewMode;
      localStorage.setItem(
        this.SUBMISSION_TOOLBAR_INITIAL_VIEW,
        this.submissionViewTypeSelected == null
          ? ""
          : this.submissionViewTypeSelected
      );
      this.toolbarRefreshGridAction();
    }
  }

  toolbarRefreshGridAction() {
    this.submissionGridContentLoaded = false;
    if (this.submissionGrid && this.submissionGrid.instance) {
      this.submissionGrid.instance.refresh();
    }
  }

  /* View project */
  onViewProject() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "The system can only view one submission. Please select a single submission.",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.submissionGridContent.filter(
      ({ submission_id: sId }) => selectedRowKeys.includes(sId)
    );
    window.open(
      `/customer-portal/view-project/${selectedRows[0]["project_id"]}`,
      "_blank"
    );
  }

  /* View Submission */
  onViewSubmission() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "The system can only view one submission. Please select a single submission.",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.submissionGridContent.filter(
      ({ submission_id: sId }) => selectedRowKeys.includes(sId)
    );
    this.viewProjectApi
      .getProject(selectedRows[0]["project_id"], "")
      .then((project) => {
        this.submissionDetailModal.initialize(project, selectedRows[0], false);
      })
      .catch((err) => {
        this.notificationService.error(
          "Error",
          "Failed to retrieve project info.",
          { timeOut: 3000, showProgressBar: false }
        );
      });
  }

  /* View published submission */
  onViewPublishedSubmission() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.submissionGridContent.filter(
      ({ submission_id: sId }) => selectedRowKeys.includes(sId)
    );
    this.projectsApi
      .getPublishedLink(
        selectedRows[0]["project_id"],
        selectedRows[0]["submission_id"]
      )
      .then((url: string) => {
        window.open(url, "_blank");
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  /* Download submission (source files) */
  onDownloadSubmission() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.submissionGridContent.filter(
      ({ submission_id: sId }) => selectedRowKeys.includes(sId)
    );
    this.projectsApi
      .getPublishedLink(
        selectedRows[0]["project_id"],
        selectedRows[0]["submission_id"]
      )
      .then((url: string) => {
        const downloadUrl = url.replace("dl=0", "dl=1");
        window.open(downloadUrl, "_blank");
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  /* View submission email  */
  onViewSubmissionEmail() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.submissionGridContent.filter(
      ({ submission_id: sId }) => selectedRowKeys.includes(sId)
    );
    const bucketName = selectedRows[0]["submission_email_file_bucket"];
    const fileKey = selectedRows[0]["submission_email_file_key"];

    if (bucketName && fileKey) {
      window.open(
        `/email-viewer?bucket_name=${bucketName}&file_key=${fileKey}`,
        "_blank"
      );
    } else {
      this.notificationService.error("Not Found", "Email file not found.", {
        timeOut: 3000,
        showProgressBar: false,
      });
    }
  }

  /* Delete submission */
  onDeleteSubmission() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.submissionGridContent.filter(
      ({ submission_id: sId }) => selectedRowKeys.includes(sId)
    );
    this.removeSubmissionModal.initialize(selectedRows[0]);
  }

  /* View transaction log */
  onViewTransactionLogs() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one submission!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "The system can only rename one submission. Please select a single submission.",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.submissionGridContent.filter(
      ({ submission_id: sId }) => selectedRowKeys.includes(sId)
    );
    this.viewProjectApi
      .getProject(selectedRows[0]["project_id"], "")
      .then((project) => {
        this.transactionLogsModal.initialize(project, selectedRows[0]);
      })
      .catch((err) => {
        this.notificationService.error(
          "Error",
          "Failed to retrieve project info.",
          { timeOut: 3000, showProgressBar: false }
        );
      });
  }

  /* Refresh Page */
  onRefresh() {
    this.submissionGridContentLoaded = false;
    this.submissionGrid.instance.refresh();
  }

  /* Help */
  onHelp() {}

  /**
   * Table Event: Row double clicked
   * @param event
   */
  onRowDoubleClicked(event: any) {
    const { selectedRowKeys } = this.submissionGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.submissionGridContent.filter(
      ({ project_id: projectId }) => selectedRowKeys.includes(projectId)
    );
    window.open(
      `/customer-portal/view-project/${selectedRows[0].project_id}/overview`,
      "_blank"
    );
  }

  getGridSubmissionContentByLoadOption(loadOptions: any) {
    let items = this.submissionGridContent;

    if (this.searchWord) {
      items = items.filter((p) => {
        const isMatched = Object.keys(p)
          .map((key) => p[key])
          .some((item) =>
            item.toString().toLowerCase().includes(this.searchWord)
          );
        return isMatched;
      });
    }
    return items;
  }

  /* Table Event: Grid Ready */
  onGridReady(event: any) {
    const defaultSortModel = [{ colId: "submission_date", sort: "desc" }];
    event.api.setSortModel(defaultSortModel);
    event.api.sizeColumnsToFit();
  }

  addSubmissionGridMenuItems(e: any) {
    if (!e.row) {
      return;
    }

    if (!e.row.data.project_bid_datetime) {
      e.row.data.project_bid_datetime = null;
    }

    e.component.selectRows([e.row.data.submission_id]);

    if (e.row && e.row.rowType === "data") {
      // e.items can be undefined
      if (!e.items) {
        e.items = [];
      }

      e.items.push(
        {
          type: "normal",
          text: "View Project",
          onClick: () => this.onViewProject(),
        },
        {
          type: "normal",
          text: "View Project Submission",
          onClick: () => this.onViewSubmission(),
        },
        {
          type: "normal",
          text: "View Published Submission",
          onClick: () => this.onViewPublishedSubmission(),
        },
        {
          type: "normal",

          text: "Download Submission",
          onClick: () => this.onDownloadSubmission(),
        },

        {
          type: "normal",

          text: "View Submission Email",
          onClick: () => this.onViewSubmissionEmail(),
        },
        {
          type: "normal",
          visible: this.isBidRetrieverAdmin,
          text: "Delete Submission",
          onClick: () => this.onDeleteSubmission(),
        },
        {
          type: "normal",
          text: "View Transaction Log",
          onClick: () => this.onViewTransactionLogs(),
        },
        {
          type: "normal",
          text: "Refresh Grid",
          onClick: () => this.onRefresh(),
        },
        {
          type: "normal",
          text: "Help",
          onClick: () => this.onHelp(),
        }
      );
    }
    return e;
  }

  onSearchChange(searchText: string) {
    this.searchWord = searchText;
    if (this.submissionGrid && this.submissionGrid.instance) {
      this.submissionGrid.instance.refresh();
    }
  }
}
