#!/bin/bash

# Interactive script to enable public access to Cloud Run service
# For StoryCare project: storycare-478114

PROJECT_ID="storycare-478114"
SERVICE_NAME="storycare-app-dev"
REGION="us-central1"
SERVICE_URL="https://storycare-app-dev-sbfj3zrjva-uc.a.run.app"

# Colors for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    StoryCare Cloud Run - Public Access Configuration Tool     ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}Project:${NC} $PROJECT_ID"
echo -e "${YELLOW}Service:${NC} $SERVICE_NAME"
echo -e "${YELLOW}Region:${NC} $REGION"
echo -e "${YELLOW}URL:${NC} $SERVICE_URL"
echo ""

# Function to check current status
check_status() {
    echo -e "${BLUE}▶ Checking current configuration...${NC}"
    echo ""

    # Check if service exists
    if gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID &>/dev/null; then
        echo -e "${GREEN}✓${NC} Cloud Run service exists"
    else
        echo -e "${RED}✗${NC} Cloud Run service not found"
        return 1
    fi

    # Check organization policy
    echo ""
    echo -e "${YELLOW}Organization Policy Status:${NC}"
    if gcloud resource-manager org-policies describe iam.allowedPolicyMemberDomains --project=$PROJECT_ID &>/dev/null; then
        echo -e "${RED}✗${NC} Domain restriction policy is active (blocking public access)"
        echo "  This is why you can't enable public access."
    else
        echo -e "${GREEN}✓${NC} No domain restriction policy"
    fi

    # Check IAM policy
    echo ""
    echo -e "${YELLOW}Current IAM Policy:${NC}"
    POLICY=$(gcloud run services get-iam-policy $SERVICE_NAME --region=$REGION --project=$PROJECT_ID 2>/dev/null)

    if echo "$POLICY" | grep -q "allUsers"; then
        echo -e "${GREEN}✓${NC} Public access is ENABLED (allUsers has access)"
    else
        echo -e "${RED}✗${NC} Public access is DISABLED (authentication required)"
    fi

    echo ""
    echo -e "${YELLOW}Test Access:${NC}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/api/health 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} Service is publicly accessible (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "403" ]; then
        echo -e "${RED}✗${NC} Service returns 403 Forbidden - authentication required"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo -e "${YELLOW}⚠${NC} Service returns 404 - service running but /api/health not found"
    else
        echo -e "${RED}✗${NC} Service not accessible (HTTP $HTTP_CODE)"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to test with authentication
test_authenticated() {
    echo -e "${BLUE}▶ Testing with authentication...${NC}"
    echo ""

    echo "Getting identity token..."
    TOKEN=$(gcloud auth print-identity-token 2>/dev/null)

    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗${NC} Failed to get identity token"
        echo "  Make sure you're authenticated: gcloud auth login"
        read -p "Press Enter to continue..."
        return 1
    fi

    echo "Making authenticated request to $SERVICE_URL/api/health..."
    echo ""

    RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" -w "\nHTTP_CODE:%{http_code}" $SERVICE_URL/api/health)
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

    echo -e "${YELLOW}Response:${NC}"
    echo "$BODY"
    echo ""
    echo -e "${YELLOW}HTTP Status:${NC} $HTTP_CODE"

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} Service is working with authentication!"
    else
        echo -e "${RED}✗${NC} Service returned error"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to enable public access
enable_public_access() {
    echo -e "${BLUE}▶ Attempting to enable public access...${NC}"
    echo ""

    echo "Running command:"
    echo "gcloud run services add-iam-policy-binding $SERVICE_NAME \\"
    echo "  --region=$REGION \\"
    echo "  --member=\"allUsers\" \\"
    echo "  --role=\"roles/run.invoker\" \\"
    echo "  --project=$PROJECT_ID"
    echo ""

    read -p "Continue? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Cancelled."
        read -p "Press Enter to continue..."
        return
    fi

    OUTPUT=$(gcloud run services add-iam-policy-binding $SERVICE_NAME \
        --region=$REGION \
        --member="allUsers" \
        --role="roles/run.invoker" \
        --project=$PROJECT_ID 2>&1)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Public access enabled successfully!"
        echo ""
        echo "Testing public access..."
        sleep 2
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/api/health)

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓${NC} Service is now publicly accessible!"
            echo ""
            echo "You can access it at: $SERVICE_URL"
        else
            echo -e "${YELLOW}⚠${NC} Policy updated but service returned HTTP $HTTP_CODE"
        fi
    else
        echo -e "${RED}✗${NC} Failed to enable public access"
        echo ""
        echo "$OUTPUT"
        echo ""

        if echo "$OUTPUT" | grep -q "organization policy"; then
            echo -e "${YELLOW}⚠ Organization Policy Blocking Access${NC}"
            echo ""
            echo "Your organization has a policy that prevents public access."
            echo "You need an Organization Admin to update the policy."
            echo ""
            echo "See ENABLE_PUBLIC_ACCESS.md for detailed instructions."
        fi
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to show org admin instructions
show_admin_instructions() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          Instructions for Organization Administrator          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "If you're getting organization policy errors, an admin needs to run:"
    echo ""
    echo -e "${YELLOW}Option 1: Allow public access for entire organization${NC}"
    echo ""
    echo "cat > /tmp/allow-public.yaml << 'EOF'"
    echo "constraint: constraints/iam.allowedPolicyMemberDomains"
    echo "listPolicy:"
    echo "  allValues: ALLOW"
    echo "EOF"
    echo ""
    echo "gcloud resource-manager org-policies set-policy /tmp/allow-public.yaml \\"
    echo "  --organization=YOUR_ORG_ID"
    echo ""
    echo -e "${YELLOW}Option 2: Allow public access for this project only${NC}"
    echo ""
    echo "cat > /tmp/allow-public-project.yaml << 'EOF'"
    echo "constraint: constraints/iam.allowedPolicyMemberDomains"
    echo "listPolicy:"
    echo "  allValues: ALLOW"
    echo "EOF"
    echo ""
    echo "gcloud resource-manager org-policies set-policy /tmp/allow-public-project.yaml \\"
    echo "  --project=$PROJECT_ID"
    echo ""
    echo -e "${YELLOW}Option 3: Allow specific domains + public access${NC}"
    echo ""
    echo "cat > /tmp/allow-domain-public.yaml << 'EOF'"
    echo "constraint: constraints/iam.allowedPolicyMemberDomains"
    echo "listPolicy:"
    echo "  allowedValues:"
    echo "    - \"allUsers\""
    echo "    - \"allAuthenticatedUsers\""
    echo "    - \"entryway.health\"  # Your organization domain"
    echo "EOF"
    echo ""
    echo "gcloud resource-manager org-policies set-policy /tmp/allow-domain-public.yaml \\"
    echo "  --project=$PROJECT_ID"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "After the admin updates the policy, run this script again and"
    echo "select option 3 to enable public access."
    echo ""
    read -p "Press Enter to continue..."
}

# Function to generate policy files
generate_policy_files() {
    clear
    echo -e "${BLUE}▶ Generating organization policy files...${NC}"
    echo ""

    # File 1: Allow all
    cat > org-policy-allow-all.yaml << 'EOF'
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allValues: ALLOW
EOF
    echo -e "${GREEN}✓${NC} Created: org-policy-allow-all.yaml"

    # File 2: Allow specific + public
    cat > org-policy-specific-domains.yaml << EOF
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allowedValues:
    - "allUsers"
    - "allAuthenticatedUsers"
    - "entryway.health"
EOF
    echo -e "${GREEN}✓${NC} Created: org-policy-specific-domains.yaml"

    # File 3: Instructions for admin
    cat > INSTRUCTIONS_FOR_ADMIN.txt << EOF
Organization Policy Update Instructions
========================================

Project: $PROJECT_ID
Issue: Cannot enable public access to Cloud Run service due to organization policy

Instructions:
-------------

1. Choose one of the policy files:
   - org-policy-allow-all.yaml (allows public access everywhere)
   - org-policy-specific-domains.yaml (allows specific domains + public)

2. Apply the policy:

   For entire organization:
   gcloud resource-manager org-policies set-policy [FILE] --organization=YOUR_ORG_ID

   For this project only:
   gcloud resource-manager org-policies set-policy [FILE] --project=$PROJECT_ID

3. After applying, the developer can enable public access with:
   gcloud run services add-iam-policy-binding $SERVICE_NAME \\
     --region=$REGION \\
     --member="allUsers" \\
     --role="roles/run.invoker" \\
     --project=$PROJECT_ID

Contact: $(gcloud config get-value account 2>/dev/null)
Date: $(date)
EOF
    echo -e "${GREEN}✓${NC} Created: INSTRUCTIONS_FOR_ADMIN.txt"

    echo ""
    echo "Files created in current directory:"
    echo "  1. org-policy-allow-all.yaml"
    echo "  2. org-policy-specific-domains.yaml"
    echo "  3. INSTRUCTIONS_FOR_ADMIN.txt"
    echo ""
    echo "Send these files to your organization administrator."
    echo ""
    read -p "Press Enter to continue..."
}

# Function to show current permissions
show_permissions() {
    clear
    echo -e "${BLUE}▶ Checking all permissions...${NC}"
    echo ""

    echo -e "${YELLOW}Service Accounts:${NC}"
    echo "  GitHub Actions SA: github-actions@$PROJECT_ID.iam.gserviceaccount.com"
    echo "  Default Compute SA: 832961952490-compute@developer.gserviceaccount.com"
    echo ""

    echo -e "${YELLOW}Secret Manager Access:${NC}"
    echo "  DATABASE_URL_DEV:"
    gcloud secrets get-iam-policy DATABASE_URL_DEV --project=$PROJECT_ID 2>/dev/null | grep -E "members:|role:" | head -6
    echo ""
    echo "  DATABASE_URL:"
    gcloud secrets get-iam-policy DATABASE_URL --project=$PROJECT_ID 2>/dev/null | grep -E "members:|role:" | head -6
    echo ""

    echo -e "${YELLOW}Cloud Run IAM Policy:${NC}"
    gcloud run services get-iam-policy $SERVICE_NAME --region=$REGION --project=$PROJECT_ID 2>/dev/null
    echo ""

    read -p "Press Enter to continue..."
}

# Main menu loop
while true; do
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              Public Access Configuration Menu                  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Select an option:"
    echo ""
    echo "  ${GREEN}1)${NC} Check current status"
    echo "  ${GREEN}2)${NC} Test service with authentication"
    echo "  ${GREEN}3)${NC} Enable public access (requires permissions)"
    echo "  ${GREEN}4)${NC} Show instructions for Organization Admin"
    echo "  ${GREEN}5)${NC} Generate policy files for Admin"
    echo "  ${GREEN}6)${NC} Show current permissions"
    echo "  ${GREEN}7)${NC} Open service URL in browser"
    echo "  ${GREEN}8)${NC} View full documentation (ENABLE_PUBLIC_ACCESS.md)"
    echo "  ${RED}9)${NC} Exit"
    echo ""
    read -p "Enter your choice [1-9]: " choice

    case $choice in
        1)
            clear
            check_status
            ;;
        2)
            clear
            test_authenticated
            ;;
        3)
            clear
            enable_public_access
            ;;
        4)
            show_admin_instructions
            ;;
        5)
            generate_policy_files
            ;;
        6)
            show_permissions
            ;;
        7)
            echo ""
            echo "Opening $SERVICE_URL in browser..."
            if command -v open &> /dev/null; then
                open "$SERVICE_URL"
            elif command -v xdg-open &> /dev/null; then
                xdg-open "$SERVICE_URL"
            else
                echo "Please open this URL manually: $SERVICE_URL"
            fi
            sleep 2
            ;;
        8)
            if [ -f "ENABLE_PUBLIC_ACCESS.md" ]; then
                clear
                less ENABLE_PUBLIC_ACCESS.md
            else
                echo ""
                echo -e "${RED}✗${NC} ENABLE_PUBLIC_ACCESS.md not found"
                read -p "Press Enter to continue..."
            fi
            ;;
        9)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}Invalid option. Please try again.${NC}"
            sleep 2
            ;;
    esac
done
