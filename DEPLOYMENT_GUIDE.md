# Bingo Onboarding Wizard - Deployment & Update Guide

This guide provides instructions on how to install, configure, deploy, and update the Bingo Onboarding Wizard when moving to a production online environment.

## 1. Prerequisites

Before you deploy the application, ensure you have the following ready:
- **Node.js**: Version 18.17.0 or higher.
- **Package Manager**: npm, yarn, or pnpm.
- **Supabase Account**: A Supabase project with your database schema set up.
- **Hosting Provider**: A VPS (like DigitalOcean, AWS EC2, or Hetzner), or a PaaS like Vercel or Render.
- **Domain Name** (optional but recommended): Pointing to your hosting server.

---

## 2. Environment Variables

Create a `.env.production` file (or set these variables in your hosting provider's dashboard) with the following required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 3. Deployment Options

### Option A: Deploying on Vercel (Recommended for Next.js)
1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your repository.
4. Add all the Environment Variables from Step 2 into the Vercel project settings.
5. Click **Deploy**. Vercel will automatically build and host your project.

### Option B: Deploying with Docker (Recommended if using a VPS like DigitalOcean)
The project includes a `Dockerfile` for easy containerization.
1. Make sure Docker is installed on your server.
2. Build the Docker image:
   ```bash
   docker build -t rabbt-onboarding .
   ```
3. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env.production -d rabbt-onboarding
   ```
4. Put a reverse proxy (like Nginx) in front of the container to handle SSL/HTTPS.

### Option C: Manual Deployment on a Linux Server (VPS)
1. Clone your project onto the server:
   ```bash
   git clone https://github.com/your-repo/rabbt-onboarding-wizard.git
   cd rabbt-onboarding-wizard
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Build the Next.js application:
   ```bash
   npm run build
   ```
4. Start the application using a process manager like `pm2` so it runs continuously:
   ```bash
   npm install -g pm2
   pm2 start npm --name "bingo" -- start
   ```

---

## 4. How to Update the Project

When we make code changes and you want to push those updates to your live online server, follow these steps based on your deployment method:

### If using Vercel:
Simply commit your changes and push them to your Git repository (e.g., `git push origin main`). Vercel will automatically detect the changes, build the new version, and deploy it seamlessly.

### If using Docker:
1. Pull the latest code on your server (`git pull origin main`).
2. Rebuild the Docker image:
   ```bash
   docker build -t bingo-onboarding .
   ```
3. Stop the old container, remove it, and start the new one:
   ```bash
   docker stop <container_id>
   docker rm <container_id>
   docker run -p 3000:3000 --env-file .env.production -d bingo-onboarding
   ```

### If using Manual Deployment (PM2):
1. Pull the latest code (`git pull origin main`).
2. Install any new dependencies (`npm install`).
3. Rebuild the project (`npm run build`).
4. Restart the PM2 process:
   ```bash
   pm2 restart bingo
   ```

---

## 5. Database Updates

If new database tables or columns are added during development, you will need to apply those changes to your production Supabase project:
1. Go to your Supabase Dashboard -> SQL Editor.
2. Copy any new SQL commands from the `supabase_schema.sql` file.
3. Run the commands in the SQL Editor to update your live schema.
