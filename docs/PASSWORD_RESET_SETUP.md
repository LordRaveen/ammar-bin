# Password Reset Email Configuration

## Issue: Password Reset Emails Not Being Sent

If guardians or staff members are not receiving password reset emails, this is likely due to **Supabase's default email provider limitations**.

### Root Cause
Supabase's built-in email service is for **testing purposes only** and has:
- Low rate limits (3 emails per hour)
- High chance of emails going to spam
- No guaranteed delivery

### Solution: Configure Custom SMTP Provider

You need to set up a custom SMTP provider in your Supabase project:

#### Step 1: Choose an Email Provider
Recommended providers:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (0.10 USD per 1,000 emails)
- **Postmark** (free tier: 100 emails/month)

#### Step 2: Configure in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Click **Settings** → **SMTP Settings**
4. Enter your SMTP credentials:
   - Host: `smtp.sendgrid.net` (or your provider)
   - Port: `587`
   - Username: Your SMTP username
   - Password: Your SMTP password/API key
   - Sender email: `noreply@yourschool.com`
   - Sender name: `Your School Name`

#### Step 3: Customize Email Templates

In **Authentication** → **Email Templates**, customize:
- **Reset Password** email template
- Subject line
- Email body
- Add school branding/logo

#### Step 4: Test

1. Go to `/auth/forgot-password`
2. Enter a test email
3. Check inbox (and spam folder)
4. Verify reset link works

### Alternative: Manual Password Reset

If email configuration is not possible immediately, admins can manually reset passwords:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find the user by email
3. Click **Options** → **Send Password Reset Email**
4. Or set a temporary password directly

### Temporary Workaround

For development/testing, you can:
1. Check Supabase Auth logs to see if emails are being attempted
2. Use a test email service like **Mailtrap** to capture emails
3. Manually share reset links from Supabase logs

### Troubleshooting Checklist

- [ ] Custom SMTP provider configured in Supabase
- [ ] SMTP credentials are correct
- [ ] Sender email domain is verified
- [ ] Firewall not blocking SMTP port 587
- [ ] Email templates are configured
- [ ] Test email received successfully
- [ ] Production email limits are sufficient

For production use, **custom SMTP is mandatory** for reliable password reset functionality.
