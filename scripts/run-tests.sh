#!/bin/bash

# Script to run comprehensive test suite

set -e

echo "🧪 Running Comprehensive Test Suite"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Run linter
echo ""
echo "1️⃣ Running Linter..."
if npm run lint; then
    print_status "Lint checks passed"
else
    print_error "Lint checks failed"
    exit 1
fi

# Run type checking
echo ""
echo "2️⃣ Running Type Checks..."
if npm run typecheck; then
    print_status "Type checks passed"
else
    print_error "Type checks failed"
    exit 1
fi

# Run unit tests
echo ""
echo "3️⃣ Running Unit Tests..."
if npm run test; then
    print_status "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Run E2E tests (if requested)
if [ "$1" == "--e2e" ] || [ "$1" == "--all" ]; then
    echo ""
    echo "4️⃣ Running E2E Tests..."
    if npx playwright test; then
        print_status "E2E tests passed"
    else
        print_error "E2E tests failed"
        exit 1
    fi
fi

# Run specific browser tests (if requested)
if [ "$1" == "--browsers" ] || [ "$1" == "--all" ]; then
    echo ""
    echo "5️⃣ Running Cross-Browser Tests..."
    
    echo "  Testing Chrome..."
    npx playwright test --project=chromium
    
    echo "  Testing Firefox..."
    npx playwright test --project=firefox
    
    echo "  Testing Safari..."
    npx playwright test --project=webkit
    
    print_status "Cross-browser tests passed"
fi

# Run performance tests (if requested)
if [ "$1" == "--perf" ] || [ "$1" == "--all" ]; then
    echo ""
    echo "6️⃣ Running Performance Tests..."
    if npx playwright test e2e/performance.spec.ts; then
        print_status "Performance tests passed"
    else
        print_warning "Performance tests had warnings"
    fi
fi

echo ""
echo "===================================="
print_status "All requested tests completed!"
echo ""
echo "Usage:"
echo "  ./scripts/run-tests.sh           # Run linter, typecheck, and unit tests"
echo "  ./scripts/run-tests.sh --e2e     # Include E2E tests"
echo "  ./scripts/run-tests.sh --browsers # Include cross-browser tests"
echo "  ./scripts/run-tests.sh --perf    # Include performance tests"
echo "  ./scripts/run-tests.sh --all     # Run all tests"
