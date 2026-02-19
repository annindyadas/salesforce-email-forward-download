# AppExchange 2GP Packaging Guide

This guide walks through the process of packaging Email Forwarder for AppExchange using Second-Generation Packaging (2GP).

## Prerequisites

### 1. Dev Hub Enabled Org
You need a Dev Hub org (Production or Developer Edition org with Dev Hub enabled).

```bash
# Check if Dev Hub is enabled - go to Setup > Dev Hub in your org
# Enable Dev Hub if not already enabled
```

### 2. Authenticate to Dev Hub

```bash
# Login to your Dev Hub org
sf org login web --set-default-dev-hub --alias DevHub

# Verify connection
sf org list
```

### 3. Namespace (Optional but Recommended)
For AppExchange, a namespace is recommended to prevent naming conflicts.

**To create/link a namespace:**
1. Go to Setup in your Dev Hub org
2. Search for "Namespace Registries"
3. Link an existing namespace or create a new Developer Edition org with namespace

```bash
# If using namespace, update sfdx-project.json:
# "namespace": "your_namespace"
```

## Package Creation Steps

### Step 1: Create the Package (One-time)

```bash
# Create the unlocked package in your Dev Hub
sf package create \
  --name "Email Forwarder" \
  --description "Forward and download emails as EML files with attachments" \
  --package-type Unlocked \
  --path force-app \
  --target-dev-hub DevHub

# For managed package (AppExchange with IP protection):
sf package create \
  --name "Email Forwarder" \
  --description "Forward and download emails as EML files with attachments" \
  --package-type Managed \
  --path force-app \
  --target-dev-hub DevHub
```

After running this, the `sfdx-project.json` will be updated with the package ID (0Ho...).

### Step 2: Create Package Version

```bash
# Create a package version (beta)
sf package version create \
  --package "Email Forwarder" \
  --definition-file config/project-scratch-def.json \
  --installation-key-bypass \
  --wait 20 \
  --target-dev-hub DevHub \
  --code-coverage

# Check version creation status
sf package version create report --package-create-request-id 08c...
```

### Step 3: List Package Versions

```bash
# List all versions
sf package version list --target-dev-hub DevHub

# Get details of specific version
sf package version report --package 04t... --target-dev-hub DevHub
```

### Step 4: Promote to Released (For AppExchange)

```bash
# Promote version to released (required for AppExchange)
sf package version promote --package 04t... --target-dev-hub DevHub
```

**⚠️ Important:** Once promoted, a version cannot be deleted and the code is locked.

### Step 5: Test Installation

```bash
# Install in a test org
sf package install \
  --package 04t... \
  --target-org TestOrg \
  --wait 10

# Verify installation
sf package installed list --target-org TestOrg
```

## Package Configuration

### sfdx-project.json Structure

```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true,
      "package": "Email Forwarder",
      "versionName": "Spring '26",
      "versionNumber": "1.0.0.NEXT",
      "versionDescription": "Email Forwarder & Downloader for Salesforce"
    }
  ],
  "namespace": "",
  "packageAliases": {
    "Email Forwarder": "0HoXXXXXXXXXXXXXX",
    "Email Forwarder@1.0.0-1": "04tXXXXXXXXXXXXXX"
  }
}
```

### Version Numbering
- Format: `MAJOR.MINOR.PATCH.BUILD`
- Use `NEXT` for auto-incrementing build number
- Example: `1.0.0.NEXT` → `1.0.0.1`, `1.0.0.2`, etc.

## AppExchange Submission Checklist

### Security Review Requirements

- [ ] **Code Analysis**: Run Salesforce Code Analyzer
  ```bash
  sf scanner run --target force-app --format html --outfile CodeAnalyzerReport.html
  ```

- [ ] **Test Coverage**: Minimum 75% code coverage (we have 100%)
  ```bash
  sf apex run test --code-coverage --result-format human --target-org TestOrg
  ```

- [ ] **CRUD/FLS Enforcement**: ✅ Using `WITH SECURITY_ENFORCED`

- [ ] **Sharing Model**: ✅ Using `with sharing` keyword

- [ ] **No Hardcoded IDs/URLs**: ✅ Verified

- [ ] **Lightning Web Security (LWS)**: ✅ Compatible

### Package Contents Checklist

| Component | Status | Notes |
|-----------|--------|-------|
| Apex Classes | ✅ | EmailForwarder.cls |
| Apex Test Class | ✅ | EmailForwarderTest.cls (100% coverage) |
| LWC: emailForwarderModal | ✅ | Main modal component |
| LWC: emailDownloader | ✅ | Single email download |
| LWC: emailUtils | ✅ | Shared utilities |
| Flow: Download_Email | ✅ | Screen flow wrapper |
| Quick Action | ✅ | EmailMessage.Download |
| Custom Permissions | ✅ | Forward & Download |
| Permission Sets | ✅ | Full Access & Download Only |

### Documentation Requirements

- [ ] **App Description**: Clear value proposition
- [ ] **Installation Guide**: Post-install setup steps
- [ ] **User Guide**: How to use the features
- [ ] **Release Notes**: Feature list and version history
- [ ] **Support Contact**: Email/URL for support
- [ ] **Screenshots**: UI screenshots for listing
- [ ] **Demo Video**: Recommended for AppExchange

## Partner Program Requirements

1. **Join Salesforce Partner Program**
   - Visit [partners.salesforce.com](https://partners.salesforce.com)
   - Complete ISV partner registration

2. **Create AppExchange Publishing Org**
   - Linked to your Partner account
   - Used to manage listings

3. **Security Review**
   - Submit package for security review
   - ~2-4 weeks typical review time
   - May require remediation

## Common Commands Reference

```bash
# Package operations
sf package list --target-dev-hub DevHub
sf package version list --target-dev-hub DevHub
sf package version delete --package 04t... --target-dev-hub DevHub

# Installation
sf package install --package 04t... --target-org TargetOrg
sf package uninstall --package 04t... --target-org TargetOrg

# Testing
sf apex run test --test-level RunAllTestsInOrg --target-org TestOrg
```

## Troubleshooting

### "Package version not available"
- Wait a few minutes after version creation
- Check status: `sf package version create report --package-create-request-id 08c...`

### "Insufficient code coverage"
- Ensure tests are included in package
- Run: `sf apex run test --code-coverage --target-org TestOrg`

### "Namespace conflict"
- Ensure namespace is linked to Dev Hub
- Check namespace registry in Setup

## Next Steps

1. ✅ Prepare sfdx-project.json
2. ⬜ Enable Dev Hub (if not done)
3. ⬜ Create package in Dev Hub
4. ⬜ Create package version
5. ⬜ Test in scratch org / sandbox
6. ⬜ Promote to released
7. ⬜ Submit for security review
8. ⬜ Create AppExchange listing

---

**Ready to start?** Run the commands in order from Step 1 above!
