# Operations Runbook

## Local Setup

Install and run:

```bash
yarn install
cp .env.template .env.local
yarn dev
```

Default local URL: `http://localhost:3000`

## Daily Commands

```bash
yarn dev
yarn lint
yarn format:check
yarn build
```

Storybook:

```bash
yarn storybook
yarn build-storybook
```

## Integration Validation

When changing API/data logic:

1. Verify backend URL and publishable key values.
2. Validate auth-dependent pages (`/user/*`) with valid and expired sessions.
3. Validate cart and checkout requests with `x-publishable-api-key`.
4. Validate locale redirects for root and deep links.

## Common Issues

### App shows "Configuration Error"

Cause:

- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` missing in production.

Fix:

1. Set variable in deployment environment.
2. Redeploy application.

### Requests fail with auth/publishable key errors

Cause:

- wrong or missing publishable key
- backend URL points to wrong environment

Fix:

1. Confirm `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
2. Confirm `MEDUSA_BACKEND_URL`.
3. Confirm backend accepts the same publishable key.

### Unexpected locale redirects

Cause:

- `NEXT_PUBLIC_DEFAULT_REGION` not set consistently.

Fix:

1. Define `NEXT_PUBLIC_DEFAULT_REGION` in all envs.
2. Keep value aligned with supported locale routes.

### Messenger share not working

Cause:

- `NEXT_PUBLIC_FACEBOOK_APP_ID` missing.

Fix:

1. Provide `NEXT_PUBLIC_FACEBOOK_APP_ID`.
2. Re-test share modal.

## Change Management Checklist

1. Update docs for new env variables.
2. Run `yarn lint` and `yarn build` before merge.
3. Verify critical flows in target environment after deploy:
   - login
   - cart
   - checkout
   - account pages
