# StoryCare - Digital Therapeutic Platform

> **Built on**: Production-Ready Next.js 16+ Boilerplate with Enterprise Stack

<p align="center">
  <a href="https://demo.nextjs-boilerplate.com">
    <img
      src="public/assets/images/nextjs-starter-banner.png?raw=true"
      alt="Next js starter banner"
      style="max-width: 100%; height: auto;"
    />
  </a>
</p>

## 📚 Quick Links

**New to this project?** Start here:

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Get up and running in 30 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup for all services (Firebase, Deepgram, OpenAI, etc.)
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detailed Firebase Authentication setup
- **[DATABASE_GUIDE.md](./DATABASE_GUIDE.md)** - Database schema, migrations, and Drizzle ORM
- **[CLAUDE.md](./CLAUDE.md)** - Full project architecture and development guidelines

---

## About StoryCare

**StoryCare** is a digital therapeutic platform that uses narrative therapy to help patients visualize and reframe their stories through AI-generated media. It's a clinician-guided system built on a production-ready Next.js 16+ stack.

### Core Features

- 🎙️ **Session Management**: Upload therapy session audio, transcribe with Deepgram
- 👥 **Speaker Diarization**: Automatically identify and label speakers
- 🤖 **AI-Powered Analysis**: GPT-4 assistant for therapeutic insights
- 🎨 **Media Generation**: Create images (DALL-E), videos, and scenes
- 📖 **Story Pages**: Build interactive patient-facing content
- 📊 **Dashboard**: Track patient engagement and therapeutic outcomes

### Key Principle

> "We live our lives through stories. These narratives shape identity, behavior, and possibility."

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up Firebase and environment variables
# See GETTING_STARTED.md for detailed instructions
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# 3. Run database migrations
npm run db:migrate

# 4. Start development server
npm run dev:simple
```

Open [http://localhost:3000](http://localhost:3000) ✨

---

## Tech Stack

🚀 Enterprise-grade Next.js boilerplate with App Router, Tailwind CSS, and TypeScript ⚡️ Built for scalability with production-ready infrastructure:

### Core Technologies
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Database**: DrizzleORM + Neon PostgreSQL (PGlite for local dev)

### Authentication & Storage
- **Auth**: Firebase Authentication (Google Identity Platform)
- **Storage**: Google Cloud Storage
- **Hosting**: Vercel Enterprise

### AI Services
- **Transcription**: Deepgram (speech-to-text, speaker diarization)
- **AI Models**: OpenAI (GPT-4, DALL-E)

### Monitoring & Security
- **Error Tracking**: [Sentry](https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo)
- **Logging**: LogTape + [Better Stack](https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)
- **Analytics**: PostHog
- **Security**: [Arcjet](https://launch.arcjet.com/Q6eLbRE) (WAF, rate limiting, bot protection)
- **Monitoring**: [Checkly](https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)

### Developer Experience
- **Testing**: Vitest, Playwright, Storybook
- **Code Quality**: ESLint, Prettier, Lefthook
- **AI Code Reviews**: [CodeRabbit](https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025)
- **i18n**: next-intl with Crowdin integration

---

## Sponsors

<table width="100%">
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://clerk.com?utm_source=github&utm_medium=sponsorship&utm_campaign=nextjs-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ixartz/SaaS-Boilerplate/assets/1328388/6fb61971-3bf1-4580-98a0-10bd3f1040a2">
          <source media="(prefers-color-scheme: light)" srcset="https://github.com/ixartz/SaaS-Boilerplate/assets/1328388/f80a8bb5-66da-4772-ad36-5fabc5b02c60">
          <img alt="Clerk – Authentication & User Management for Next.js" src="https://github.com/ixartz/SaaS-Boilerplate/assets/1328388/f80a8bb5-66da-4772-ad36-5fabc5b02c60">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/coderabbit-logo-dark.svg?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/coderabbit-logo-light.svg?raw=true">
          <img alt="CodeRabbit" src="public/assets/images/coderabbit-logo-light.svg?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/sentry-white.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/sentry-dark.png?raw=true">
          <img alt="Sentry" src="public/assets/images/sentry-dark.png?raw=true">
        </picture>
      </a>
      <a href="https://about.codecov.io/codecov-free-trial/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/codecov-white.svg?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/codecov-dark.svg?raw=true">
          <img alt="Codecov" src="public/assets/images/codecov-dark.svg?raw=true">
        </picture>
      </a>
    </td>
  </tr>
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://launch.arcjet.com/Q6eLbRE">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/arcjet-dark.svg?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/arcjet-light.svg?raw=true">
          <img alt="Arcjet" src="public/assets/images/arcjet-light.svg?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://sevalla.com/">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/sevalla-dark.png">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/sevalla-light.png">
          <img alt="Sevalla" src="public/assets/images/sevalla-light.png">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://l.crowdin.com/next-js">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/crowdin-white.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/crowdin-dark.png?raw=true">
          <img alt="Crowdin" src="public/assets/images/crowdin-dark.png?raw=true">
        </picture>
      </a>
    </td>
  </tr>
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/better-stack-white.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/better-stack-dark.png?raw=true">
          <img alt="Better Stack" src="public/assets/images/better-stack-dark.png?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://posthog.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://posthog.com/brand/posthog-logo-white.svg">
          <source media="(prefers-color-scheme: light)" srcset="https://posthog.com/brand/posthog-logo.svg">
          <img alt="PostHog" src="https://posthog.com/brand/posthog-logo.svg">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://www.nutrient.io/guides/web/nextjs/?utm_source=nextjs-boilerplate&utm_medium=referral">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/nutrient-dark.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/nutrient-light.png?raw=true">
          <img alt="Nutrient" src="public/assets/images/nutrient-light.png?raw=true">
        </picture>
      </a>
    </td>
  </tr>
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/checkly-logo-dark.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/checkly-logo-light.png?raw=true">
          <img alt="Checkly" src="public/assets/images/checkly-logo-light.png?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" style=width="33%">
      <a href="https://nextjs-boilerplate.com/pro-saas-starter-kit">
        <img src="public/assets/images/nextjs-boilerplate-saas.png?raw=true" alt="Next.js SaaS Boilerplate with React" />
      </a>
    </td>
    <td align="center" width="33%">
      <a href="mailto:contact@creativedesignsguru.com">
        Add your logo here
      </a>
    </td>
  </tr>
</table>

### Demo

**Live demo: [Next.js Boilerplate](https://demo.nextjs-boilerplate.com)**

| Sign Up | Sign In |
| --- | --- |
| [![Next.js Boilerplate SaaS Sign Up](public/assets/images/nextjs-boilerplate-sign-in.png)](https://demo.nextjs-boilerplate.com/sign-up) | [![Next.js Boilerplate SaaS Sign In](public/assets/images/nextjs-boilerplate-sign-in.png)](https://demo.nextjs-boilerplate.com/sign-in) |

### Tech Stack

**Infrastructure & Hosting**
- **Hosting**: [Vercel](https://vercel.com) (Enterprise Plan) - Automatic deployments, edge functions, CDN
- **Database**: [Neon](https://neon.tech) (Serverless PostgreSQL) - Autoscaling, branching, connection pooling
- **Storage**: [Google Cloud Storage](https://cloud.google.com/storage) - File uploads, media assets, blob storage
- **Local Development**: PGlite (in-memory/file-based PostgreSQL)

**Authentication & Security**
- **Auth**: [Firebase Authentication](https://firebase.google.com/docs/auth) (Google Identity Platform)
  - Social OAuth (Google, Facebook, Twitter, GitHub, Apple)
  - Email/Password, Magic Links, Phone Auth
  - Multi-Factor Authentication (MFA)
  - User management and admin SDK
  - Note: Most complex component to set up - see [essential user management features](https://clerk.com/articles/essential-user-management-features-startups)
- **Security**: [Arcjet](https://launch.arcjet.com/Q6eLbRE) - Bot detection, rate limiting, WAF protection

**AI & Machine Learning**
- **Speech-to-Text**: [Deepgram](https://deepgram.com) - Real-time transcription, pre-recorded audio processing
- **AI Models**: [OpenAI](https://openai.com) - GPT-4, GPT-3.5-turbo, and other models as needed
- **Flexibility**: Architecture supports swapping in alternative AI providers

**Monitoring & Observability**
- **Error Tracking**: [Sentry](https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo) with Spotlight for local dev
- **Logging**: LogTape + [Better Stack](https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)
- **Analytics**: [PostHog](https://posthog.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)
- **Uptime Monitoring**: [Checkly](https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)
- **Code Coverage**: [Codecov](https://about.codecov.io/codecov-free-trial/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo)

**Development Tools**
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **ORM**: DrizzleORM (type-safe SQL)
- **Testing**: Vitest, Playwright, Storybook
- **Code Quality**: ESLint, Prettier, Commitlint

**Scaling Targets**
- Designed to scale from 1k to 100k+ users
- Cost optimization strategies included
- Database connection pooling
- Edge caching and CDN distribution
- Rate limiting and security built-in

### Features

Developer experience first, extremely flexible code structure and only keep what you need:

- ⚡ [Next.js](https://nextjs.org) with App Router support
- 🔥 Type checking [TypeScript](https://www.typescriptlang.org)
- 💎 Integrate with [Tailwind CSS](https://tailwindcss.com)
- ✅ Strict Mode for TypeScript and React 19
- 🔒 Authentication with [Firebase Auth](https://firebase.google.com/docs/auth) (Google Identity Platform): Sign up, Sign in, Sign out, Password reset, Email verification, and more
- 👤 Social OAuth (Google, Facebook, Twitter, GitHub, Apple), Email/Password, Magic Links, Phone Authentication, Multi-Factor Auth (MFA), User management with Admin SDK
- 📦 Type-safe ORM with DrizzleORM, optimized for PostgreSQL
- 💽 Offline and local development database with PGlite
- ☁️ Production database with [Neon PostgreSQL](https://neon.tech) - Serverless, autoscaling, with database branching
- 📁 File storage with [Google Cloud Storage](https://cloud.google.com/storage) for uploads, media, and assets
- 🌐 Multi-language (i18n) with next-intl and [Crowdin](https://l.crowdin.com/next-js)
- ♻️ Type-safe environment variables with T3 Env
- ⌨️ Form handling with React Hook Form
- 🔴 Validation library with Zod
- 📏 Linter with [ESLint](https://eslint.org) (default Next.js, Next.js Core Web Vitals, Tailwind CSS and Antfu configuration)
- 💖 Code Formatter with Prettier
- 🦊 Husky for Git Hooks (replaced by Lefthook)
- 🚫 Lint-staged for running linters on Git staged files
- 🚓 Lint git commit with Commitlint
- 📓 Write standard compliant commit messages with Commitizen
- 🔍 Unused files and dependencies detection with Knip
- 🌍 I18n validation and missing translation detection with i18n-check
- 🦺 Unit Testing with Vitest and Browser mode (replacing React Testing Library)
- 🧪 Integration and E2E Testing with Playwright
- 👷 Run tests on pull request with GitHub Actions
- 🎉 Storybook for UI development
- 🤖 AI services integration ready: [Deepgram](https://deepgram.com) for speech-to-text, [OpenAI](https://openai.com) for GPT models
- 🎙️ Real-time transcription and audio processing capabilities
- 🐰 AI-powered code reviews with [CodeRabbit](https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025)
- 🚨 Error Monitoring with [Sentry](https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo)
- 🔍 Local development error monitoring with Sentry Spotlight
- ☂️ Code coverage with [Codecov](https://about.codecov.io/codecov-free-trial/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo)
- 📝 Logging with LogTape and Log Management with [Better Stack](https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)
- 🖥️ Monitoring as Code with [Checkly](https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)
- 🔐 Security and bot protection with [Arcjet](https://launch.arcjet.com/Q6eLbRE) - Bot detection, rate limiting, WAF
- 📊 Analytics with [PostHog](https://posthog.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate)
- 🚀 Hosted on [Vercel](https://vercel.com) Enterprise with automatic deployments and edge functions
- 🎁 Automatic changelog generation with Semantic Release
- 🔍 Visual regression testing
- 💡 Absolute Imports using `@` prefix
- 🗂 VSCode configuration: Debug, Settings, Tasks and Extensions
- 🤖 SEO metadata, JSON-LD and Open Graph tags
- 🗺️ Sitemap.xml and robots.txt
- 👷 Automatic dependency updates with Dependabot
- ⌘ Database exploration with Drizzle Studio and CLI migration tool with Drizzle Kit
- ⚙️ Bundler Analyzer
- 🌈 Include a FREE minimalist theme
- 💯 Maximize lighthouse score

Built-in feature from Next.js:

- ☕ Minify HTML & CSS
- 💨 Live reload
- ✅ Cache busting

Optional features (easy to add):

- 🔑 Multi-tenancy, Role-based access control (RBAC)
- 🔐 OAuth for Single Sign-On (SSO), Enterprise SSO, SAML, OpenID Connect (OIDC), EASIE
- 🔗 Web 3 (Base, MetaMask, Coinbase Wallet, OKX Wallet)

### Philosophy

- Nothing is hidden from you, allowing you to make any necessary adjustments to suit your requirements and preferences.
- Dependencies are regularly updated on a monthly basis
- Start for free without upfront costs
- Easy to customize
- Minimal code
- Unstyled template
- SEO-friendly
- 🚀 Production-ready

### Requirements

- Node.js 22+ and npm

### Getting started

Run the following command on your local environment:

```shell
git clone --depth=1 https://github.com/ixartz/Next-js-Boilerplate.git my-project-name
cd my-project-name
npm install
```

For your information, all dependencies are updated every month.

Then, you can run the project locally in development mode with live reload by executing:

```shell
npm run dev
```

[![Run the command in Warp](public/assets/images/warp-banner.png)](https://go.warp.dev/nextjs-bp)

Open http://localhost:3000 with your favorite browser to see your project. For your information, the project is already pre-configured with a local database using PGlite. No extra setup is required to run the project locally.

### Set up authentication

To get started, you will need to set up Firebase Authentication (Google Identity Platform). This is the most complex component to configure but provides enterprise-grade authentication.

**Step 1: Create a Firebase Project**
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to Authentication > Get started
4. Enable the authentication methods you need (Email/Password, Google, etc.)

**Step 2: Get your Firebase credentials**
1. Go to Project Settings > General
2. Scroll down to "Your apps" and select the Web app (or create one)
3. Copy your Firebase configuration object

**Step 3: Add credentials to your project**
Add the following to your `.env.local` file (not tracked by Git):

```shell
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Step 4: (Optional) Set up Google Cloud Storage**
If you need file storage, set up GCS credentials:

```shell
GCS_PROJECT_ID=your_project_id
GCS_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=your_bucket_name
```

Now you have a fully functional authentication system with Next.js, including features such as sign up, sign in, sign out, password reset, email verification, social OAuth, MFA, and more.

**Note**: For detailed user management features and best practices, see [this guide](https://clerk.com/articles/essential-user-management-features-startups).

### Set up remote database

The project uses DrizzleORM, a type-safe ORM optimized for PostgreSQL. For production, we recommend [Neon](https://neon.tech), a serverless PostgreSQL platform with autoscaling, database branching, and excellent Next.js integration.

**Why Neon?**
- Serverless architecture with automatic scaling
- Database branching for development environments
- Connection pooling built-in
- Generous free tier
- Optimized for modern frameworks like Next.js

**Setup Steps:**

1. **Create a Neon account** at [neon.tech](https://neon.tech)
2. **Create a new project** - Neon will automatically provision a PostgreSQL database
3. **Get your connection string**:
   - Go to your project dashboard
   - Click "Connection Details"
   - Copy the connection string (pooled connection recommended)
4. **Add to your environment variables**:
   ```shell
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Add this to `.env.local` for local development and to your Vercel environment variables for production.

**Features you get with Neon:**
- Automatic backups
- Point-in-time recovery
- Branch databases for testing
- Scale to zero when idle
- Scale up automatically under load

**Alternative providers:** While we recommend Neon, any PostgreSQL provider works with this stack (Supabase, Railway, AWS RDS, etc.).

### Translation (i18n) setup

For translation, the project uses `next-intl` combined with [Crowdin](https://l.crowdin.com/next-js). As a developer, you only need to take care of the English (or another default language) version. Translations for other languages are automatically generated and handled by Crowdin. You can use Crowdin to collaborate with your translation team or translate the messages yourself with the help of machine translation.

To set up translation (i18n), create an account at [Crowdin.com](https://l.crowdin.com/next-js) and create a new project. In the newly created project, you will be able to find the project ID. You will also need to create a new Personal Access Token by going to Account Settings > API. Then, in your GitHub Actions, you need to define the following environment variables: `CROWDIN_PROJECT_ID` and `CROWDIN_PERSONAL_TOKEN`.

After defining the environment variables in your GitHub Actions, your localization files will be synchronized with Crowdin every time you push a new commit to the `main` branch.

### Project structure

```shell
.
├── README.md                       # README file
├── .github                         # GitHub folder
│   ├── actions                     # Reusable actions
│   └── workflows                   # GitHub Actions workflows
├── .storybook                      # Storybook folder
├── .vscode                         # VSCode configuration
├── migrations                      # Database migrations
├── public                          # Public assets folder
├── src
│   ├── app                         # Next JS App (App Router)
│   ├── components                  # React components
│   ├── libs                        # 3rd party libraries configuration
│   ├── locales                     # Locales folder (i18n messages)
│   ├── models                      # Database models
│   ├── styles                      # Styles folder
│   ├── templates                   # Templates folder
│   ├── types                       # Type definitions
│   ├── utils                       # Utilities folder
│   └── validations                 # Validation schemas
├── tests
│   ├── e2e                         # E2E tests, also includes Monitoring as Code
│   └── integration                 # Integration tests
├── next.config.ts                  # Next JS configuration
└── tsconfig.json                   # TypeScript configuration
```

### Customization

You can easily configure Next js Boilerplate by searching the entire project for `FIXME:` to make quick customizations. Here are some of the most important files to customize:

- `public/apple-touch-icon.png`, `public/favicon.ico`, `public/favicon-16x16.png` and `public/favicon-32x32.png`: your website favicon
- `src/utils/AppConfig.ts`: configuration file
- `src/templates/BaseTemplate.tsx`: default theme
- `next.config.ts`: Next.js configuration
- `.env`: default environment variables

You have full access to the source code for further customization. The provided code is just an example to help you start your project. The sky's the limit 🚀.

### Change database schema

To modify the database schema in the project, you can update the schema file located at `./src/models/Schema.ts`. This file defines the structure of your database tables using the Drizzle ORM library.

After making changes to the schema, generate a migration by running the following command:

```shell
npm run db:generate
```

[![Run the command in Warp](public/assets/images/warp-banner.png)](https://go.warp.dev/nextjs-bp)

This will create a migration file that reflects your schema changes.

After making sure your database is running, you can apply the generated migration using:

```shell
npm run db:migrate
```

There is no need to restart the Next.js server for the changes to take effect.

### Commit Message Format

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification, meaning all commit messages must be formatted accordingly. To help you write commit messages, the project provides an interactive CLI that guides you through the commit process. To use it, run the following command:

```shell
npm run commit
```

One of the benefits of using Conventional Commits is the ability to automatically generate GitHub releases. It also allows us to automatically determine the next version number based on the types of commits that are included in a release.

### CodeRabbit AI Code Reviews

The project uses [CodeRabbit](https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025), an AI-powered code reviewer. CodeRabbit monitors your repository and automatically provides intelligent code reviews on all new pull requests using its powerful AI engine.

Setting up CodeRabbit is simple, visit [coderabbit.ai](https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025), sign in with your GitHub account, and add your repository from the dashboard. That's it!

### Testing

All unit tests are located alongside the source code in the same directory, making them easier to find. The unit test files follow this format: `*.test.ts` or `*.test.tsx`. The project uses Vitest and React Testing Library for unit testing. You can run the tests with the following command:

```shell
npm run test
```

[![Run the command in Warp](public/assets/images/warp-banner.png)](https://go.warp.dev/nextjs-bp)

### Integration & E2E Testing

The project uses Playwright for integration and end-to-end (E2E) testing. Integration test files use the `*.spec.ts` extension, while E2E test files use the `*.e2e.ts` extension. You can run the tests with the following commands:

```shell
npx playwright install # Only for the first time in a new environment
npm run test:e2e
```

### Storybook

Storybook is configured for UI component development and testing. The project uses Storybook with Next.js and Vite integration, including accessibility testing and documentation features.

Stories are located alongside your components in the `src` directory and follow the pattern `*.stories.ts` or `*.stories.tsx`.

You can run Storybook in development mode with:

```shell
npm run storybook
```

This will start Storybook on http://localhost:6006 where you can view and interact with your UI components in isolation.

To run Storybook tests in headless mode, you can use the following command:

```shell
npm run storybook:test
```

### Local Production Build

Generate an optimized production build locally using a temporary in-memory Postgres database:

```shell
npm run build-local
```

This command:

- Starts a temporary in-memory Database server
- Runs database migrations with Drizzle Kit
- Builds the Next.js app for production
- Shuts down the temporary DB when the build finishes

Notes:

- By default, it uses a local database, but you can also use `npm run build` with a remote database.
- This only creates the build, it doesn't start the server. To run the build locally, use `npm run start`.

### Deploy to production

**Recommended: Deploy to Vercel**

This project is optimized for [Vercel](https://vercel.com) deployment with Enterprise-grade features:

1. **Connect your repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will auto-detect Next.js settings

2. **Configure environment variables** in Vercel Dashboard:
   ```shell
   # Database
   DATABASE_URL=postgresql://...your-neon-connection-string...

   # Firebase Authentication
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google Cloud Storage (optional)
   GCS_PROJECT_ID=your_project_id
   GCS_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
   GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GCS_BUCKET_NAME=your_bucket_name

   # AI Services (optional)
   DEEPGRAM_API_KEY=your_deepgram_key
   OPENAI_API_KEY=your_openai_key

   # Security
   ARCJET_KEY=ajkey_...

   # Monitoring & Observability
   NEXT_PUBLIC_SENTRY_DSN=https://...
   SENTRY_ORGANIZATION=your_org
   SENTRY_PROJECT=your_project
   SENTRY_AUTH_TOKEN=your_token
   NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=your_token
   NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST=https://...
   NEXT_PUBLIC_POSTHOG_KEY=your_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

3. **Deploy**: Click "Deploy" and Vercel will automatically:
   - Build your application
   - Run database migrations
   - Deploy to production with CDN
   - Set up automatic deployments for future pushes

**Vercel Enterprise Features:**
- Edge Functions and Middleware
- Advanced Analytics
- DDoS Mitigation
- Web Application Firewall
- 99.99% SLA uptime guarantee
- Priority support

**Local production build:**

During the build process, database migrations are automatically executed. Generate a production build with:

```shell
$ npm run build
```

[![Run the command in Warp](public/assets/images/warp-banner.png)](https://go.warp.dev/nextjs-bp)

Test the generated build locally:

```shell
$ npm run start
```

This starts a local server using the production build at http://localhost:3000.

### Deploy to Sevalla

You can deploy a Next.js application along with its database on a single platform. First, create an account on [Sevalla](https://sevalla.com).

After registration, you will be redirected to the dashboard. From there, navigate to `Database > Create a database`. Select PostgreSQL and and use the default settings for a quick setup. For advanced users, you can customize the database location and resource size. Finally, click on `Create` to complete the process.

Once the database is created and ready, return to the dashboard and click `Application > Create an App`. After connecting your GitHub account, select the repository you want to deploy. Keep the default settings for the remaining options, then click `Create`.

Next, connect your database to your application by going to `Networking > Connected services > Add connection` and select the database you just created. You also need to enable the `Add environment variables to the application` option, and rename `DB_URL` to `DATABASE_URL`. Then, click `Add connection`.

Go to `Environment variables > Add environment variable`, and define the environment variables `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from your Clerk account. Click `Save`.

Finally, initiate a new deployment by clicking `Overview > Latest deployments > Deploy now`. If everything is set up correctly, your application will be deployed successfully with a working database.

### Error Monitoring

The project uses [Sentry](https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo) to monitor errors. In the development environment, no additional setup is needed: SaaS Boilerplate is pre-configured to use Sentry and Spotlight (Sentry for Development). All errors will automatically be sent to your local Spotlight instance, allowing you to experience Sentry locally.

For production environment, you'll need to create a Sentry account and a new project. Then, in `.env.production`, you need to update the following environment variables:

```shell
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORGANIZATION=
SENTRY_PROJECT=
```

You also need to create a environment variable `SENTRY_AUTH_TOKEN` in your hosting provider's dashboard.

### Code coverage

Next.js Boilerplate relies on [Codecov](https://about.codecov.io/codecov-free-trial/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo) for code coverage reporting solution. To enable Codecov, create a Codecov account and connect it to your GitHub account. Your repositories should appear on your Codecov dashboard. Select the desired repository and copy the token. In GitHub Actions, define the `CODECOV_TOKEN` environment variable and paste the token.

Make sure to create `CODECOV_TOKEN` as a GitHub Actions secret, do not paste it directly into your source code.

### Logging

The project uses LogTape for logging. In the development environment, logs are displayed in the console by default.

For production, the project is already integrated with [Better Stack](https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate) to manage and query your logs using SQL. To use Better Stack, you need to create a [Better Stack](https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate) account and create a new source: go to your Better Stack Logs Dashboard > Sources > Connect source. Then, you need to give a name to your source and select Node.js as the platform.

After creating the source, you will be able to view and copy your source token. In your environment variables, paste the token into the `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` variable. You'll also need to define the `NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST` variable, which can be found in the same place as the source token.

Now, all logs will automatically be sent to and ingested by Better Stack.

### Checkly monitoring

The project uses [Checkly](https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate) to ensure that your production environment is always up and running. At regular intervals, Checkly runs the tests ending with `*.check.e2e.ts` extension and notifies you if any of the tests fail. Additionally, you have the flexibility to execute tests from multiple locations to ensure that your application is available worldwide.

To use Checkly, you must first create an account on [their website](https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate). After creating an account, generate a new API key in the Checkly Dashboard and set the `CHECKLY_API_KEY` environment variable in GitHub Actions. Additionally, you will need to define the `CHECKLY_ACCOUNT_ID`, which can also be found in your Checkly Dashboard under User Settings > General.

To complete the setup, update the `checkly.config.ts` file with your own email address and production URL.

### Arcjet security and bot protection

The project uses [Arcjet](https://launch.arcjet.com/Q6eLbRE), a security as code product that includes several features that can be used individually or combined to provide defense in depth for your site.

To set up Arcjet, [create a free account](https://launch.arcjet.com/Q6eLbRE) and get your API key. Then add it to the `ARCJET_KEY` environment variable.

Arcjet is configured with two main features: bot detection and the Arcjet Shield WAF:

- [Bot detection](https://docs.arcjet.com/bot-protection/concepts) is configured to allow search engines, preview link generators e.g. Slack and Twitter previews, and to allow common uptime monitoring services. All other bots, such as scrapers and AI crawlers, will be blocked. You can [configure additional bot types](https://docs.arcjet.com/bot-protection/identifying-bots) to allow or block.
- [Arcjet Shield WAF](https://docs.arcjet.com/shield/concepts) will detect and block common attacks such as SQL injection, cross-site scripting, and other OWASP Top 10 vulnerabilities.

Arcjet is configured with a central client at `src/libs/Arcjet.ts` that includes the Shield WAF rules. Additional rules are applied when Arcjet is called in `middleware.ts`.

### Useful commands

### Code Quality and Validation

The project includes several commands to ensure code quality and consistency. You can run:

- `npm run lint` to check for linting errors
- `npm run lint:fix` to automatically fix fixable issues from the linter
- `npm run check:types` to verify type safety across the entire project
- `npm run check:deps` help identify unused dependencies and files
- `npm run check:i18n` ensures all translations are complete and properly formatted

#### Bundle Analyzer

Next.js Boilerplate includes a built-in bundle analyzer. It can be used to analyze the size of your JavaScript bundles. To begin, run the following command:

```shell
npm run build-stats
```

By running the command, it'll automatically open a new browser window with the results.

#### Database Studio

The project is already configured with Drizzle Studio to explore the database. You can run the following command to open the database studio:

```shell
npm run db:studio
```

Then, you can open https://local.drizzle.studio with your favorite browser to explore your database.

### VSCode information (optional)

If you are VSCode user, you can have a better integration with VSCode by installing the suggested extension in `.vscode/extension.json`. The starter code comes up with Settings for a seamless integration with VSCode. The Debug configuration is also provided for frontend and backend debugging experience.

With the plugins installed in your VSCode, ESLint and Prettier can automatically fix the code and display errors. The same applies to testing: you can install the VSCode Vitest extension to automatically run your tests, and it also shows the code coverage in context.

Pro tips: if you need a project wide-type checking with TypeScript, you can run a build with <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> on Mac.

### Contributions

Everyone is welcome to contribute to this project. Feel free to open an issue if you have any questions or find a bug. Totally open to suggestions and improvements.

### License

Licensed under the MIT License, Copyright © 2025

See [LICENSE](LICENSE) for more information.

## Sponsors

<table width="100%">
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://clerk.com?utm_source=github&utm_medium=sponsorship&utm_campaign=nextjs-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ixartz/SaaS-Boilerplate/assets/1328388/6fb61971-3bf1-4580-98a0-10bd3f1040a2">
          <source media="(prefers-color-scheme: light)" srcset="https://github.com/ixartz/SaaS-Boilerplate/assets/1328388/f80a8bb5-66da-4772-ad36-5fabc5b02c60">
          <img alt="Clerk – Authentication & User Management for Next.js" src="https://github.com/ixartz/SaaS-Boilerplate/assets/1328388/f80a8bb5-66da-4772-ad36-5fabc5b02c60">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/coderabbit-logo-dark.svg?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/coderabbit-logo-light.svg?raw=true">
          <img alt="CodeRabbit" src="public/assets/images/coderabbit-logo-light.svg?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/sentry-white.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/sentry-dark.png?raw=true">
          <img alt="Sentry" src="public/assets/images/sentry-dark.png?raw=true">
        </picture>
      </a>
      <a href="https://about.codecov.io/codecov-free-trial/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/codecov-white.svg?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/codecov-dark.svg?raw=true">
          <img alt="Codecov" src="public/assets/images/codecov-dark.svg?raw=true">
        </picture>
      </a>
    </td>
  </tr>
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://launch.arcjet.com/Q6eLbRE">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/arcjet-dark.svg?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/arcjet-light.svg?raw=true">
          <img alt="Arcjet" src="public/assets/images/arcjet-light.svg?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://sevalla.com/">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/sevalla-dark.png">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/sevalla-light.png">
          <img alt="Sevalla" src="public/assets/images/sevalla-light.png">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://l.crowdin.com/next-js">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/crowdin-white.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/crowdin-dark.png?raw=true">
          <img alt="Crowdin" src="public/assets/images/crowdin-dark.png?raw=true">
        </picture>
      </a>
    </td>
  </tr>
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/better-stack-white.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/better-stack-dark.png?raw=true">
          <img alt="Better Stack" src="public/assets/images/better-stack-dark.png?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://posthog.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://posthog.com/brand/posthog-logo-white.svg">
          <source media="(prefers-color-scheme: light)" srcset="https://posthog.com/brand/posthog-logo.svg">
          <img alt="PostHog" src="https://posthog.com/brand/posthog-logo.svg">
        </picture>
      </a>
    </td>
    <td align="center" width="33%">
      <a href="https://www.nutrient.io/guides/web/nextjs/?utm_source=nextjs-boilerplate&utm_medium=referral">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/nutrient-dark.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/nutrient-light.png?raw=true">
          <img alt="Nutrient" src="public/assets/images/nutrient-light.png?raw=true">
        </picture>
      </a>
    </td>
  </tr>
  <tr height="187px">
    <td align="center" width="33%">
      <a href="https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="public/assets/images/checkly-logo-dark.png?raw=true">
          <source media="(prefers-color-scheme: light)" srcset="public/assets/images/checkly-logo-light.png?raw=true">
          <img alt="Checkly" src="public/assets/images/checkly-logo-light.png?raw=true">
        </picture>
      </a>
    </td>
    <td align="center" style=width="33%">
      <a href="https://nextjs-boilerplate.com/pro-saas-starter-kit">
        <img src="public/assets/images/nextjs-boilerplate-saas.png?raw=true" alt="Next.js SaaS Boilerplate with React" />
      </a>
    </td>
    <td align="center" width="33%">
      <a href="mailto:contact@creativedesignsguru.com">
        Add your logo here
      </a>
    </td>
  </tr>
</table>

---

Made with ♥ by [CreativeDesignsGuru](https://creativedesignsguru.com) [![Twitter](https://img.shields.io/twitter/url/https/twitter.com/cloudposse.svg?style=social&label=Follow%20%40Ixartz)](https://twitter.com/ixartz)

Looking for a custom boilerplate to kick off your project? I'd be glad to discuss how I can help you build one. Feel free to reach out anytime at contact@creativedesignsguru.com!

[![Sponsor Next JS Boilerplate](https://cdn.buymeacoffee.com/buttons/default-red.png)](https://github.com/sponsors/ixartz)
# story-care
