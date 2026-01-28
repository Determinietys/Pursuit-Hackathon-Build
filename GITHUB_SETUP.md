# GitHub Setup Instructions

## Push to GitHub

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name it (e.g., `snowclear-marketplace`)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Add remote and push**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

3. **Set up GitHub Secrets** (for CI/CD)
   Go to Settings → Secrets and variables → Actions, and add:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `STRIPE_SECRET_KEY` - From Stripe dashboard
   - `SNYK_TOKEN` - From Snyk (optional, for security scanning)

4. **Enable GitHub Actions**
   - Actions should run automatically on push
   - Check `.github/workflows/` for CI/CD pipelines

## After Every Change

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- Feature branches: `feature/your-feature-name`

