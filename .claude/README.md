
# Baza - ST - Project Documentation

## 1. General Project Description

**Baza - ST** is an advanced CRM (Customer Relationship Management) web application designed specifically for comprehensive personnel and HR process management. The system is built on a modern technology stack, with an emphasis on performance, responsiveness, and an intuitive user interface.

## 2. Technology Stack

- **Framework:** **Next.js (App Router)** - Guarantees fast server-side and client-side rendering, SEO optimization, and a modern architecture.
- **Language:** **TypeScript** - Provides type safety, which translates to fewer bugs and easier code maintenance.
- **UI Components:** **shadcn/ui** - A library of ready-to-use, fully stylable, and accessible components that accelerates interface development.
- **Styling:** **Tailwind CSS v4** - A modern, utility-first approach to styling that allows for rapid and consistent design creation directly in the code.
- **Backend and Database:** **Firebase**
  - **Realtime Database:** A NoSQL database that operates in real-time, ideal for dynamic applications where changes must be visible instantly.
  - **Firebase Authentication:** A complete system for managing user authentication (email/password).
  - **Firebase Storage:** Used for file storage, such as Excel archives.
- **Artificial Intelligence:** **Genkit (by Google)** - An integrated AI framework for automating tasks like generating summaries, creating avatars, or proactive notifications.
- **State Management:** **React Context API** (`AppContext`) - Centralized management of the application state (employee data, configuration, loading state), ensuring data consistency across all components.
- **Forms:** **React Hook Form** - Efficient and flexible management of forms and their validation.
- **Charts and Visualizations:** **Recharts** - A library for creating interactive charts and diagrams.

## 3. Architecture and Key Concepts

### 3.1. Design System

The application utilizes a consistent visual system in the **"Light & Airy Ultra-Modern"** style:
- **Color Palette:** Light backgrounds (`slate-50`), clean white cards, and subdued, professional accents (blue, coral).
- **Glassmorphism:** A "frosted glass" effect (`backdrop-blur`) applied to side panels and headers, adding depth and modernity.
- **Shadows and Interactivity:** Subtle, diffused shadows that appear on interaction (e.g., `hover` on buttons), giving the impression of elements "floating."
- **Typography:** Dark gray text instead of black to reduce eye strain.

### 3.2. Responsive Design

The application is fully responsive thanks to a combination of several techniques:
- **Tailwind CSS Breakpoints:** Use of `sm:`, `md:`, `lg:` prefixes for dynamic layout adjustments.
- **`useIsMobile` Hook:** A custom hook that allows for rendering entirely different components depending on the screen size (e.g., `AppSidebar` on desktop vs. `AppBottomNav` on mobile).
- **List Virtualization:** Long lists (e.g., employees) are virtualized (`@tanstack/react-virtual`), meaning only visible elements are rendered. This ensures lightning-fast performance even with thousands of records.

### 3.3. State Management (`AppContext`)

The heart of the application is `AppContext`, which serves as a central repository for data and business logic.
- **Provides data:** It supplies all components with up-to-date information about employees, configuration, absences, etc.
- **Centralizes logic:** It contains functions for data modification (e.g., `handleSaveEmployee`, `addAbsence`), ensuring that business logic is in one place and easy to manage.
- **Manages loading and authentication state:** It controls the data loading state and information about the logged-in user and their permissions (`isAdmin`).

## 4. Module Functionality Analysis

### `aktywni` / `zwolnieni` (Employees)
- **Logic:** Full CRUD (Create, Read, Update, Delete) operations on employee data. The `aktywny` (active) or `zwolniony` (terminated) status determines list membership. Restoring an employee (`handleRestoreEmployee`) changes the status and removes the termination date.
- **Filtering:** Advanced, multi-criteria filtering is done client-side (`useMemo`), ensuring an instantaneous interface response. Hierarchical date filters allow for precise result narrowing.
- **Import/Export:** Utilizes the `xlsx` library to parse and generate Excel files. These functions are isolated in separate components (`ExcelImportButton`, `ExcelExportButton`).

### `planowanie` (Planning)
- **Logic:** This module is entirely based on filtering and sorting existing employee data. It uses `date-fns` to check if an employee is currently on vacation (`isWithinInterval`) or if their planned termination date is in the future.

### `odwiedzalnosc` (Attendance)
- **Logic:** An interactive calendar where each day cell is a button. Clicking it triggers the `handleToggleAbsence` function, which adds or removes an entry in the `absences` table in Firebase.
- **Statistics:** Calculations (e.g., absence percentage) are performed in real-time (`useMemo`) based on current data on absences, employees, and the number of working days in the month.

### `statystyki` (Statistics)
- **Charts:** The module uses the `Recharts` library to create interactive pie charts. Clicking on a chart slice opens a dialog window with a detailed list of employees.
- **Hierarchy:** The dialog for departments presents data in the form of nested accordions (Department -> Manager -> Job Title), which simplifies structure analysis.
- **Historical Analysis:** The "Analysis" tab allows generating comparative reports between two dates or for a single specific day, using the `createStatsSnapshot` Genkit flow.

### `wydawanie-odziezy` (Clothing Issuance)
- **Logic:** Creation of an "issuance record" by linking an employee with a list of selected clothing items. Each record is saved as a separate object in Firebase. The default clothing set is retrieved from the configuration based on the employee's job title.
- **Printing:** The generated document is rendered in a special, hidden container (`print-only`) and styled with `@media print`, ensuring a perfect fit for A4 format.

### `konfiguracja` (Configuration)
- **Logic:** This module allows managing lists (departments, job titles, managers, etc.) that are stored in `config` in Firebase.
- **"Smart" Editing:** Changing the name of an item (e.g., a department) automatically updates that name in all employee objects that were assigned the old value. This is handled by `updateConfigItem`, which iterates through employees and creates a bulk update.

### `AI / Genkit`
- **Flows:** AI functions are defined as `flows` in the `src/ai/flows` directory. Each flow is a separate server function (`'use server'`).
- **Daily Tasks:** `run-daily-checks` is the main flow, run cyclically (cron), which triggers sub-flows to check contracts, deadlines, etc., and sends notifications (in-app and via email with Resend).
- **Content Generation:** `generate-employee-summary` and `generate-avatar` are examples of using generative models to enrich data.

## 5. Summary

"Baza - ST" is a well-designed, modern application that effectively utilizes its technology stack. The architecture, based on components, centralized state management, and modular AI functions, makes the system flexible, scalable, and easy to develop further.
