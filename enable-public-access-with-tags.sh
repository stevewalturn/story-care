#!/bin/bash

# Interactive script to enable public access to Cloud Run using Resource Manager Tags
# Based on: https://cloud.google.com/blog/topics/developers-practitioners/how-create-public-cloud-run-services-when-domain-restricted-sharing-enforced
# For StoryCare project: storycare-478114

PROJECT_ID="storycare-478114"
PROJECT_NUMBER="832961952490"
SERVICE_NAME="storycare-app-dev"
REGION="us-central1"
SERVICE_URL="https://storycare-app-dev-sbfj3zrjva-uc.a.run.app"

# You need to get your organization ID
ORGANIZATION_ID=""  # Will be fetched automatically

# Colors for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get organization ID
get_org_id() {
    if [ -z "$ORGANIZATION_ID" ]; then
        ORGANIZATION_ID=$(gcloud projects describe $PROJECT_ID --format="value(parent.id)" 2>/dev/null)
        if [ -z "$ORGANIZATION_ID" ]; then
            echo -e "${RED}✗${NC} Could not get organization ID"
            return 1
        fi
    fi
    echo "$ORGANIZATION_ID"
}

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   StoryCare - Enable Public Access with Resource Manager Tags  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
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

    # Get org ID
    ORG=$(get_org_id)
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗${NC} Failed to get organization ID"
        echo ""
        read -p "Press Enter to continue..."
        return 1
    fi
    echo -e "${YELLOW}Organization ID:${NC} $ORG"
    echo ""

    # Check if service exists
    if gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID &>/dev/null; then
        echo -e "${GREEN}✓${NC} Cloud Run service exists"
    else
        echo -e "${RED}✗${NC} Cloud Run service not found"
        read -p "Press Enter to continue..."
        return 1
    fi

    # Check ingress settings
    INGRESS=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(spec.template.metadata.annotations.'run.googleapis.com/ingress')" 2>/dev/null)
    echo -e "${YELLOW}Ingress Setting:${NC} ${INGRESS:-all}"

    # Check organization policy
    echo ""
    echo -e "${YELLOW}Organization Policy Status:${NC}"
    if gcloud resource-manager org-policies describe iam.allowedPolicyMemberDomains --project=$PROJECT_ID &>/dev/null; then
        echo -e "${RED}✗${NC} Domain restriction policy is active"

        # Check if it's conditional
        POLICY=$(gcloud org-policies describe iam.allowedPolicyMemberDomains --project=$PROJECT_ID --format=json 2>/dev/null)
        if echo "$POLICY" | grep -q "condition"; then
            echo -e "${GREEN}✓${NC} Policy appears to be conditional (may allow tags)"
        else
            echo -e "${YELLOW}⚠${NC} Policy is not conditional (blocks all public access)"
        fi
    else
        echo -e "${GREEN}✓${NC} No domain restriction policy"
    fi

    # Check for tags
    echo ""
    echo -e "${YELLOW}Resource Manager Tags:${NC}"
    TAGS=$(gcloud resource-manager tags bindings list \
        --parent=//run.googleapis.com/projects/$PROJECT_ID/locations/$REGION/services/$SERVICE_NAME \
        --location=$REGION 2>/dev/null)

    if [ -n "$TAGS" ]; then
        echo "$TAGS"
    else
        echo "  No tags attached to this service"
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

    # Test access
    echo ""
    echo -e "${YELLOW}Test Public Access:${NC}"
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

# Function to check if tag key exists
check_tag_key() {
    ORG=$(get_org_id)
    if [ $? -ne 0 ]; then
        return 1
    fi

    gcloud resource-manager tags keys describe allUsersIngress \
        --parent=organizations/$ORG &>/dev/null
    return $?
}

# Function to create tag key and value
create_tags() {
    clear
    echo -e "${BLUE}▶ Step 1: Create Resource Manager Tags${NC}"
    echo ""
    echo "This will create a tag key 'allUsersIngress' and value 'True'"
    echo "that can be used to exempt Cloud Run services from DRS policy."
    echo ""

    ORG=$(get_org_id)
    if [ $? -ne 0 ]; then
        read -p "Press Enter to continue..."
        return 1
    fi

    echo -e "${YELLOW}Organization ID:${NC} $ORG"
    echo ""

    # Check if tag key already exists
    if check_tag_key; then
        echo -e "${GREEN}✓${NC} Tag key 'allUsersIngress' already exists"

        # Get tag key ID
        TAG_KEY_ID=$(gcloud resource-manager tags keys describe allUsersIngress \
            --parent=organizations/$ORG --format="value(name)" 2>/dev/null | cut -d'/' -f2)

        echo -e "${YELLOW}Tag Key ID:${NC} $TAG_KEY_ID"
        echo ""

        # Check if value exists
        if gcloud resource-manager tags values describe True \
            --parent=$ORG/allUsersIngress &>/dev/null; then
            echo -e "${GREEN}✓${NC} Tag value 'True' already exists"

            TAGVALUE_ID=$(gcloud resource-manager tags values describe True \
                --parent=$ORG/allUsersIngress --format="value(name)" 2>/dev/null | cut -d'/' -f2)

            echo -e "${YELLOW}Tag Value ID:${NC} $TAGVALUE_ID"
            echo ""
            echo "Tags are already set up!"
        else
            echo "Creating tag value 'True'..."
            gcloud resource-manager tags values create True \
                --parent=$ORG/allUsersIngress \
                --description="Allow allUsers for internal Cloud Run services"

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓${NC} Tag value created successfully"
            else
                echo -e "${RED}✗${NC} Failed to create tag value"
            fi
        fi
    else
        echo "Creating tag key 'allUsersIngress'..."
        gcloud resource-manager tags keys create allUsersIngress \
            --parent=organizations/$ORG

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Tag key created successfully"
            echo ""

            # Wait a moment for propagation
            sleep 2

            echo "Creating tag value 'True'..."
            gcloud resource-manager tags values create True \
                --parent=$ORG/allUsersIngress \
                --description="Allow allUsers for internal Cloud Run services"

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓${NC} Tag value created successfully"
            else
                echo -e "${RED}✗${NC} Failed to create tag value"
            fi
        else
            echo -e "${RED}✗${NC} Failed to create tag key"
            echo ""
            echo "You may need Organization Administrator or Tag Administrator role."
        fi
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to create conditional DRS policy
create_conditional_drs_policy() {
    clear
    echo -e "${BLUE}▶ Step 2: Create Conditional DRS Policy${NC}"
    echo ""
    echo "This creates a conditional Domain Restricted Sharing policy that:"
    echo "  1. Restricts IAM policies to your domain by default"
    echo "  2. Allows allUsers for resources tagged with 'allUsersIngress=True'"
    echo ""

    ORG=$(get_org_id)
    if [ $? -ne 0 ]; then
        read -p "Press Enter to continue..."
        return 1
    fi

    echo -e "${YELLOW}Organization ID:${NC} $ORG"
    echo ""

    # Get directory customer ID
    echo "Getting your Google Workspace Customer ID..."
    # This might need to be entered manually
    read -p "Enter your Directory Customer ID (or press Enter to skip): " DIRECTORY_CUSTOMER_ID

    if [ -z "$DIRECTORY_CUSTOMER_ID" ]; then
        echo -e "${YELLOW}⚠${NC} Skipping customer ID - policy will allow all domains for tagged resources"
        echo ""

        # Create policy without customer ID restriction
        cat > drs-policy.yaml << EOF
name: organizations/$ORG/policies/iam.allowedPolicyMemberDomains
spec:
  rules:
  - allowAll: true
    condition:
      expression: resource.matchTag("$ORG/allUsersIngress", "True")
      title: allowAllUsersIngress
EOF
    else
        # Create policy with customer ID
        cat > drs-policy.yaml << EOF
name: organizations/$ORG/policies/iam.allowedPolicyMemberDomains
spec:
  rules:
  - values:
      allowedValues:
      - $DIRECTORY_CUSTOMER_ID
  - allowAll: true
    condition:
      expression: resource.matchTag("$ORG/allUsersIngress", "True")
      title: allowAllUsersIngress
EOF
    fi

    echo "Policy file created: drs-policy.yaml"
    echo ""
    echo "Policy content:"
    echo "───────────────────────────────────────────────────────────"
    cat drs-policy.yaml
    echo "───────────────────────────────────────────────────────────"
    echo ""

    read -p "Apply this policy to your organization? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Cancelled."
        read -p "Press Enter to continue..."
        return
    fi

    echo ""
    echo "Applying policy..."
    gcloud org-policies set-policy drs-policy.yaml

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Conditional DRS policy applied successfully"
    else
        echo -e "${RED}✗${NC} Failed to apply policy"
        echo ""
        echo "You may need Organization Policy Administrator role."
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to create conditional ingress policy
create_conditional_ingress_policy() {
    clear
    echo -e "${BLUE}▶ Step 3: Create Conditional Ingress Policy (Optional)${NC}"
    echo ""
    echo "This creates a policy that restricts tagged services to internal-only ingress."
    echo "This ensures services with allUsers can only be accessed internally."
    echo ""

    ORG=$(get_org_id)
    if [ $? -ne 0 ]; then
        read -p "Press Enter to continue..."
        return 1
    fi

    read -p "Do you want to enforce internal-only ingress for tagged services? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Skipped."
        read -p "Press Enter to continue..."
        return
    fi

    # Create ingress policy
    cat > allowedIngress-policy.yaml << EOF
name: organizations/$ORG/policies/run.allowedIngress
spec:
  inheritFromParent: true
  rules:
  - condition:
      expression: resource.matchTag("$ORG/allUsersIngress", "True")
      title: allowallUsersIngress
    values:
      deniedValues:
      - all
      - internal-and-cloud-load-balancing
EOF

    echo "Policy file created: allowedIngress-policy.yaml"
    echo ""
    echo "Policy content:"
    echo "───────────────────────────────────────────────────────────"
    cat allowedIngress-policy.yaml
    echo "───────────────────────────────────────────────────────────"
    echo ""

    echo "Applying policy..."
    gcloud org-policies set-policy allowedIngress-policy.yaml

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Conditional ingress policy applied successfully"
    else
        echo -e "${RED}✗${NC} Failed to apply policy"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to attach tag to Cloud Run service
attach_tag_to_service() {
    clear
    echo -e "${BLUE}▶ Step 4: Attach Tag to Cloud Run Service${NC}"
    echo ""
    echo "This attaches the 'allUsersIngress=True' tag to your Cloud Run service,"
    echo "which exempts it from the Domain Restricted Sharing policy."
    echo ""

    ORG=$(get_org_id)
    if [ $? -ne 0 ]; then
        read -p "Press Enter to continue..."
        return 1
    fi

    echo -e "${YELLOW}Service:${NC} $SERVICE_NAME"
    echo -e "${YELLOW}Region:${NC} $REGION"
    echo -e "${YELLOW}Tag:${NC} $ORG/allUsersIngress/True"
    echo ""

    read -p "Attach tag to service? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Cancelled."
        read -p "Press Enter to continue..."
        return
    fi

    echo ""
    echo "Attaching tag..."
    gcloud resource-manager tags bindings create \
        --tag-value=$ORG/allUsersIngress/True \
        --parent=//run.googleapis.com/projects/$PROJECT_ID/locations/$REGION/services/$SERVICE_NAME \
        --location=$REGION

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Tag attached successfully"
        echo ""
        echo "The service is now exempt from DRS policy!"
    else
        echo -e "${RED}✗${NC} Failed to attach tag"
        echo ""
        echo "Possible reasons:"
        echo "  - You don't have permission to attach tags"
        echo "  - The tag value doesn't exist"
        echo "  - The service doesn't exist"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to enable public access
enable_public_access() {
    clear
    echo -e "${BLUE}▶ Step 5: Enable Public Access${NC}"
    echo ""
    echo "Now that the tag is attached, we can grant allUsers the run.invoker role."
    echo ""

    read -p "Enable public access (allUsers)? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Cancelled."
        read -p "Press Enter to continue..."
        return
    fi

    echo ""
    echo "Granting run.invoker to allUsers..."
    gcloud run services add-iam-policy-binding $SERVICE_NAME \
        --region=$REGION \
        --member="allUsers" \
        --role="roles/run.invoker" \
        --project=$PROJECT_ID

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Public access enabled successfully!"
        echo ""
        echo "Testing public access..."
        sleep 2

        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL/api/health)

        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓${NC} Service is now publicly accessible!"
            echo ""
            echo -e "${CYAN}URL:${NC} $SERVICE_URL"
        else
            echo -e "${YELLOW}⚠${NC} Service returned HTTP $HTTP_CODE"
        fi
    else
        echo -e "${RED}✗${NC} Failed to enable public access"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to run full setup
run_full_setup() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║               Full Setup - All Steps                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "This will run all setup steps:"
    echo "  1. Create Resource Manager tags"
    echo "  2. Create conditional DRS policy"
    echo "  3. Create conditional ingress policy (optional)"
    echo "  4. Attach tag to Cloud Run service"
    echo "  5. Enable public access"
    echo ""

    read -p "Continue with full setup? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        return
    fi

    create_tags
    create_conditional_drs_policy
    create_conditional_ingress_policy
    attach_tag_to_service
    enable_public_access
}

# Main menu loop
while true; do
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       Public Access with Resource Manager Tags - Menu          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Select an option:"
    echo ""
    echo "  ${CYAN}Setup Steps (requires Organization Admin):${NC}"
    echo "  ${GREEN}1)${NC} Run full setup (all steps)"
    echo "  ${GREEN}2)${NC} Step 1: Create Resource Manager tags"
    echo "  ${GREEN}3)${NC} Step 2: Create conditional DRS policy"
    echo "  ${GREEN}4)${NC} Step 3: Create conditional ingress policy (optional)"
    echo ""
    echo "  ${CYAN}Apply to Service:${NC}"
    echo "  ${GREEN}5)${NC} Step 4: Attach tag to Cloud Run service"
    echo "  ${GREEN}6)${NC} Step 5: Enable public access (allUsers)"
    echo ""
    echo "  ${CYAN}Information:${NC}"
    echo "  ${GREEN}7)${NC} Check current status"
    echo "  ${GREEN}8)${NC} View documentation"
    echo ""
    echo "  ${RED}9)${NC} Exit"
    echo ""
    read -p "Enter your choice [1-9]: " choice

    case $choice in
        1) run_full_setup ;;
        2) create_tags ;;
        3) create_conditional_drs_policy ;;
        4) create_conditional_ingress_policy ;;
        5) attach_tag_to_service ;;
        6) enable_public_access ;;
        7) check_status ;;
        8)
            echo ""
            echo "Opening documentation..."
            echo "https://cloud.google.com/blog/topics/developers-practitioners/how-create-public-cloud-run-services-when-domain-restricted-sharing-enforced"
            sleep 2
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
