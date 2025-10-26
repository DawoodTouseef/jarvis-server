import os
import sys
from pathlib import Path
import secrets
import uvicorn
import subprocess
import logging
import socket
import docker
from docker.errors import DockerException, NotFound
from docker.types import DeviceRequest

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
            print(f"[✓] Container '{name}' is already running.")
            return f"'{name}' already running"
        else:
            print(f"[+] Container '{name}' exists but stopped. Starting...")
            container.start()
            return f"'{name}' started"
    except NotFound:
        print(f"[+] Container '{name}' not found. Creating and running...")
        client.containers.run(image, name=name, detach=True, **kwargs)
        return f"'{name}' created and started"

def start_all_services():
    network = "tor_net"
    client = docker.from_env()
    # Create network if not exists
    try:
        client.networks.get(network)
    except NotFound:
        client.networks.create(network)

    responses = []

    run_or_start_container(
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
    responses.append(run_or_start_container(
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
    ))

    responses.append(run_or_start_container(
        name="ollama",
        image="ollama/ollama",
        ports={"11434/tcp": 11434},
        volumes={"ollama": {"bind": "/root/.ollama", "mode": "rw"}},
        network=network,
        device_requests=[
            DeviceRequest(count=-1, capabilities=[["gpu"]])
        ],
    ))

    responses.append(run_or_start_container(
        name="tor",
        image="dockurr/tor",
        ports={"9050/tcp": 9050},
        network=network
    ))
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
        logger.info("Docker is running")   
    except DockerException:
        print("Docker is not running")
        dockers_running= False
    
    pool = Pool(processes=(cpu_count() - 1))
    pool.apply_async(jarvis_server, args=())
    if dockers_running:
        pool.apply_async(start_all_services,args=())
    pool.close()
    pool.join()

if __name__ == "__main__":
    start_server()