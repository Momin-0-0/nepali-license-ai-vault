# Welcome to your Lovable project

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME)

> **Note:** Replace `YOUR_USERNAME/YOUR_REPOSITORY_NAME` with your actual GitHub repository URL to enable one-click deployment.

## Project info

**URL**: https://lovable.dev/projects/35d0428c-7c39-48fd-9997-88fce1f6bc18

## About NepLife

NepLife is a Smart Driving License Management application designed specifically for Nepal. It features AI-powered OCR technology to digitize, manage, and share driving licenses with intelligent reminders and secure cloud storage.

### Key Features

- 🤖 **AI-Powered OCR**: Automatically extract license details from Nepal driving license images
- 🔔 **Smart Reminders**: Intelligent notification system for license expiry dates
- 🔒 **Secure Sharing**: Encrypted, time-limited links with QR codes for authorities
- 📱 **Mobile Friendly**: Responsive design with offline support
- 🛡️ **Bank-Level Security**: Enterprise-grade encryption and secure cloud storage
- ☁️ **Cloud Backup**: Automatic synchronization and data recovery

## Quick Deploy

### One-Click Deployment

Click the "Deploy to Netlify" button above for instant deployment to Netlify. This will:

1. Fork the repository to your GitHub account
2. Deploy the application to Netlify
3. Set up automatic deployments for future updates

### Manual Deployment

You can also deploy to other platforms:

- **Vercel**: Connect your GitHub repository to Vercel
- **Firebase Hosting**: Use `npm run build` and deploy the `dist` folder
- **GitHub Pages**: Enable GitHub Pages in your repository settings

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/35d0428c-7c39-48fd-9997-88fce1f6bc18) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized builds
- **OCR**: Tesseract.js for AI-powered license text extraction
- **State Management**: React Query for server state management
- **Routing**: React Router DOM for navigation
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React for beautiful icons
- **Charts**: Recharts for analytics visualization
- **QR Codes**: QRCode library for secure sharing
- **Date Handling**: date-fns for date manipulation
- **Storage**: Local storage with encryption for data persistence

## Environment Setup

The application works out of the box with no additional configuration required for basic functionality. For production deployment, ensure:

1. **Build the project**: `npm run build`
2. **Set up HTTPS**: Required for PWA features and secure storage
3. **Configure CSP**: Content Security Policy headers for enhanced security

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Open an issue on GitHub
- Visit the [Lovable Project](https://lovable.dev/projects/35d0428c-7c39-48fd-9997-88fce1f6bc18)
- Email: support@neplife.com

---

Made with ❤️ for Nepal by the NepLife Team