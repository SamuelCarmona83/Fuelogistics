#!/bin/zsh
# Script to build and run SonarQube analysis in a disposable container

echo "Building SonarQube analysis container..."
# Temporarily use sonar-specific dockerignore to include .git
cp .dockerignore .dockerignore.backup 2>/dev/null || true
cp .dockerignore.sonar .dockerignore
docker build -f Dockerfile.sonar -t sonar-temp .
# Restore original dockerignore
mv .dockerignore.backup .dockerignore 2>/dev/null || rm .dockerignore

if [ $? -eq 0 ]; then
  echo "Running SonarQube analysis..."
  docker run --rm sonar-temp | tee sonar-report.txt
  echo "Fetching issues from SonarQube API..."
  curl -s "http://localhost:9000/api/issues/search?projectKeys=Fuelogistics&resolved=false" -H "Authorization: Bearer sqp_e9b6b4171282a781dbb15dde8ace306aa6e57132" > sonar-issues.json
  echo "Analysis complete. See sonar-report.txt for scanner output and sonar-issues.json for raw issues."
else
  echo "Docker build failed. Aborting."
  exit 1
fi
