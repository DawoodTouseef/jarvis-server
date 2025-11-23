import os
import sys
from pathlib import Path
import secrets
import uvicorn
import subprocess
import logging
import socket
import docker
from docker.errors import DockerException, NotFound, ImageNotFound
from docker.types import DeviceRequest
from backend.env import OPEN_WEBUI_DIR

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Change to the script's directory
SCRIPT_DIR = Path(__file__).parent.resolve()
os.chdir(SCRIPT_DIR)

# Environment variable defaults
PORT = int(os.getenv("PORT", "8080"))  
HOST = os.getenv("HOST", "0.0.0.0")
WEBUI_SECRET_KEY = os.getenv("WEBUI_SECRET_KEY", "")
WEBUI_JWT_SECRET_KEY = os.getenv("WEBUI_JWT_SECRET_KEY", "")
UVICORN_WORKERS = int(os.getenv("UVICORN_WORKERS", "1"))
WEB_LOADER_ENGINE = os.getenv("WEB_LOADER_ENGINE", "")
WEBUI_SECRET_KEY_FILE = os.getenv("WEBUI_SECRET_KEY_FILE", ".webui_secret_key")
KEY_FILE = Path(WEBUI_SECRET_KEY_FILE)

if not os.path.exists("data"):
    os.makedirs("data",exist_ok=True)


def run_or_start_container(name, image, **kwargs):
    client = docker.from_env()
    try:
        container = client.containers.get(name)
        if container.status == 'running':
            logger.info(f"[✓] Container '{name}' is already running.")
            # Get container details for more informative output
            container.reload()
            ports = container.attrs['NetworkSettings']['Ports']
            port_info = ", ".join([f"{k}->{v[0]['HostPort']}" if v else k for k, v in ports.items()])
            # Safely get image tags
            image_tags = container.image.tags if container.image and hasattr(container.image, 'tags') else []
            image_info = image_tags[0] if image_tags else 'N/A'
            logger.info(f"    Image: {image_info}")
            logger.info(f"    Ports: {port_info}")
            return f"'{name}' already running"
        else:
            logger.info(f"[+] Container '{name}' exists but stopped. Starting...")
            container.start()
            # Wait a moment for container to start
            container.reload()
            return f"'{name}' started"
    except NotFound:
        logger.info(f"[+] Container '{name}' not found. Creating and running...")
        try:
            # Try to pull the image first
            logger.info(f"    Pulling image '{image}'...")
            client.images.pull(image)
            logger.info(f"    [✓] Image '{image}' pulled successfully.")
        except Exception as pull_error:
            logger.warning(f"    [!] Failed to pull image '{image}': {str(pull_error)}")
            logger.info(f"    Checking if image exists locally...")
            try:
                # Check if image exists locally
                client.images.get(image)
                logger.info(f"    [✓] Image '{image}' found locally.")
            except ImageNotFound:
                logger.warning(f"    [!] Image '{image}' not found locally.")
                logger.info(f"    Attempting to create container anyway (Docker may pull automatically)...")
            except Exception as local_check_error:
                logger.warning(f"    [!] Error checking for local image: {str(local_check_error)}")
        
        try:
            container = client.containers.run(image, name=name, detach=True, **kwargs)
            # Wait a moment for container to start
            container.reload()
            logger.info(f"    [✓] Container '{name}' created and started.")
            return f"'{name}' created and started"
        except Exception as run_error:
            logger.error(f"    [✗] Failed to create container '{name}' with image '{image}': {str(run_error)}")
            # Try to provide more specific error information
            if "pull access denied" in str(run_error).lower():
                logger.error(f"    [!] Pull access denied for '{image}'. This might be due to:")
                logger.error(f"        1. The image name is incorrect")
                logger.error(f"        2. You don't have permission to access this image")
                logger.error(f"        3. Docker Hub is unreachable")
                logger.error(f"        4. You might need to log in to Docker Hub")
            elif "not found" in str(run_error).lower():
                logger.error(f"    [!] Image '{image}' not found. Please verify the image name.")
            elif "volume" in str(run_error).lower() or "mount" in str(run_error).lower():
                logger.error(f"    [!] Volume/mount issue detected. This might be due to:")
                logger.error(f"        1. File permissions issues")
                logger.error(f"        2. Path does not exist")
                logger.error(f"        3. Invalid volume specification")
            return f"'{name}' failed: {str(run_error)}"
    except Exception as e:
        logger.error(f"[✗] Failed to manage container '{name}': {str(e)}")
        return f"'{name}' failed: {str(e)}"

def start_all_services():
    network = "tor_net"
    client = docker.from_env()
    # Create network if not exists
    try:
        client.networks.get(network)
        logger.info(f"[✓] Network '{network}' already exists.")
    except NotFound:
        logger.info(f"[+] Creating network '{network}'...")
        client.networks.create(network)
        logger.info(f"[✓] Network '{network}' created.")

    logger.info("Starting Docker services...")
    responses = []

    mariadb_response = run_or_start_container(
        name="mariadb",
        image="mariadb",
        environment={
            "MARIADB_ROOT_PASSWORD": "admin",  # Must be here!
            "MYSQL_DATABASE": "admin",
            "MYSQL_USER": "admin",
            "MYSQL_PASSWORD": "admin"
        },
        volumes={"mariadb_data": {"bind": "/var/lib/mysql", "mode": "rw"}},
        network=network,
        ports={"3306/tcp": 3306},
    )
    responses.append(mariadb_response)
    
    nextcloud_response = run_or_start_container(
        name="nextcloud",
        image="nextcloud",
        ports={"80/tcp": 80},
        environment={
            "MYSQL_PASSWORD": "nextcloud",
            "MYSQL_DATABASE": "nextcloud",
            "MYSQL_USER": "nextcloud",
            "MYSQL_HOST": "mariadb"
        },
        volumes={"nextcloud_data": {"bind": "/var/www/html", "mode": "rw"}},
        network=network
    )
    responses.append(nextcloud_response)

    ollama_response = run_or_start_container(
        name="ollama",
        image="ollama/ollama",
        ports={"11434/tcp": 11434},
        volumes={"ollama": {"bind": "/root/.ollama", "mode": "rw"}},
        network=network,
        device_requests=[
            DeviceRequest(count=-1, capabilities=[["gpu"]])
        ],
    )
    responses.append(ollama_response)

    tor_response = run_or_start_container(
        name="tor",
        image="dockurr/tor",
        ports={"9050/tcp": 9050},
        network=network
    )
    responses.append(tor_response)
    
    # Handle SearxNG with special care for volume mounting
    logger.info("[+] Setting up SearxNG container...")
    settings_yml=os.path.join(OPEN_WEBUI_DIR,"settings.yml")
    try:
        # Check if settings.yml exists, if not create a basic one
        if not os.path.exists(settings_yml):
            logger.info("    Creating default settings.yml for SearxNG...")
            default_settings = """use_default_settings: true

server:
  secret_key: "c8f9e6b2a4d7f3e1b5c9d8a6f2e4b7c1d9e3f8a5b2c7d4e6f1a8b3c5d2e9f4a1"
  limiter: false
  image_proxy: true

search:
  formats:
    - html
    - json


"""
            with open(settings_yml, "w") as f:
                f.write(default_settings)
            logger.info("    [✓] Created default settings.yml")
        
        searxng_response = run_or_start_container(
            name="searxng",
            image="searxng/searxng",
            ports={"8080/tcp": 8081},
            network=network,
            volumes={settings_yml: {"bind": "/etc/searxng/settings.yml", "mode": "ro"}},
            environment={"SEARXNG_BASE_URL": "http://localhost:8081"}
        )
        responses.append(searxng_response)
    except Exception as e:
        logger.error(f"[✗] Failed to set up SearxNG container: {str(e)}")
        responses.append(f"SearxNG setup failed: {str(e)}")
    
    # Log summary of all services
    logger.info("=" * 50)
    logger.info("DOCKER SERVICES STATUS SUMMARY:")
    logger.info("=" * 50)
    for i, response in enumerate(responses, 1):
        logger.info(f"{i}. {response}")
    logger.info("=" * 50)
        
    return {"status": "ok", "details": responses}

def install_playwright():
    """Install Playwright browsers and dependencies if WEB_LOADER_ENGINE is 'playwright'."""
    if WEB_LOADER_ENGINE.lower() == "playwright" and not os.getenv("PLAYWRIGHT_WS_URL"):
        logger.info("Installing Playwright browsers...")
        try:
            subprocess.run(["playwright", "install", "chromium"], check=True)
            subprocess.run(["playwright", "install-deps", "chromium"], check=True)
            logger.info("Playwright browsers installed.")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install Playwright browsers: {e}")
            sys.exit(1)

        # Download NLTK punkt_tab
        try:
            import nltk
            nltk.download("punkt_tab")
            logger.info("NLTK punkt_tab downloaded.")
        except ImportError:
            logger.warning("NLTK not installed. Skipping punkt_tab download.")
        except Exception as e:
            logger.error(f"Failed to download NLTK punkt_tab: {e}")
            sys.exit(1)

def load_or_generate_secret_key():
    """Load WEBUI_SECRET_KEY from file or generate a new one if not provided."""
    global WEBUI_SECRET_KEY
    if not WEBUI_SECRET_KEY and not WEBUI_JWT_SECRET_KEY:
        logger.info("Loading WEBUI_SECRET_KEY from file, not provided as an environment variable.")

        if not KEY_FILE.exists():
            logger.info("Generating WEBUI_SECRET_KEY")
            WEBUI_SECRET_KEY = secrets.token_hex(6)  # 12 characters
            try:
                with open(KEY_FILE, "w") as f:
                    f.write(WEBUI_SECRET_KEY)
                logger.info("WEBUI_SECRET_KEY generated")
            except IOError as e:
                logger.error(f"Failed to write WEBUI_SECRET_KEY to {KEY_FILE}: {e}")
                sys.exit(1)

        logger.info(f"Loading WEBUI_SECRET_KEY from {KEY_FILE}")
        try:
            with open(KEY_FILE, "r") as f:
                WEBUI_SECRET_KEY = f.read().strip()
        except IOError as e:
            logger.error(f"Failed to read WEBUI_SECRET_KEY from {KEY_FILE}: {e}")
            sys.exit(1)

    os.environ["WEBUI_SECRET_KEY"] = WEBUI_SECRET_KEY

# Get your IP dynamically (or use a fixed one)
def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable, just to get your IP
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def jarvis_server():
        """Run the FastAPI server with Uvicorn."""
        install_playwright()
        load_or_generate_secret_key()
        logger.info(f"Starting Uvicorn server on {HOST}:{PORT} with {UVICORN_WORKERS} workers...")
        uvicorn.run(
            "backend.main:app",
            host=HOST,
            port=PORT,
            workers=UVICORN_WORKERS,
            forwarded_allow_ips="*",
            ws="auto",
            log_level="info",
            use_colors=True,
            ws_max_queue=1000,

        )

def start_server():
    """Start the FastAPI server."""
    from multiprocessing import Pool, cpu_count
    dockers_running=True
    try:
        client = docker.from_env()
        logger.info("[✓] Docker daemon is running")   
    except DockerException as e:
        logger.error(f"[✗] Docker is not running or not accessible: {str(e)}")
        logger.info("Please start Docker Desktop or ensure Docker is running.")
        dockers_running= False
    
    pool = Pool(processes=(cpu_count() - 1))
    pool.apply_async(jarvis_server, args=())
    if dockers_running:
        logger.info("Starting Docker services in background...")
        pool.apply_async(start_all_services,args=())
    else:
        logger.warning("Skipping Docker services startup due to Docker not being available.")
    pool.close()
    pool.join()

if __name__ == "__main__":
    start_server()