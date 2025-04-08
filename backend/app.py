from flask import Flask 
from routes.priority import priority_bp   # This takes the Blueprint object as modular collection of routes

app = Flask (__name__)
app.register_blueprint(priority_bp) #attach to the app

if __name__ == "__main__":
    app.run(debug= True)  #only run if I told you so
