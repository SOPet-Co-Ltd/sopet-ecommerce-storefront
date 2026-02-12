# Deployment

## Deployment Target

- Platform: Vercel
- Trigger: GitHub Actions workflow at `.github/workflows/deploy.yml`

## Branch Mapping

- `main`: triggers production deploy hook
- `uat`: triggers UAT deploy hook

Workflow behavior:

- Executes on push to `main` or `uat`
- Skips deploy trigger for a filtered commit-author email

## Release Checklist

1. Confirm backend environment is available and compatible.
2. Confirm env vars are set in Vercel for target environment.
3. Confirm `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` and `MEDUSA_BACKEND_URL`.
4. Confirm third-party keys (Stripe, Algolia as needed).
5. Run local validation:
   - `yarn lint`
   - `yarn build`

## Post-Deploy Smoke Test

1. Home page and locale redirect behavior.
2. Product listing and product details pages.
3. Cart and checkout page rendering.
4. Login flow and protected `/user` route guard.
5. Search (Algolia) and payment form initialization (Stripe).

## Rollback

If deployment is unhealthy:

1. Re-deploy previous stable Vercel build.
2. Verify environment variables were not changed unexpectedly.
3. If backend contract changed, rollback frontend and backend as a pair.

## Notes

- This repo currently uses deploy hooks via workflow; there is no in-repo infra config like `vercel.json`.
- Keep branch policy and environment-variable sets aligned between frontend and backend repos.
