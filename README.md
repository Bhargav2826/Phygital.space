# Phygital.space - WebAR SaaS Platform

Phygital.space is a full-stack MERN platform that allows users to convert physical spaces into interactive digital AR experiences. No app download required — everything runs in the mobile browser.

## 🚀 Features

- **Admin Dashboard**: Create AR "Rooms", upload images, and attach digital content.
- **Image Target Processing**: Automatically generates `.mind` files for AR tracking.
- **Dynamic AR Overlay**: Supports Video, PDF, Image, and Info text overlays.
- **Analytics**: Track total scans, unique visitors, and target interactions.
- **Super Admin**: Global control over all admins and rooms.
- **Premium UI**: Modern dark-themed dashboard built with Tailwind CSS.

## 🛠 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Chart.js, MindAR, Three.js.
- **Backend**: Node.js, Express, MongoDB, JWT, Cloudinary.
- **Infrastructure**: MindAR CLI for target compilation.

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Cloudinary account

### 2. Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file (see `.env.example`) and fill in:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. `npm run dev`

### 3. Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 📖 Usage

1. **Register** as a new Admin.
2. **Create Room**: Give your space a name and location.
3. **Add Target**: Upload an image visitors will scan.
4. **Attach Content**: Link a video or PDF to that target.
5. **Generate Scanner**: Print the QR code for your visitors.
6. **Scan**: Visitors scan the QR, point at the image, and see the AR content!

---
Built with ❤️ for Phygital spaces.
