import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectsService } from 'src/app/admin/projects/projects.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ConfigService } from '../config.service'
import { UserService } from 'src/app/user/user.service';
import { GroupsService} from 'src/app/admin/groups/groups.service';
import { Table } from 'primeng/table';

@Component({
  selector: "app-project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.css"],
})
export class ProjectComponent implements OnInit {


  @ViewChild('dtp') table: Table;
  @ViewChild('dtu') tableuser: Table;
  new_project: any;
  projects: any;
  users: any;
  groups: any;
  selectedProject: any;
  session_user: any;
  new_user: any;
  remove_user: any;
  research_output: any;
  manager_visible: boolean;
  config: any;
  default_size: any;
  request_err_msg: string;
  request_msg: string;

  oldGroup: string;


  msg: string;
  rm_prj_err_msg: string;
  rm_prj_msg_ok: string;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private projectsService: ProjectsService,
    private userService: UserService,
    private groupService: GroupsService,
    private router: Router
  ) {
    this.config = {}
    this.default_size = 0
  }
  
  ngOnDestroy(): void {
  }

  async ngOnInit() {
    this.new_project = {};
    this.groups = [];
    this.manager_visible = true;
    this.session_user = await this.authService.profile;
    this.users = [];
    
    this.projectsService.list(false).subscribe(
      (resp) => {
        for (var i = 0; i < resp.length; i++) {
          resp[i].expire = new Date(resp[i].expire);
        }
        this.projects = resp;
      },
      (err) => console.log("failed to get projects")
    );
    console.log("ici")
  }

  ask_for_project() {
    // todo: should rename it project_msg
    if (!this.new_project.id) {
      this.request_err_msg = "Enter a title to your project";
      return;
    }
    this.request_msg = "";
    this.request_err_msg = "";
    this.projectsService
      .askNew({
        id: this.new_project.id,
        owner: this.new_project.owner,
        group: this.new_project.group,
        size: this.new_project.size,
        description: this.new_project.description,
        orga: this.new_project.orga,
      })
      .subscribe(
        (resp) => {
          this.request_msg = "An email have been sent to admin";
          this.new_project = {};
        },
        (err) => {
          console.log("failed to get project users", err);
          this.request_err_msg = err.error;
        }
      );
  }
 
  show_project_users(project) {
    this.msg = "";
    this.rm_prj_err_msg = "";
    this.rm_prj_msg_ok = "";
    let project_name = project.id;

    if (this.session_user.is_admin) {
      this.router.navigate(["/admin/project/" + project_name]);
    } else {
      this.projectsService.getUsers(project_name).subscribe(
        (resp) => {
          this.users = resp;
          this.selectedProject = project;
          this.oldGroup = project.group;
          for (let i = 0; i < resp.length; i++) {
            if (
              resp[i].group.indexOf(this.selectedProject.group) >= 0 ||
              resp[i].secondarygroups.indexOf(this.selectedProject.group) >= 0
            ) {
              this.users[i].access = true;
            }
          }
        },
        (err) => console.log("failed to get project users")
      );
    }
  }

  request_user(project, user_id, request_type) {
    this.request_msg = "";
    this.request_err_msg = "";
    if (!user_id) {
      this.request_err_msg = "User id is required";
      return;
    }
    if (request_type === "add") {
      for (var i = 0; i < this.users.length; i++) {
        if (this.users[i].uid === user_id) {
          this.request_err_msg = "User is already in project";
          return;
        }
      }
    }
    if (request_type === "remove" && this.selectedProject.owner === user_id) {
      this.request_err_msg = "You cannot remove the project owner";
      return;
    }
    this.projectsService
      .request(project.id, { request: request_type, user: user_id })
      .subscribe(
        (resp) => (this.request_msg = resp["message"]),
        (err) => (this.request_err_msg = err.error)
      );
  }

  date_convert = function timeConverter(tsp) {
    let res;
        try {
            var a = new Date(tsp);
            res = a.toISOString().substring(0, 10);
        }
        catch (e) {
            res = '';
        }
        return res;
  };


  // For dev only
  display() {
    console.log("display");
    document.getElementById("RO_div").style.display = "block";
  }
}
