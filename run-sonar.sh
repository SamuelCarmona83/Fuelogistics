#!/bin/zsh
# Script to build and run SonarQube analysis in a disposable container

echo "Building SonarQube analysis container..."
docker build -f Dockerfile.sonar -t sonar-temp .

if [ $? -eq 0 ]; then
  echo "Running SonarQube analysis..."
  docker run --rm sonar-temp | tee sonar-report.txt
  echo "Fetching issues from SonarQube API..."
  curl -s "http://localhost:9000/api/issues/search?projectKeys=Prueba&resolved=false" -H "Authorization: Bearer sqp_e9b6b4171282a781dbb15dde8ace306aa6e57132" > sonar-issues.json
  echo "Analysis complete. See sonar-report.txt for scanner output and sonar-issues.json for raw issues."
else
  echo "Docker build failed. Aborting."
  exit 1
fi
