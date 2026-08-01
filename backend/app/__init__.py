from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from mongoengine import connect
from app.config import Config

bcrypt = Bcrypt()
jwt = JWTManager()
socketio = SocketIO()

def create_app():
    # JWT error handlers for clear 401/422 responses and logging
    from flask_jwt_extended import exceptions as jwt_exceptions
    import logging
    logger = logging.getLogger("jwt")

    app = Flask(__name__)
    app.config.from_object(Config)

    @app.errorhandler(jwt_exceptions.NoAuthorizationError)
    def handle_no_auth_error(e):
        logger.warning(f"JWT NoAuthorizationError: {e}")
        return {'msg': 'Missing or invalid Authorization header'}, 401

    @app.errorhandler(jwt_exceptions.InvalidHeaderError)
    def handle_invalid_header(e):
        logger.warning(f"JWT InvalidHeaderError: {e}")
        return {'msg': 'Invalid Authorization header'}, 401

    @app.errorhandler(jwt_exceptions.WrongTokenError)
    def handle_wrong_token(e):
        logger.warning(f"JWT WrongTokenError: {e}")
        return {'msg': 'Wrong token type'}, 401

    @app.errorhandler(jwt_exceptions.RevokedTokenError)
    def handle_revoked_token(e):
        logger.warning(f"JWT RevokedTokenError: {e}")
        return {'msg': 'Token has been revoked'}, 401

    @app.errorhandler(jwt_exceptions.FreshTokenRequired)
    def handle_fresh_token(e):
        logger.warning(f"JWT FreshTokenRequired: {e}")
        return {'msg': 'Fresh token required'}, 401

    @app.errorhandler(jwt_exceptions.UserLookupError)
    def handle_user_load_error(e):
        logger.warning(f"JWT UserLoadError: {e}")
        return {'msg': 'User not found for token'}, 401

    @app.errorhandler(jwt_exceptions.CSRFError)
    def handle_csrf_error(e):
        logger.warning(f"JWT CSRFError: {e}")
        return {'msg': 'CSRF token missing or invalid'}, 401

    @app.errorhandler(422)
    def handle_unprocessable_entity(e):
        logger.warning(f"422 Unprocessable Entity: {e}")
        # If it's a JWT error, return 401
        if hasattr(e, 'data') and e.data and 'messages' in e.data:
            messages = e.data['messages']
            if 'json' in messages and 'token' in messages['json']:
                return {'msg': 'Invalid or missing token'}, 401
        return {'msg': 'Unprocessable Entity'}, 422
    
    # Initialize extensions
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Initialize SocketIO with CORS
    socketio.init_app(app, 
                     cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                     async_mode='threading')
    
    # Configure CORS - Allow frontend origin
    CORS(app, 
         resources={
             r"/*": {
                 "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                 "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
                 "supports_credentials": True,
                 "expose_headers": ["Content-Type", "Authorization"],
                 "max_age": 3600
             }
         })
    
    # Add after_request handler for additional CORS headers
    @app.after_request
    def after_request(response):
        origin = 'http://localhost:5173'
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    # Connect to MongoDB
    connect(host=app.config['MONGO_URI'])
    
    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.doctor_routes import doctor_bp
    from app.routes.appointment_routes import appointment_bp
    from app.routes.medicine_routes import medicine_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.cart_routes import cart_bp
    from app.routes.order_routes import order_bp
    from app.routes.address_routes import address_bp
    from app.routes.profile_routes import profile_bp
    from app.routes.assessment_routes import assessment_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(medicine_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(address_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(assessment_bp)
    
    from app.routes.player_stats_routes import register_player_stats_routes
    register_player_stats_routes(app)
    from app.controllers.game_controller import game_bp
    app.register_blueprint(game_bp)

    from app.reframe_game import reframe_game_bp
    app.register_blueprint(reframe_game_bp)

    from app.affirmation_room import affirmation_room_bp
    app.register_blueprint(affirmation_room_bp)

    from app.routes.growing_tree_routes import growing_tree_bp
    app.register_blueprint(growing_tree_bp)
    
    # Debug: Print all registered routes
    print('REGISTERED ROUTES:')
    for rule in app.url_map.iter_rules():
        print(rule)
    
    return app
