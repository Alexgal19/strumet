# Baza - ST

**Baza - ST** is a comprehensive HR management system designed to streamline employee administration, attendance tracking, and resource planning. Built with modern web technologies, it offers a robust solution for managing the entire employee lifecycle, from hiring to termination.

## 🚀 Tech Stack

This project leverages a cutting-edge technology stack to ensure performance, scalability, and developer experience:

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Realtime Database, Storage, Authentication)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (Radix UI + Tailwind)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **AI Integration:** [Genkit](https://firebase.google.com/docs/genkit) (Google AI SDK)
*   **Protocol:** [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

*   **Node.js:** v20 or higher (Recommended)
*   **npm:** v10 or higher
*   **Firebase Account:** A project set up in the Firebase Console.

## 🛠️ Installation & Configuration

1.  **Clone the Repository**

    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Setup**

    Create a `.env.local` file in the root directory and add your Firebase configuration and other environment variables:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

    *Note: Ensure you have enabled Firestore, Authentication, and Storage in your Firebase console.*

## ▶️ How to Run

**Development Mode**

To start the development server with hot-reloading:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production Build**

To create an optimized production build:

```bash
npm run build
npm start
```

## ✨ Features

The application is modular and covers various aspects of HR management:

*   **Employees (Aktywni):** Manage current employee profiles, contracts, and personal details.
*   **Terminated (Zwolnieni):** Archive and access records of former employees.
*   **Planning (Planowanie):** Shift planning and resource allocation.
*   **Attendance (Odwiedzalność):** Track daily attendance and work hours.
*   **Clothing (Wydawanie Odzieży):** Manage workwear issuance for new and existing staff.
*   **Fingerprints (Odciski Palców):** Biometric data management for time tracking integration.
*   **Statistics (Statystyki):** Visual insights into HR metrics and workforce data.
*   **Configuration (Konfiguracja):** System settings and administrative controls.

## 📌 Project Status

**Status:** 🚧 **Active Development**

This project is currently under active development. New features and improvements are regularly deployed.
