# Apna School Kindergarten Website (MERN)

This is a complete MERN stack application for **Apna School** built with a child-friendly, modern responsive visual layout, incorporating parent portals, teacher classroom loggers, and school administration dashboards.

---

## 🧸 Core Features Built

1. **Public Landing Pages**:
   - **Home**: Bouncy headers, why choose us highlights, infant/preschool program guides, parent testimonials.
   - **About Us**: principal message, vision, values, teacher profiles.
   - **Admissions**: Step-by-step application form & status tracking by code.
   - **Programs & Facilities**: Timelines schedules, smart lab showcases.
   - **School Calendar**: holidays, examinations, PTM meets list.
   - **Gallery**: Category filtering (classrooms, celebrations).
   - **Fees**: Sandbox tuition payment gateway simulator.
   - **Contact**: Query forms & instant WhatsApp support link.
2. **Secure User Portals**:
   - **Parent Portal**: Child progress reports, daily activity cards (art/meals/nap), attendance calendar, fee dues clearances.
   - **Teacher Portal**: Class roster list, daily logs poster, attendance logs, report card marks publisher.
   - **Admin Portal**: Stats graphs, query resolution check, bulletins notice board, admission clearance reviews.
3. **PWA Enabled**: Service workers caching and installable manifest cards support.

---

## 🚀 How to Run Locally

### 1. Start Express Backend API
```bash
cd backend
npm start
```
*Note: The backend is programmed to check if MongoDB is active. If offline, it automatically falls back to an **in-memory mock store** so that all dashboard actions remain interactive out of the box!*

### 2. Start Vite React Frontend
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🔑 Evaluation Testing Logins

Seeded credentials for immediate testing:
- **School Admin Dashboard**:
  - Email: `admin@apnaschool.edu`
  - Password: `admin123`
- **Parent Portal Dashboard**:
  - Email: `parent@apnaschool.edu`
  - Password: `parent123`
- **Teacher Portal Dashboard**:
  - Email: `teacher@apnaschool.edu`
  - Password: `teacher123`

---

## ☁️ Deployment Guides
Review [walkthrough.md](file:///C:/Users/brayw/.gemini/antigravity/brain/fef377a8-6d36-4040-9913-297fa64cee20/walkthrough.md) for step-by-step setup guides for Render and MongoDB Atlas cluster provisioning.
