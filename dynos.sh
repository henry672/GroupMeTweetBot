echo "SCALING APP DYNOS"
heroku ps:scale web=$1 --app=bigbetsbot