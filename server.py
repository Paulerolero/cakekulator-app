"""
Cakekulator - Servidor Local para Pruebas y Uso en Red Local (Android / PC)
Ejecuta este script para abrir la aplicación en tu navegador y celular.
"""

import http.server
import socketserver
import os
import socket
import sys

# Configure UTF-8 for Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    local_ip = get_local_ip()
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("🍰 Cakekulator - App de Pastelería Iniciada con Éxito")
        print("=" * 60)
        print(f"👉 En tu PC:               http://localhost:{PORT}")
        print(f"📱 En tu celular Android:   http://{local_ip}:{PORT}")
        print("=" * 60)
        print("Tip: Abre la dirección en Chrome en tu Android y selecciona")
        print("'Agregar a la pantalla principal' o 'Instalar App' para usarla offline.")
        print("Presiona Ctrl + C para detener el servidor.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
