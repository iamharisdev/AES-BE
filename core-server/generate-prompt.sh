#!/bin/bash

# This script generates a markdown file (prompt.md) containing the contents of all nested .ts files
# from the directories specified as arguments. Each file's content is enclosed in triple backticks
# for proper formatting in markdown.
#
# Usage:
#   ./generate-prompt.sh [directory1] [directory2] ...
#
# Arguments:
#   directory1, directory2, ... : One or more directories whose nested .ts files' contents will be included in the output file.
#
# Output:
#   The script creates or overwrites a file named 'prompt.md' in the current directory.
#   For each .ts file found in the specified directories, the script appends the file path and its contents
#   to 'prompt.md', with the contents enclosed in triple backticks for markdown code block formatting.
#
# Example:
#   ./generate-prompt.sh tests src/routes src/models
#
#   This will generate a 'prompt.md' file containing the contents of all .ts files found in /path/to/dir1 and /path/to/dir2.
#
# Note:
#   If a specified directory does not exist, the script will output an error message to stderr.
#

output_file="prompt.md"
> "$output_file" # Clear the output file if it exists
for dir in "$@"; do
  if [ -d "$dir" ]; then
    find "$dir" -type f -name "*.ts" | while read -r file; do
      echo "$file" >> "$output_file"
      echo '```' >> "$output_file"
      cat "$file" >> "$output_file"
      echo '```' >> "$output_file"
      echo >> "$output_file"
    done
  else
    echo "Directory $dir does not exist" >&2
  fi
done
