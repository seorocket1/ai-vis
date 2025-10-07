#!/bin/bash

echo "Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf dist

echo "Cache cleared!"
echo ""
echo "Please:"
echo "1. Stop the dev server (if running)"
echo "2. Run: npm run dev"
echo "3. Hard refresh your browser: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo ""
echo "The import errors should be resolved!"
