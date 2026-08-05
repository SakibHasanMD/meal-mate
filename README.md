<div align="center">

# 🍽️ MealMate

**A local-first, offline web app for managing shared meals and bazar expenses**

![GitHub license](https://img.shields.io/github/license/SakibHasanMD/MealMate)
![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.0-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.10-06b6d4?logo=tailwindcss&logoColor=white)
![Dexie.js](https://img.shields.io/badge/Dexie.js-4.0.8-ffca28?logo=javascript&logoColor=white)
![Offline First](https://img.shields.io/badge/Offline-First-success)

</div>

---

A local-first web app for managing shared **meals and bazar expenses** in a shared living space (mess, hostel, flat, etc.). 
I manage the flat I live in, already built a flutter app for it, but wanted to have a web app that works offline in my pc browser. 

Runs entirely offline in your browser — no server, no login, no account. If you're managing a similar shared mess/hostel/flat setup, feel free to use this as-is or fork it.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [How the Calculations Work](#how-the-calculations-work)
- [Data Storage](#data-storage)
- [Export](#export)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| | |
|---|---|
| 👥 **Member Management** | Add, edit, deactivate, or remove members without losing their history. |
| 📅 **Meal Chart** | Click-to-toggle daily meal entries on a month-view grid. Bulk-set a day/meal for everyone at once, exclude a member for a month, and finalize a month to lock it in. |
| 💰 **Finance Tracking** | Log bazar expenses and record each member's monthly contribution. |
| 🧮 **Automatic Calculations** | Meal rate, individual dues/credits, monthly summaries, and next month's due are all computed live — no manual math. |
| 📤 **Export** | Download a month's meal chart and financial summary as a PDF, or grab a quick screenshot of any table. |
| 📴 **Offline-First** | Everything lives in the browser via IndexedDB. No server, no internet connection required after first load. |
| 🛡️ **Error Resilient** | Wrapped in React error boundaries, so one broken component doesn't crash the whole app. |

---

## Tech Stack

| Layer       | Technology                  |
|-------------|------------------------------|
| Framework   | React 18.3.1                 |
| Build Tool  | Vite 5.4.0                   |
| Styling     | Tailwind CSS 3.4.10          |
| Database    | Dexie.js (IndexedDB) 4.0.8   |
| Routing     | React Router DOM 6.26.1      |
| Date Utils  | date-fns 3.6.0                |
| PDF Export  | jsPDF 2.5.2                  |
| Screenshot  | html2canvas 1.4.1            |

---

## Folder Structure

```
MealMate/
├── public/
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── common/             # Shared UI: Button, Modal, Table, NumberInput, ErrorBoundary
│   │   ├── finance/            # BazarExpenseList, BazarExpenseForm, MonthlySummary, NextMonthDue
│   │   ├── layout/              # Header, Sidebar, MonthSelector
│   │   ├── mealchart/           # BulkActionBar, MealChartGrid, MealChartCell
│   │   └── members/             # MemberList, MemberForm
│   ├── context/
│   │   └── AppContext.jsx      # Global state: current month + members
│   ├── db/
│   │   └── db.js                # Dexie database schema
│   ├── hooks/
│   │   ├── useMembers.js
│   │   ├── useMealChart.js
│   │   ├── useBazarExpenses.js
│   │   ├── useContributions.js
│   │   └── useMonthlySummary.js
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── MembersPage.jsx
│   │   ├── MealChartPage.jsx
│   │   └── FinancePage.jsx
│   ├── utils/
│   │   ├── calculations.js      # Meal-rate & due calculations
│   │   ├── dateHelpers.js       # Month key formatting
│   │   └── exportHelpers.js     # PDF & screenshot export
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── package-lock.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (tested with v24)
- **npm** 10+

### Installation

```bash
git clone https://github.com/SakibHasanMD/MealMate.git
cd MealMate
npm install
```

### Development

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the app in your browser.

### Build

```bash
npm run build
```
Outputs a production build to `dist/`.

---


## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes.
4. Run `npm run dev` to test locally.
5. Commit with a clear message following the existing conventions (`feat:`, `fix:`, `chore:`, `refactor:`).
6. Open a pull request describing your changes.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.