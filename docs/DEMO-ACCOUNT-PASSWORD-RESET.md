# Reset the seeded demo-account password

Use this procedure only when the preloaded demo accounts cannot sign in. All seeded demo accounts share the `DEMO_ACCOUNT_PASSWORD` value. The reset script changes only those seeded accounts; it does not modify other users, registrations, events, or tickets.

1. In Render, open the CampusTicketing service's **Environment** page.
2. Set `DEMO_ACCOUNT_PASSWORD` to the new password you want to use (12–72 bytes). Keep it private.
3. Save the environment change and wait for the service to finish deploying.
4. Open the service's **Shell** and run:

   ```sh
   RESET_DEMO_ACCOUNT_PASSWORDS=YES npm run reset:demo-passwords
   ```

5. Confirm the output says the reset completed and updated the expected seeded accounts. Then sign in using the matching seeded USN/email and the password you entered in Render.

The reset is explicit and one-time. Changing `DEMO_ACCOUNT_PASSWORD` alone does not rewrite password hashes already stored in MongoDB. Do not run the reset command unless you intend to change the shared password for the seeded demo accounts.
