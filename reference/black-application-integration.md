# Black application flow — integration handoff

## Current preview

The user approved draft questions and a visual preview with submission disabled.
`apply/index.html` uses the shared Swan Academy palette, typography, monogram,
header treatment, and footer. `src/application.js` prevents form submission;
no answers are transmitted or stored by the preview. The form must stay disabled
until a real endpoint and operational workflow are configured and tested.

All five homepage Black links open `./apply/`. The previous direct Whop checkout
is no longer exposed through those application buttons. The free-system dialog
remains independent and retains its existing disabled preview behavior.

The status-page visual preview now lives at `status/index.html`. A separate link
in the application preview opens `/status/?preview=received`; the submit button
remains disabled. A persistent preview notice and selector show that the status
states are examples. The default `/status/` route shows no application loaded.
Only whitelisted `preview` values select examples. Arbitrary status, identity,
and checkout URL parameters are ignored; there is no record lookup, storage,
polling, submission, or payment. Checkout remains disabled in the approved view.
The declined example contains a placeholder for the reviewer's explanation,
not an invented rejection reason. Expired/unavailable examples communicate that
they do not establish a decision. Without JavaScript, no approval is displayed.

## Draft fields

| Field | Form name | Purpose |
|---|---|---|
| Name | `name` | Applicant identity |
| Email | `email` | Application communications and private access |
| Current English | `englishLevel` | Self-described starting point |
| Goals | `goal` | What the applicant wants English to enable |
| Main obstacle | `obstacle` | Prior attempts and current difficulty |
| Daily availability | `dailyTime` | Sustainable commitment |
| Paid-cohort acknowledgment | `paidCohortAcknowledged` | Awareness of payment and selective admission |

Questions and options are drafts. The readiness checkbox is not payment
authorization or marketing consent. No price, decision deadline, refund policy,
or guaranteed admission has been invented.

## Next: application submission and review

GitHub Pages serves static files. Add a server-side endpoint (for example, a
serverless function) to validate submissions, limit abuse, and write to the
selected application database. Credentials for Airtable, Brevo, or another
provider must remain on the server. Choose the platform before implementing its
specific API adapter. Airtable is a possible review workspace; Brevo is a possible
email/automation service. They need not be the same system.

Before launch, finalize questions, applicant privacy information, data access and
retention, the review workflow, and any applicant communication templates. Enable
submission only after a real test application is received and errors/retries work.
Show success only after the backend confirms a durable record.

## Then: private status page

The branded layout and sample states are built; the authenticated data connection
is still required. Replace the preview controls and fixtures with verified record
data only when the full flow is ready. Do not enable payment or submission merely
by removing the preview notice. Keep review messages as text, never injected HTML.

Suggested states: received, under review, approved, not accepted, and enrolled.
The website should read the authoritative status from the backend. Use private
email access links or authenticated sessions; do not expose records through a
public email search, sequential ID, query-string status, or client-side state.
Polling while the page is visible is sufficient for timely updates; a streaming
connection is optional. Define the refresh interval with the chosen backend.

On approval, show the applicant's approved invitation and a payment action. On a
decline, show only the applicant-facing explanation explicitly supplied by the
reviewer, never internal notes or an invented reason. Handle expired access links,
network failures, and pending decisions honestly. The browser must not be able
to approve an application by changing HTML, URL parameters, or local storage.

## Finally: branded checkout

The user selected Paddle. `/checkout/` now provides the branded page shell, with a
Black order summary, illustrative payment fields, a disabled pay button, and an
explicit preview notice. The approved status example links to it separately; its
real payment button stays disabled. No SDK, card inputs, API calls, storage, or
payment callbacks are active. Direct links and reloads work on GitHub Pages.

Before integration, confirm Paddle's current supported embed, product eligibility,
required disclosures, and branding options. The surrounding
Swan Academy page can match the site; provider-controlled payment fields and
authentication steps may retain provider styling or require a redirect. Do not
promise that every payment step will remain fully customizable or on-site.

The intended integration is Paddle's supported inline checkout. Documentation:
https://developer.paddle.com/build/checkout/build-branded-inline-checkout
This environment returned a proxy 403 when accessing that documentation; no SDK
interface or account-specific setup has been implemented on unverified assumptions.

Before enabling payments:

1. Confirm price, currency, billing model, cohort timing, refund/cancellation terms,
   customer support contact, and the required privacy/terms URLs. Populate the
   final order summary from authoritative pricing, including taxes and recurring
   terms when applicable; never trust a query-string price or payment status.
2. Configure the Paddle product/price, account and domain requirements, public
   client configuration, and server-only API/webhook secrets. Verify eligibility
   for this guided cohort with Paddle. Start in its sandbox.
3. Authenticate the applicant and check approval server-side before creating or
   retrieving their checkout transaction. Do not treat `preview=approved`, a
   transaction ID in the URL, or possession of this public page as authorization.
4. Replace the whole `#paddle-checkout` placeholder with Paddle-hosted payment
   components. Remove the illustrative external pay button if the embedded form
   supplies its own. Apply only supported theme options; do not collect card
   details with custom HTML inputs or attempt to restyle inside the provider iframe.
5. Handle loading, unavailable/expired invitations, cancellation, payment errors,
   and payment pending verification. Verify signed provider webhooks server-side,
   correlate them to the applicant and transaction, process them idempotently,
   and update enrollment only on the appropriate verified payment event.
6. Test the complete sandbox flow, including mobile payment/authentication flows
   and delayed/duplicate webhooks, before enabling live payments. A browser callback
   or success URL alone must never confirm enrollment.

Use the provider's supported hosted payment components. Do not build raw card
collection into the site. An approved applicant's checkout access/session should
be validated server-side. Confirm payment through verified provider webhooks;
never grant access solely because a browser reaches a success URL. Store no secret
provider credentials in the client or repository.

## Not yet implemented

No application backend, approval automation, live status tracking, status emails,
payment session creation, or payment webhook integration is active. Those are
subsequent stages after the visual previews, with provider configuration supplied
by the user. After a real submission succeeds, redirect using the backend-issued
private access flow; the example `preview` query parameter is never that flow.
