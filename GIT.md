## chỉ cần setup 1 lần duy nhất cho lần đầu tiên push code lên github
git config --global user.email "email_cua_ban@example.com"
git config --global user.name "Ten Cua Ban"

## create a new repository
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/UonlyLiv3own/**repositoryName**.git
git push -u origin main

