#!/bin/bash

# Onboarding Wizard Implementation Verification Script
# Run this after implementation to verify all files are in place

echo "🔍 Verifying Onboarding Wizard Implementation..."
echo ""

# Track verification status
ALL_GOOD=true

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1 (MISSING)"
        ALL_GOOD=false
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
    else
        echo -e "${RED}❌${NC} $1/ (MISSING)"
        ALL_GOOD=false
    fi
}

echo "📁 Checking Directory Structure..."
check_dir "src/features/onboarding"
check_dir "src/features/onboarding/steps"
check_dir "src/routes"
echo ""

echo "📄 Checking New Files (11 TypeScript files)..."
check_file "src/routes/OnboardingGate.tsx"
check_file "src/features/onboarding/OnboardingWizard.tsx"
check_file "src/components/ui/Stepper.tsx"
check_file "src/features/onboarding/steps/StepAccount.tsx"
check_file "src/features/onboarding/steps/StepTestDate.tsx"
check_file "src/features/onboarding/steps/StepDiagnostic.tsx"
check_file "src/features/onboarding/steps/StepPreferences.tsx"
check_file "src/features/onboarding/steps/StepNotifications.tsx"
check_file "src/features/onboarding/steps/StepPlan.tsx"
check_file "src/features/onboarding/steps/StepDone.tsx"
echo ""

echo "🗄️ Checking Database Migration..."
check_file "supabase/migrations/20251005000000_add_onboarding_tracking.sql"
echo ""

echo "📝 Checking Documentation..."
check_file "ONBOARDING_IMPLEMENTATION.md"
check_file "IMPLEMENTATION_SUMMARY.md"
check_file "FILES_CHANGED.md"
echo ""

echo "🔧 Checking Modified Files..."
check_file "src/App.tsx"
check_file "src/pages/Index.tsx"
check_file "src/integrations/supabase/types.ts"
check_file "src/components/ui/index.ts"
echo ""

echo "🔎 Checking Code Patterns..."

# Check if OnboardingGate is imported in App.tsx
if grep -q "import OnboardingGate from" src/App.tsx; then
    echo -e "${GREEN}✅${NC} App.tsx imports OnboardingGate"
else
    echo -e "${RED}❌${NC} App.tsx does not import OnboardingGate"
    ALL_GOOD=false
fi

# Check if root route uses OnboardingGate
if grep -q '<Route path="/" element={<OnboardingGate />}' src/App.tsx; then
    echo -e "${GREEN}✅${NC} Root route uses OnboardingGate"
else
    echo -e "${RED}❌${NC} Root route does not use OnboardingGate"
    ALL_GOOD=false
fi

# Check if types include onboarding columns
if grep -q "onboarding_complete" src/integrations/supabase/types.ts; then
    echo -e "${GREEN}✅${NC} Types include onboarding_complete"
else
    echo -e "${RED}❌${NC} Types missing onboarding_complete"
    ALL_GOOD=false
fi

if grep -q "onboarding_step" src/integrations/supabase/types.ts; then
    echo -e "${GREEN}✅${NC} Types include onboarding_step"
else
    echo -e "${RED}❌${NC} Types missing onboarding_step"
    ALL_GOOD=false
fi

# Check if Stepper is exported
if grep -q "Stepper" src/components/ui/index.ts; then
    echo -e "${GREEN}✅${NC} Stepper exported from ui/index.ts"
else
    echo -e "${YELLOW}⚠️${NC}  Stepper not exported from ui/index.ts (optional)"
fi

echo ""

echo "📊 Code Statistics..."
STEP_FILES=$(find src/features/onboarding/steps -name "*.tsx" 2>/dev/null | wc -l)
echo "   Step components: $STEP_FILES (expected: 7)"

TOTAL_LINES=$(find src/features/onboarding -name "*.tsx" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
echo "   Total lines of code: $TOTAL_LINES"

echo ""

# Final verdict
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🎉 Onboarding wizard implementation verified successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Run the database migration"
    echo "   2. Test new user signup flow"
    echo "   3. Test mid-onboarding resume"
    echo "   4. Test completed user flow"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the output above.${NC}"
    echo ""
    exit 1
fi
