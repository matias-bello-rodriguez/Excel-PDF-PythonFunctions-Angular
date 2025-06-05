# start_server.py - Script para iniciar el servidor FastAPI
import uvicorn
import sys
import os

def main():
    """Inicia el servidor FastAPI para extracción de imágenes de Excel"""
    print("=== Excel Image Extractor Service ===")
    print("Iniciando servidor FastAPI...")
    print("URL: http://localhost:8000")
    print("Documentación API: http://localhost:8000/docs")
    print("Press Ctrl+C para detener el servidor")
    print("=" * 40)
    
    try:
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,  # Recarga automática en desarrollo
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario")
    except Exception as e:
        print(f"Error iniciando el servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
