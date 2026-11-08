# Reset the seeded demo-account password

Use this procedure only when the preloaded demo accounts cannot sign in. All seeded demo accounts share the `DEMO_ACCOUNT_PASSWORD` value. The reset script changes only those seeded accounts; it does not modify other users, registrations, events, or tickets.

1. In Render, open the CampusTicketing service's **Environment** page.
2. Set `DEMO_ACCOUNT_PASSWORD` to the new password you want to use (12–72 bytes). Keep it private.
3. Add `RESET_DEMO_ACCOUNT_PASSWORDS` with the value `YES`.
4. Save the environment changes and wait for the service to finish deploying. During startup, the service updates only the seeded demo accounts and records a one-time marker in MongoDB so it cannot repeat on restart.
5. Confirm the deploy log says the reset completed and updated five seeded accounts. Then remove `RESET_DEMO_ACCOUNT_PASSWORDS` from Render and save again. This second deploy clears the temporary trigger; the database marker keeps the reset one-time.
6. Sign in using a seeded USN/email and the password you entered in Render.

The reset is explicit and one-time. Changing `DEMO_ACCOUNT_PASSWORD` alone does not rewrite password hashes already stored in MongoDB. Do not set the trigger unless you intend to change the shared password for the seeded demo accounts. If fewer than five seeded accounts are present, the log reports the matched count and does not record completion.
