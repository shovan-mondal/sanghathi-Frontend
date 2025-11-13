# Contributing to Sanghathi Frontend

Thank you for your interest in contributing to the **Sanghathi Frontend** project!  
This guide will help you set up your local environment, follow the contribution workflow, and submit your changes effectively.

---

## Tech Stack

The frontend is built using the following technologies:

- **React (v17+)** – Frontend JavaScript library for building UI.  
- **Material-UI (v5)** – Component library for fast and responsive design.  
- **Vite** – Lightning-fast build tool for modern web projects.  
- **Redux** – For global state management.  
- **Zod** – For schema validation and form data validation.  
- **Next.js** – For optimized routing and performance (if integrated).

---

## Features

1. **Authentication**  
   Secure user authentication using **JWT tokens**.

2. **Authorization**  
   Role-based access control for **Mentors**, **Mentees**, **HoDs**, and **Admins**.

3. **Admin Dashboard**  
   Manage users, assign mentors, and handle reallocation tasks.

4. **Chat**  
   Real-time messaging between mentors and mentees.

5. **Info Bot**  
   AI-powered chatbot trained on institutional data to assist users.

6. **Student Profile / Career Management**  
   Manage historical academic data, attendance, and performance analytics.

7. **Approval System**  
   Two-level approval workflow for student data edits and submissions.

8. **Report Generation**  
   Generate insights and reports on academic performance, attendance, and more.

---

## Setup Instructions

### 1. Fork and Clone the Repository

Fork the repository to your GitHub account and clone it locally:

```bash
git clone https://github.com/YOUR-USERNAME/Sanghathi-Frontend.git
cd Sanghathi-Frontend
Then, add the upstream remote to stay synced with the main project:
bash
Copy code
git remote add upstream https://github.com/Sanghathi/Sanghathi-Frontend.git
###2. Install Dependencies
Install all required packages using Yarn:
bash
Copy code
yarn install
###3. Configure Environment Variables
Create a .env file in the root directory and configure the following variables:
env
Copy code
VITE_API_URL=<your_api_base_url>/api
VITE_SOCKET_URL=ws://<your_api_base_url>
BASE_URL=https://<your_api_base_url>
VITE_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
VITE_PYTHON_API=<your_python_api_url>
###4. Run the Development Server
Start the development server:
bash
Copy code
npm run dev
The app will now be available at:
👉 http://localhost:3000
Branching and Workflow
Follow this Git workflow to contribute effectively:
###1. Create a New Branch
bash
Copy code
git checkout -b feature/your-feature-name
Examples:
feature/dashboard-ui
bugfix/login-validation
docs/update-readme
###2. Make Your Changes
Implement your new feature, bug fix, or UI enhancement.
###3. Commit Your Changes
Use meaningful and descriptive commit messages:
bash
Copy code
git commit -m "feat: add new dashboard layout"
###4. Push Your Branch
bash
Copy code
git push origin feature/your-feature-name
###5. Open a Pull Request (PR)
Go to your GitHub repository.
Click “Compare & pull request”.
Submit your PR to the main branch.
Before Submitting a Pull Request
Please ensure that:
The app runs locally without any errors.
UI is responsive across all screen sizes.
Linting and formatting checks are passed (if configured).
All new components follow consistent design standards.
Unused imports, console logs, or warnings are removed.
Keeping Your Fork Updated
Stay updated with the latest changes from the main repository:
bash
Copy code
git fetch upstream
git pull --rebase upstream main
git push --force origin feature/your-feature-name
Code Review Process
During the review process, maintainers will verify:
Code readability and structure.
UI/UX consistency and performance.
Proper state management using Redux.
Reusability and component modularity.
Once approved, your PR will be merged into the main branch. 
Thank You 
Your contributions make Sanghathi stronger and better for everyone.
We truly appreciate your effort, ideas, and collaboration!