# 🎬 VTube Saver

A modern full-stack video downloader built with **React**, **Node.js**, **Express**, and **Supabase PostgreSQL**. VTube Saver provides a clean interface for fetching video information, managing user accounts, enforcing download limits, and maintaining download history through a subscription-based plan system.

> **Note:** This project is developed for learning and demonstration purposes. Payment integration is intentionally **not included**. Users can switch between plans directly from the application to demonstrate plan-based download restrictions.

---

# ✨ Features

## 👤 User Authentication

* Secure user registration
* Login with JWT authentication
* Protected API routes
* User profile management

---

## 📥 Video Downloader

* Fetch video information from supported platforms
* Display thumbnail, title, duration, and available formats
* Download videos according to the user's plan limits
* Download progress tracking
* Automatic download history

---

## 💎 Subscription Plans

The application demonstrates a plan-based download restriction system.

| Plan   | Daily Download Limit |
| ------ | -------------------: |
| Free   |           1 Download |
| Bronze |          5 Downloads |
| Silver |         10 Downloads |
| Gold   |         50 Downloads |

**Important**

This project **does not include an online payment gateway**.

Plan upgrades are available through the interface for demonstration and testing purposes only. The objective of the project is to demonstrate **role-based access control and download limit management**, not payment processing.

---

# 📊 Download Management

The system automatically records every successful download.

Each download stores:

* Video title
* Platform
* Thumbnail
* Quality
* Duration
* Download date
* User information
* Selected plan

Users can view all previous downloads from the **Downloads** section inside their profile.

---

# 🔒 Download Restrictions

The backend controls all download permissions.

* Free users can download **1 video per day**
* Premium users receive higher daily download limits
* Daily limits automatically reset every day
* Users cannot bypass limits from the frontend
* All validations are performed on the server

---

# 🛠 Tech Stack

## Frontend

* React 19
* Vite
* React Router
* Axios
* CSS
* React Icons

## Backend

* Node.js
* Express.js
* JWT Authentication
* bcrypt
* Multer
* yt-dlp
* FFmpeg

## Database

* Supabase PostgreSQL

## Deployment

* Frontend → Vercel
* Backend → Render

---

# 📁 Project Structure

```text
VTube Saver
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── src
│   ├── package.json
│   └── temp
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/rajesh78145/vtube-saver.git
cd vtube-saver
```

---

## Backend

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file:

```env
PORT=5000

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

---

# 🌐 Deployment

## Backend

Deploy using **Render**.

Add all environment variables from your local `.env` file to the Render dashboard.

---

## Frontend

Deploy using **Vercel**.

Configure:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

---

# 📸 Screenshots

Add screenshots here.

* Home Page
* Login
* Register
* Profile
* Plans
* Download Page
* Download History

---

# 🎯 Learning Objectives

This project demonstrates:

* Full Stack Development
* REST API Design
* Authentication with JWT
* PostgreSQL Database Design
* User Role Management
* Download History Management
* Plan-Based Access Control
* Daily Download Limit Logic
* Frontend and Backend Deployment

---

# ⚠ Disclaimer

This project is intended for educational purposes only.

Users are responsible for complying with the terms of service and copyright policies of any third-party platform they interact with.

---

# 👨‍💻 Author

**Rajesh Kumar**

Bachelor of Computer Applications (BCA)

GitHub: https://github.com/rajesh78145
