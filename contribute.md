# Contributing to Sanghathi Frontend

Thank you for your interest in contributing to the **Frontend** of Sanghathi  
This guide explains the tech stack, features, and how you can start contributing.

---

## Technology Stack

- React (v17+)
- Material-UI (v5)
- Vite
- Redux
- Zod
- Next.js

---

## Features

1. **Authentication**  
   User authentication using JSON Web Tokens (JWT).

2. **Authorization**  
   Role-based access control for Mentor, Mentee, HoDs, and Admin.

3. **Admin Dashboard**  
   User management, mentor allocation, and reallocation.

4. **Chat**  
   Real-time communication between assigned mentors and mentees.

5. **Info Bot**  
   A chatbot trained on college datasets to assist users.

6. **Student Profile / Career Management**  
   Record-keeping for historical use cases and performance evaluation.  
   Stores both personal and semester-wise data (attendance, marks, etc.).

7. **Approval System**  
   Students submit or edit data, assigned mentors receive notifications and approve the data (2-level confirmation).

8. **Report Generation**  
   HoDs can generate reports based on various data views, such as semester-wise data, students with the highest performance, and more.

---

## How to Contribute

1. **Fork** the frontend repository:
   ```bash
 git clone https://github.com/YOUR-USERNAME/sanghathi-Frontend.git
2. ### Move into the project:
 cd sanghathi-Frontend


### 1. Fork & Clone the Repository
```bash
###
git clone https://github.com/YOUR-USERNAME/sanghathi-Frontend.git
cd sanghathi-Frontend
git remote add upstream https://github.com/Sanghathi/sanghathi-Frontend.git
### 2.Install Dependencies
 yarn install
### 3.Configure Environment Variables
 Create a .env file in the project root with the following:
 VITE_API_URL=<your_api_base_url>/api
 VITE_SOCKET_URL=ws://<your_api_base_url>
 BASE_URL=https://<your_api_base_url>
 VITE_CLOUDINARY_CLOUD_NAME=<ClOUD_NAME>
 VITE_PYTHON_API=<VITE_PYTHON_API>
### 4.Run the Development Server
 npm run dev
 App will be available at: http://localhost:3000
###  Branching & Workflow
# 1. Create a new branch for your changes:
 git checkout -b feature/your-feature-name
#2.Make changes and commit:
 git commit -m "feat: add new dashboard layout"
#3. Push your branch:
 git push origin feature/your-feature-name
#4. Open a Pull Request to main
### Before Submitting a PR
 Run the app locally and verify functionality.
 Ensure responsiveness across devices.
 Run linting/formatting (if configured)
### Keeping Your Fork Updated
 git fetch upstream
 git pull --rebase upstream main
 git push origin feature/your-feature-name
### Code Review Process
 Code readability, performance, and style will be checked.
 UI/UX consistency will be reviewed.
 Reviewers may suggest improvements before merging. 
### Code Review Process
 Code readability, performance, and style will be checked.
 UI/UX consistency will be reviewed.
 Reviewers may suggest improvements before merging. 

#Thank you for contributing to Sanghathi Frontend!